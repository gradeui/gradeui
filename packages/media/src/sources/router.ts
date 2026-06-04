/**
 * Source resolution router.
 *
 * Picks the right provider for a given `SourceDescriptor`, with per-kind
 * fallback chains. The router is intentionally tiny: providers are tried
 * in order until one returns non-null, and the kind whitelist on each
 * provider gates which chains it appears in.
 *
 * Default chain (see `buildDefaultRouter`):
 *   album    → MusicBrainz   → Picsum
 *   tv-show  → TMDb          → Picsum     (TMDB_API_KEY required for TMDb)
 *   movie    → TMDb          → Picsum     (TMDB_API_KEY required for TMDb)
 *   game     → IGDB          → Picsum     (TWITCH_CLIENT_ID/SECRET required)
 *   book     → OpenLibrary   → Picsum     (no auth)
 *   poster   → Picsum
 *   portrait → Picsum
 *   landscape→ Picsum
 *   product  → Picsum
 *   food     → Picsum
 *   generic  → Picsum
 *   video/audio/embed/3d → no resolution (returns null — these are
 *                          user-provided slots, not auto-fillable)
 *
 * Real-lookup providers (MusicBrainz/TMDb/IGDB/OpenLibrary) return null
 * when their auth env vars are missing — Fill keeps working, just with
 * content-blind Picsum fallbacks. Set the env vars in `.env.local` for
 * real imagery.
 *
 * Pollinations was the prompt-aware default for everything that isn't
 * a real album, but in May 2026 they moved to a x402 paywall (1 free
 * queued request per IP) and started returning 402 JSON instead of an
 * image, so the URLs we previously baked into JSX entries silently
 * stopped rendering. It's removed from the default chain — Picsum
 * (deterministic Lorem Picsum) takes over as the prompt-agnostic
 * placeholder. Provider is still registered and reachable through a
 * custom router for whoever wants to wire up a paid Pollinations
 * account or a different generator (Replicate, fal, etc.).
 *
 * The router intentionally does NOT race providers in parallel —
 * first-hit-wins keeps provider load minimal (we don't fire requests
 * we'll throw away).
 */

import { createMusicBrainzProvider } from "./musicbrainz";
import { createTmdbProvider } from "./tmdb";
import { createOpenLibraryProvider } from "./openlibrary";
import { createIgdbProvider } from "./igdb";
import { createPollinationsUrlProvider } from "./pollinations-url";
import { createPicsumProvider } from "./picsum";
import {
  createGenerativeProvider,
  isGenerativeFillConfigured,
} from "./generative";
import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
  SourceKind,
} from "./types";

export interface SourceRouter {
  /** The providers this router can dispatch to, in priority order. */
  readonly providers: ReadonlyArray<SourceProvider>;
  resolve(source: SourceDescriptor): Promise<SourceResolution | null>;
}

export interface ResolveOptions {
  /** Caller-supplied router; defaults to `buildDefaultRouter()`. */
  router?: SourceRouter;
  /**
   * Per-batch cache. The router stamps a content-hash key from the
   * descriptor and short-circuits duplicates so a screen with three
   * MediaSurfaces pointing at the same album triggers one lookup
   * total. The cache is request-scoped; for a longer-lived global
   * cache, wrap the router in your own LRU.
   */
  cache?: Map<string, SourceResolution | null>;
}

/**
 * One entry in the batched result. `index` mirrors the input array
 * position so the caller can pair the resolution back to the JSX
 * element it walked off.
 */
export interface ResolutionEntry {
  index: number;
  source: SourceDescriptor;
  resolution: SourceResolution | null;
}

/**
 * Resolve a single descriptor — walks the router's provider list in
 * priority order, returning the first non-null hit. Returns `null` if
 * no provider can handle the source (e.g. `kind: "video"`).
 */
export async function resolveMediaSource(
  source: SourceDescriptor,
  opts: ResolveOptions = {},
): Promise<SourceResolution | null> {
  const router = opts.router ?? buildDefaultRouter();
  const cache = opts.cache;

  if (cache) {
    const key = sourceKey(source);
    if (cache.has(key)) return cache.get(key) ?? null;
    const hit = await routerResolve(router, source);
    cache.set(key, hit);
    return hit;
  }
  return routerResolve(router, source);
}

/**
 * Resolve many descriptors in parallel via `Promise.all`. The cache
 * dedupes identical sources within the batch automatically — if two
 * MediaSurfaces ask for the same album, only one MusicBrainz lookup
 * fires.
 */
