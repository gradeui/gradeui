/**
 * OpenLibrary provider — real book covers, no auth required.
 *
 * Two paths into a cover:
 *   1. ISBN direct — `https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg`.
 *      Works when the descriptor carries `isbn`. Zero API calls.
 *   2. Title/author search — `https://openlibrary.org/search.json?...`
 *      returns hits with `cover_i` (cover IDs). We pick the first hit
 *      with a cover and build `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg`.
 *
 * OpenLibrary's cover server returns a 1x1 transparent PNG (not a 404!)
 * when no cover exists for the requested key. The undocumented
 * `?default=false` query param flips that to a real 404, which lets
 * the router fall through to Picsum cleanly. Without it, Fill would
 * paint blank squares for every coverless book.
 *
 * Rate limit: OpenLibrary asks for "respectful" use, no hard limit.
 * Covers are served from a separate CDN that doesn't enforce auth.
 *
 * Docs:
 *   https://openlibrary.org/dev/docs/api/covers
 *   https://openlibrary.org/dev/docs/api/search
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
} from "./types";

const COVERS_BASE = "https://covers.openlibrary.org/b";
const SEARCH_BASE = "https://openlibrary.org/search.json";
// L = large (~480px wide). M and S also exist. L matches the size
// we ship from MusicBrainz and TMDb.
const SIZE = "L" as const;
const DEFAULT_FALSE = "?default=false";

interface OlSearchHit {
  cover_i?: number;
  title?: string;
  author_name?: string[];
}

interface OlSearchResponse {
  docs?: OlSearchHit[];
}

export function createOpenLibraryProvider(): SourceProvider {
  return {
    id: "openlibrary",
    handles: ["book"],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      if (source.kind !== "book") return null;

      // Fast path: ISBN-direct URL. We HEAD-check to catch the missing
      // case (covers.openlibrary.org returns 404 with ?default=false).
      if (source.isbn) {
        const isbn = source.isbn.replace(/[^0-9Xx]/g, "");
        const url = `${COVERS_BASE}/isbn/${isbn}-${SIZE}.jpg${DEFAULT_FALSE}`;
        if (await headOk(url)) {
          return {
            url,
            provider: "openlibrary",
            alt: source.title ?? `Book — ISBN ${isbn}`,
          };
        }
      }

      // Search path: title + optional author. We need at least one.
      if (!source.title && !source.author) return null;

      const params = new URLSearchParams();
      if (source.title) params.set("title", source.title);
      if (source.author) params.set("author", source.author);
      params.set("limit", "5");
      params.set("fields", "title,author_name,cover_i");

      let coverId: number | null = null;
      let canonicalTitle: string | undefined;
      let canonicalAuthor: string | undefined;
      try {
        const res = await fetch(`${SEARCH_BASE}?${params.toString()}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as OlSearchResponse;
        const hit = (data.docs ?? []).find((d) => d.cover_i);
        if (!hit?.cover_i) return null;
        coverId = hit.cover_i;
        canonicalTitle = hit.title;
        canonicalAuthor = hit.author_name?.[0];
      } catch {
        return null;
      }

      const url = `${COVERS_BASE}/id/${coverId}-${SIZE}.jpg${DEFAULT_FALSE}`;
      // Skip the HEAD here — search-by-cover_i is reliably present.
      // Saves one round-trip per book slot in the common case.
      return {
        url,
        provider: "openlibrary",
        alt:
          canonicalTitle && canonicalAuthor
            ? `${canonicalTitle} — ${canonicalAuthor}`
            : canonicalTitle ?? source.title,
      };
    },
  };
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(6_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
