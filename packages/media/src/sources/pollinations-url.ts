/**
 * Pollinations.ai URL-mode provider.
 *
 * Sibling of `../providers/pollinations.ts` — same upstream, different
 * shape. The provider in `../providers/` fetches the bytes server-side
 * (so we can run them through sharp + Vercel Blob). This one returns
 * just the URL — the BROWSER fetches the image when it paints the
 * `<img>`. No server round-trip on the bytes, no storage, no Buffer.
 *
 * Why this is the v1 default for non-album slots:
 *   - Truly keyless (Pollinations still allows anonymous calls in 2026).
 *   - Prompt-aware: an `alt` like "Sunlit SoMa loft" produces a
 *     plausible interior shot, not a random photo.
 *   - Free. Aligns with `GRADE_FREE_TIER_ONLY=1`.
 *
 * Trade-offs we accept at this tier:
 *   - First request to a cold cache can take 15-30s. The browser will
 *     show MediaSurface's tiered placeholder underneath until the image
 *     loads — graceful by design.
 *   - Watermark unless `POLLINATIONS_NO_LOGO=1` is set (some accounts
 *     need a referrer; default off so we stay keyless out of the box).
 *
 * Hint-to-style mapping: we steer the prompt by hint so a `portrait`
 * alt produces a portrait-framed result and a `food` alt is shot like
 * food photography. The style suffix is a few words, not a full
 * art-director brief — Pollinations' Flux backbone reads intent fine
 * with light direction.
 */

import type {
  SourceDescriptor,
  SourceProvider,
  SourceResolution,
  SourceKind,
} from "./types";

const ENDPOINT_BASE = "https://image.pollinations.ai/prompt";

/**
 * Pixel dimensions per kind. Aspect mirrors the `HINT_DEFAULT_ASPECT`
 * mapping in `MediaSurface` so the generated image matches the slot's
 * default framing. The router/JSX walker doesn't currently pass through
 * the resolved aspect, so we infer from kind alone — fine for v1, can
 * thread the actual `aspect` later if the model overrides.
 */
const KIND_DIMENSIONS: Record<SourceKind, { width: number; height: number }> = {
  album: { width: 1024, height: 1024 },       // square
  portrait: { width: 768, height: 1024 },     // 3:4
  poster: { width: 768, height: 1024 },       // 3:4
  product: { width: 1024, height: 1024 },     // square
  food: { width: 1024, height: 1024 },        // square
  landscape: { width: 1536, height: 1024 },   // wide-ish
  "3d": { width: 1024, height: 1024 },
  generic: { width: 1280, height: 720 },      // 16:9 video-shape default
  // The remaining three aren't auto-fillable; the router short-circuits
  // before reaching us. Dimensions here are defensive defaults only.
  video: { width: 1280, height: 720 },
  audio: { width: 1280, height: 720 },
  embed: { width: 1280, height: 720 },
};

/**
 * Style suffix appended to the prompt per kind. Steers Flux toward the
 * right framing/aesthetic without an explicit aspect-ratio token (which
 * Pollinations doesn't honor — width/height in the URL is what counts).
 */
const KIND_STYLE: Partial<Record<SourceKind, string>> = {
  album: "album cover art, square format, high contrast",
  portrait: "portrait photograph, natural lighting, shallow depth of field",
  landscape: "landscape photograph, golden hour, wide angle",
  poster: "movie poster, dramatic composition, vertical format",
  product: "product photograph, white background, studio lighting",
  food: "food photograph, top-down, natural light, appetizing",
  generic: "photograph",
};

export function createPollinationsUrlProvider(): SourceProvider {
  const model = process.env.POLLINATIONS_MODEL ?? "flux";
  const noLogo = process.env.POLLINATIONS_NO_LOGO === "1";

  return {
    id: "pollinations-url",
    // Pollinations handles everything fillable. The router still consults
    // more specific providers first (MusicBrainz for album), so we only
    // get hit on miss or as the default for the per-photo hints.
    handles: [
      "album",
      "portrait",
      "landscape",
      "poster",
      "product",
      "food",
      "generic",
    ],

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      const prompt = promptFromSource(source);
      if (!prompt) return null;

      const dims = KIND_DIMENSIONS[source.kind];
      const style = KIND_STYLE[source.kind];
      const fullPrompt = style ? `${style}. ${prompt}` : prompt;

      const params = new URLSearchParams({
        width: String(dims.width),
        height: String(dims.height),
        model,
        // Deterministic seed from prompt — same prompt → same image, so
        // a re-fill on the same JSX is idempotent.
        seed: String(deterministicSeed(fullPrompt)),
      });
      if (noLogo) params.set("nologo", "true");

      const url = `${ENDPOINT_BASE}/${encodeURIComponent(fullPrompt)}?${params.toString()}`;
      return { url, provider: "pollinations-url" };
    },
  };
}

/**
 * Turn a SourceDescriptor into a single prompt string. We weight the
 * most identifying fields first since Pollinations truncates very long
 * prompts.
 */
function promptFromSource(source: SourceDescriptor): string | null {
  switch (source.kind) {
    case "album":
      return `${source.title} by ${source.artist}${source.year ? ` (${source.year})` : ""}`;
    case "poster":
      return `${source.title}${source.year ? ` (${source.year})` : ""}`;
    case "portrait": {
      const parts = [source.name, source.role].filter(Boolean);
      return parts.length ? parts.join(", ") : "person";
    }
    case "landscape": {
      const parts = [source.location, source.mood].filter(Boolean);
      return parts.length ? parts.join(", ") : "landscape";
    }
    case "product": {
      const parts = [source.brand, source.name].filter(Boolean);
      return parts.length ? parts.join(" ") : "product";
    }
    case "food": {
      const parts = [source.dish, source.cuisine].filter(Boolean);
      return parts.length ? parts.join(", ") : "food";
    }
    case "generic":
      return source.prompt;
    default:
      return null;
  }
}

/**
 * dbj2 — deterministic, collision-resistant-enough for a 32-bit
 * Pollinations seed. We mod into a manageable range so the URL stays
 * short.
 */
function deterministicSeed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0) % 1_000_000;
}
