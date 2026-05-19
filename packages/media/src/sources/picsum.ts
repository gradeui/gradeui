/**
 * Lorem Picsum provider — instant, deterministic placeholder photos.
 *
 * Pure URL construction; zero network call from our side. `picsum.photos`
 * serves random photographs sourced from Unsplash (per their docs), keyed
 * by a `seed` segment so the same seed always returns the same image.
 *
 * Used as a **last-resort fallback** in the router — kicks in when more
 * specific providers (MusicBrainz, Pollinations) miss or time out. The
 * value here is "the slot is filled with a real-looking photo, even if
 * it's not the right photo." For layout-fidelity work in Studio, that's
 * frequently enough.
 *
 * Trade-offs:
 *   - Pro: zero latency, zero failure mode, no auth, no rate limit.
 *   - Con: not contextually correct. A "Sunlit SoMa loft" picsum URL is
 *     just a random photo seeded by that string — could be a mountain.
 *   - Con: Picsum's underlying photo pool is finite; common alts produce
 *     visually similar results. Studio's wireframe-mode toggle is the
 *     escape hatch — designers who care about specificity stay in
 *     wireframe until they're ready to pay for real generation.
 *
 * Docs: https://picsum.photos/
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
  SourceKind,
} from "./types";

const ENDPOINT_BASE = "https://picsum.photos/seed";

/**
 * Pixel dimensions per kind — mirrors `MediaSurface`'s default aspects so
 * the placeholder photo matches the slot's natural framing. Picsum serves
 * at the exact requested dimensions (server-side crop), so we don't need
 * to overshoot for downsampling.
 */
const KIND_DIMENSIONS: Record<SourceKind, { width: number; height: number }> = {
  album: { width: 800, height: 800 },
  "tv-show": { width: 600, height: 800 },
  movie: { width: 600, height: 800 },
  game: { width: 600, height: 800 },
  book: { width: 600, height: 800 },
  portrait: { width: 600, height: 800 },
  poster: { width: 600, height: 800 },
  product: { width: 800, height: 800 },
  food: { width: 800, height: 800 },
  landscape: { width: 1200, height: 800 },
  "3d": { width: 800, height: 800 },
  generic: { width: 1280, height: 720 },
  // Not auto-fillable — the router skips these before reaching the
  // provider, but defensive defaults don't hurt.
  video: { width: 1280, height: 720 },
  audio: { width: 1280, height: 720 },
  embed: { width: 1280, height: 720 },
};

export function createPicsumProvider(): SourceProvider {
  return {
    id: "picsum",
    handles: [
      "album",
      "tv-show",
      "movie",
      "game",
      "book",
      "portrait",
      "landscape",
      "poster",
      "product",
      "food",
      "generic",
    ],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      const seed = seedFromSource(source);
      if (!seed) return null;
      const dims = KIND_DIMENSIONS[source.kind];
      // URL pattern: /seed/{seed}/{w}/{h}. URL-encoded so seeds containing
      // spaces / punctuation stay intact.
      const url = `${ENDPOINT_BASE}/${encodeURIComponent(seed)}/${dims.width}/${dims.height}`;
      return { url, provider: "picsum" };
    },
  };
}

/**
 * Concatenate the descriptor's identifying fields into a single seed
 * string. The kind is included so the same string used in two different
 * slot kinds doesn't collide (e.g. "Jamiroquai" album vs. "Jamiroquai"
 * portrait would otherwise return the same random photo).
 */
function seedFromSource(source: SourceDescriptor): string | null {
  switch (source.kind) {
    case "album":
      return `album:${source.artist}:${source.title}`;
    case "tv-show":
      return `tv-show:${source.title}:${source.year ?? ""}`;
    case "movie":
      return `movie:${source.title}:${source.year ?? ""}`;
    case "game":
      return `game:${source.title}`;
    case "book":
      return `book:${source.isbn ?? ""}:${source.title ?? ""}:${source.author ?? ""}`;
    case "poster":
      return `poster:${source.title}`;
    case "portrait":
      return `portrait:${source.name ?? ""}:${source.role ?? ""}`;
    case "landscape":
      return `landscape:${source.location ?? ""}:${source.mood ?? ""}`;
    case "product":
      return `product:${source.brand ?? ""}:${source.name ?? ""}`;
    case "food":
      return `food:${source.dish ?? ""}:${source.cuisine ?? ""}`;
    case "generic":
      return `generic:${source.prompt}`;
    default:
      return null;
  }
}