export async function resolveMediaSources(
  sources: ReadonlyArray<SourceDescriptor>,
  opts: ResolveOptions = {},
): Promise<ResolutionEntry[]> {
  const router = opts.router ?? buildDefaultRouter();
  const cache = opts.cache ?? new Map<string, SourceResolution | null>();
  return Promise.all(
    sources.map(async (source, index): Promise<ResolutionEntry> => {
      const resolution = await resolveMediaSource(source, { router, cache });
      return { index, source, resolution };
    }),
  );
}

async function routerResolve(
  router: SourceRouter,
  source: SourceDescriptor,
): Promise<SourceResolution | null> {
  for (const provider of router.providers) {
    if (!provider.handles.includes(source.kind as SourceKind)) continue;
    try {
      const hit = await provider.resolve(source);
      if (hit) return hit;
    } catch {
      // Provider threw — log nothing (these run in API routes, and
      // chatty logs muddy the stream). Fall through to the next
      // provider in the chain.
    }
  }
  return null;
}

/**
 * Default provider chain. Real-lookup providers first, content-blind
 * Picsum as last-resort fallback. Each real-lookup provider is gated
 * by its own auth (or no auth, for OpenLibrary) and falls through
 * gracefully when its env vars are missing, so the chain works out of
 * the box with just MusicBrainz + OpenLibrary; the rest light up
 * when you set the relevant API keys.
 *
 * Pollinations was previously the prompt-aware second step but has
 * been gated behind a x402 paywall since May 2026 — calling it
 * unauthenticated now returns a JSON 402 instead of an image, which
 * silently broke every URL we'd baked into JSX entries. It's no
 * longer in the default chain. Override by passing your own
 * `SourceRouter` to `resolveMediaSource(s)` if you have a paid
 * Pollinations key or a different generator.
 *
 * The prompt-aware slot is now the **generative provider** (Gemini
 * Flash Image via `generateImage()` — content-hash cached, processed,
 * stored). It joins the chain for poster/portrait/landscape/product/
 * food/generic ahead of Picsum whenever a Gemini key is configured
 * (see `isGenerativeFillConfigured`), and soft-misses to Picsum on any
 * failure. Set `MEDIA_FILL_GENERATE=off` to keep Fill keyless.
 */
export function buildDefaultRouter(): SourceRouter {
  const providers: SourceProvider[] = [
    createMusicBrainzProvider(),
    createTmdbProvider(),
    createIgdbProvider(),
    createOpenLibraryProvider(),
    ...(isGenerativeFillConfigured() ? [createGenerativeProvider()] : []),
    createPicsumProvider(),
  ];
  return {
    providers,
    async resolve(source) {
      return routerResolve(this, source);
    },
  };
}

/**
 * Stable cache / lookup key for a descriptor. Same kind + same identifying
 * fields → same key, irrespective of object identity. Exported so the
 * Studio-side `MediaSurface` can compute the same key client-side and
 * pluck its resolved URL out of the runtime URL map. The two must agree
 * exactly; any change here requires a matching change in the duplicate
 * in `packages/ui/components/ui/media-surface.tsx` (it can't import this
 * directly — `@gradeui/ui` doesn't depend on `@gradeui/media`).
 */
export function sourceKey(source: SourceDescriptor): string {
  switch (source.kind) {
    case "album":
      return `album:${source.artist}|${source.title}|${source.year ?? ""}`;
    case "tv-show":
      return `tv-show:${source.title}|${source.year ?? ""}`;
    case "movie":
      return `movie:${source.title}|${source.year ?? ""}`;
    case "game":
      return `game:${source.title}`;
    case "book":
      return `book:${source.isbn ?? ""}|${source.title ?? ""}|${source.author ?? ""}`;
    case "poster":
      return `poster:${source.title}|${source.year ?? ""}`;
    case "portrait":
      return `portrait:${source.name ?? ""}|${source.role ?? ""}`;
    case "landscape":
      return `landscape:${source.location ?? ""}|${source.mood ?? ""}`;
    case "product":
      return `product:${source.brand ?? ""}|${source.name ?? ""}`;
    case "food":
      return `food:${source.dish ?? ""}|${source.cuisine ?? ""}`;
    case "generic":
      return `generic:${source.prompt}`;
    default:
      return `${source.kind}:`;
  }
}
