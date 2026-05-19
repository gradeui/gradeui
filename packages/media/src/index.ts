/**
 * @gradeui/media — public entry point.
 *
 * Single function `generateImage()` composes:
 *   provider (Gemini)  →  processor (sharp)  →  storage (local-tmp | vercel-blob)
 *
 * with a content-hash cache so repeated calls with identical inputs are
 * served from storage with zero provider/processor work.
 *
 * Usage (server-side only — never call from a client component):
 *
 *     import { generateImage } from "@gradeui/media";
 *
 *     const { url } = await generateImage({
 *       prompt: "A surfboard on a sun-bleached wooden floor",
 *       aspect: "4:3",
 *       maxWidth: 1600,
 *     });
 */

import { applyDefaults, cacheFilename, cacheKey } from "./cache";
import { processImage } from "./process/sharp-pipeline";
import { createGeminiProvider } from "./providers/gemini";
import { createPollinationsProvider } from "./providers/pollinations";
import { getStorage } from "./storage";
import type {
  MediaProvider,
  MediaRequest,
  MediaResult,
} from "./types";

export type {
  AspectRatio,
  GenerateOptions,
  MediaProvider,
  MediaRequest,
  MediaResult,
  OutputFormat,
  ProcessOptions,
  ProviderResult,
  StorageDriver,
} from "./types";

export { getStorage, setStorage } from "./storage";
export { cacheKey, cacheFilename, formatFromFilename, MIME_BY_FORMAT } from "./cache";

// Sourced-imagery surface — keyless providers (MusicBrainz, Pollinations
// URL, Picsum) and the per-hint router. Used by Studio's "Fill images"
// flow, kept separate from the generative `generateImage()` path so
// consumers can pull it in without pulling sharp + Vercel Blob along.
export {
  resolveMediaSource,
  resolveMediaSources,
  buildDefaultRouter,
  sourceKey,
  createMusicBrainzProvider,
  createPollinationsUrlProvider,
  createPicsumProvider,
  type SourceKind,
  type SourceDescriptor,
  type SourceResolution,
  type SourceProvider,
  type SourceRouter,
  type ResolveOptions,
  type ResolutionEntry,
} from "./sources";

let cachedProvider: MediaProvider | null = null;

/**
 * Resolve the default provider.
 *
 * Selection order:
 *   1. `MEDIA_PROVIDER=gemini` env var → Gemini Flash Image (requires key)
 *   2. `MEDIA_PROVIDER=pollinations` env var → Pollinations (keyless)
 *   3. Default: **Pollinations** — keyless, free, always works
 *
 * Pollinations is the default because it has no setup tax: no key, no
 * billing, no Google account region lockouts. Quality is more variable than
 * Gemini's Nano Banana but the package works out of the box, which is
 * worth more than peak quality during iteration.
 *
 * Switch to Gemini once you've got a working AI Studio key + free-tier-eligible
 * project: set `MEDIA_PROVIDER=gemini` plus either `GEMINI_API_KEY` or
 * `GOOGLE_GENERATIVE_AI_API_KEY`.
 */
function getDefaultProvider(): MediaProvider {
  if (cachedProvider) return cachedProvider;

  const explicit = process.env.MEDIA_PROVIDER;

  if (explicit === "gemini") {
    const apiKey =
      process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[@gradeui/media] MEDIA_PROVIDER=gemini but no key set. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY, or unset MEDIA_PROVIDER to fall back to Pollinations.",
      );
    }
    cachedProvider = createGeminiProvider({ apiKey });
    return cachedProvider;
  }

  // Default and explicit "pollinations" both land here.
  cachedProvider = createPollinationsProvider();
  return cachedProvider;
}

/** Test / customization seam. Override the default Gemini provider. */
export function setProvider(provider: MediaProvider) {
  cachedProvider = provider;
}

/**
 * Inspect the active provider without forcing a generation. Useful for UI
 * surfaces that want to show the user *which* provider their next request
 * will hit (e.g. the /media page header). Resolves the provider lazily on
 * first call, so calling this is also what initializes the cache.
 */
export function getActiveProviderId(): string {
  return getDefaultProvider().id;
}

export async function generateImage(req: MediaRequest): Promise<MediaResult> {
  const provider = getDefaultProvider();
  const storage = getStorage();
  const defaults = applyDefaults(req);

  const key = cacheKey({ ...req, providerId: provider.id });
  const filename = cacheFilename(key, defaults.format);

  // Cache hit? Skip the provider + processor entirely. The provider id
  // attributed to this hit is the one currently active — the cache key
  // already encodes the originating provider id, so this is consistent.
  const existing = await storage.resolve(filename);
  if (existing) {
    return {
      url: existing,
      key,
      format: defaults.format,
      cached: true,
      provider: provider.id,
    };
  }

  // Generate → process → store.
  const raw = await provider.generate({
    prompt: req.prompt,
    aspect: defaults.aspect,
    style: req.style,
  });

  const processed = await processImage(raw.buffer, {
    format: defaults.format,
    quality: defaults.quality,
    maxWidth: defaults.maxWidth || undefined,
  });

  const url = await storage.write(filename, processed.buffer, processed.contentType);

  return {
    url,
    key,
    format: defaults.format,
    cached: false,
    provider: provider.id,
  };
}
