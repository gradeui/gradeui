/**
 * MusicBrainz Cover Art Archive provider.
 *
 * Two-hop lookup:
 *   1. MusicBrainz `/release?query=artist:X AND release:Y` → first MBID hit
 *   2. coverartarchive.org/release/{mbid}/front-500 → 307 → real image URL
 *
 * Why this is our default for `album`:
 *   - No API key, no auth header beyond User-Agent.
 *   - Real album covers — not "an AI-generated rendering of what we think
 *     Travelling Without Moving looks like."
 *   - Stable URLs hosted by archive.org; safe to drop into JSX without
 *     re-hosting anything ourselves.
 *
 * Rate limit: 1 request/second per IP. Negligible for human-driven fills
 * from Studio (which batches ~10 surfaces tops per click), but for any
 * future "fill 1000 cards in bulk" workflow we'd need to throttle here.
 *
 * The User-Agent is REQUIRED by the MB acceptable-use policy. They block
 * default fetch UAs. Override via `GRADEUI_MB_USER_AGENT` if running this
 * in a different application — keep the contact URL accurate.
 *
 * Docs: https://musicbrainz.org/doc/Cover_Art_Archive/API
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
} from "./types";

const MB_BASE = "https://musicbrainz.org/ws/2";
const CAA_BASE = "https://coverartarchive.org/release";

const USER_AGENT =
  process.env.GRADEUI_MB_USER_AGENT ??
  "gradeui-studio/0.1 ( https://gradeui.com/contact )";

// Coverart resolution requested at 500px — large enough for hero cards
// (the airbnb-tile-sized 80px slot does fine on 500px source), small
// enough that hotlinking is fast even on cold cache. The archive serves
// /front (full res), /front-250, /front-500, /front-1200.
const COVER_SIZE = "500" as const;

interface MbReleaseHit {
  id: string;
  title?: string;
}

interface MbReleaseSearchResponse {
  releases?: MbReleaseHit[];
}

export function createMusicBrainzProvider(): SourceProvider {
  return {
    id: "musicbrainz-caa",
    handles: ["album"],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      if (source.kind !== "album") return null;
      const { artist, title } = source;
      if (!artist || !title) return null;

      // MB's Lucene query syntax. Quoting both fields prevents word-split
      // matches (e.g. "Random Access Memories" was tokenizing into three
      // separate terms and pulling in irrelevant releases).
      const q = `release:"${escapeLucene(title)}" AND artist:"${escapeLucene(artist)}"`;
      const url = `${MB_BASE}/release?query=${encodeURIComponent(q)}&fmt=json&limit=5`;

      let mbid: string | null = null;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as MbReleaseSearchResponse;
        const hit = (data.releases ?? []).find((r) => r.id);
        mbid = hit?.id ?? null;
      } catch {
        return null;
      }

      if (!mbid) return null;

      // CAA's /front endpoint returns a 307 → final image URL. We don't
      // follow it server-side because (a) we don't need the bytes and
      // (b) leaving it as the redirector URL means the archive can swap
      // the underlying file (multiple sizes, variant fronts) without us
      // baking a specific revision into JSX. The browser follows the
      // redirect on render.
      const caaUrl = `${CAA_BASE}/${mbid}/front-${COVER_SIZE}`;

      // Verify the cover exists — CAA returns 404 for releases with no
      // uploaded art. Without this check we'd patch in URLs that 404 on
      // every page load. HEAD is enough; we don't need the bytes.
      try {
        const head = await fetch(caaUrl, {
          method: "HEAD",
          headers: { "User-Agent": USER_AGENT },
          redirect: "follow",
          signal: AbortSignal.timeout(8_000),
        });
        if (!head.ok) return null;
      } catch {
        return null;
      }

      return {
        url: caaUrl,
        provider: "musicbrainz-caa",
        alt: `${title} — ${artist}`,
      };
    },
  };
}

/**
 * Escape characters Lucene treats as syntax so user-supplied artist/title
 * strings don't break the query. The query above wraps each field in
 * double quotes, so we only need to escape `"` and `\` (the two chars
 * that close-or-escape a quoted phrase).
 */
function escapeLucene(s: string): string {
  return s.replace(/[\\"]/g, "\\$&");
}
