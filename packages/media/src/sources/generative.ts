/**
 * Generative source provider — bridges the prompt-aware `generateImage()`
 * pipeline (Gemini Flash Image by default, see `../index.ts`) into the
 * sourced-imagery router used by Studio's "Fill images" flow.
 *
 * Before this provider existed the fill chain for the prompt-y kinds
 * (poster / portrait / landscape / product / food / generic) fell straight
 * through to Picsum — deterministic but content-blind. This provider sits
 * between the real-lookup providers and Picsum: it composes a generation
 * prompt from the descriptor's structured fields plus the free-text
 * `description` (surfaced from the MediaSurface `alt` / authored by the
 * chat model), generates through `generateImage()` — which gives us the
 * content-hash cache, sharp processing, and storage for free — and returns
 * the stored URL. Any failure (no key, quota, model rotation, network)
 * returns `null`, so the router falls through to Picsum and Fill never
 * breaks.
 *
 * Enablement: `isGenerativeFillConfigured()` — requires a Gemini key
 * (`GEMINI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`) unless
 * `MEDIA_PROVIDER` explicitly selects a different generative provider.
 * Set `MEDIA_FILL_GENERATE=off` to keep Fill on the keyless chain even
 * when a key is present.
 *
 * Import discipline: `generateImage` is pulled in via a *lazy dynamic
 * import* inside `resolve()`. Two reasons:
 *   1. Avoids a static cycle (`../index.ts` re-exports this module).
 *   2. Keeps the sources half of the package importable without dragging
 *      sharp + storage along — the documented contract of `./sources`.
 */

import type {
  GenerateOptions,
  // type-only — erased at runtime, no cycle
} from "../types";
import type {
  SourceDescriptor,
  SourceKind,
  SourceProvider,
  SourceResolution,
} from "./types";

/** Kinds this provider generates for. Real-lookup kinds (album, movie,
 *  tv-show, game, book) are deliberately excluded — generating a fake
 *  cover for a real album is worse than a Picsum placeholder. */
const GENERATIVE_KINDS: ReadonlyArray<SourceKind> = [
  "poster",
  "portrait",
  "landscape",
  "product",
  "food",
  "generic",
];

/**
 * True when the Fill flow should include the generative step. Mirrors the
 * provider-selection logic in `../index.ts` without importing it (cycle).
 */
export function isGenerativeFillConfigured(): boolean {
  if (process.env.MEDIA_FILL_GENERATE === "off") return false;
  const explicit = process.env.MEDIA_PROVIDER;
  // Pollinations has been x402-paywalled since May 2026 — generating
  // through it just burns the request budget on 402 JSON. Don't enable
  // Fill generation unless the active provider can actually deliver.
  if (explicit === "pollinations") return false;
  return Boolean(
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  );
}

/** Per-kind aspect defaults — matched to how these slots typically render. */
const ASPECT_BY_KIND: Partial<Record<SourceKind, GenerateOptions["aspect"]>> = {
  poster: "3:4",
  portrait: "3:4",
  landscape: "16:9",
  product: "1:1",
  food: "4:3",
  generic: "16:9",
};

/**
 * Compose a generation prompt from the descriptor's structured fields.
 * The free-text `description` (when the chat model or user provided one)
 * is appended last — it's the highest-signal intent we have.
 */
export function promptForSource(source: SourceDescriptor): string | null {
  const parts: string[] = [];
  switch (source.kind) {
    case "poster":
      parts.push(
        `Striking poster artwork for "${source.title}"${source.year ? ` (${source.year})` : ""}. Bold composition; stylized title typography is fine.`,
      );
      break;
    case "portrait":
      parts.push(
        `Professional headshot portrait photograph${source.role ? ` of a ${source.role}` : " of a person"}, soft natural lighting, neutral background.`,
      );
      // The name doesn't change what a fictional person looks like, but it
      // varies the prompt — and therefore the content-hash cache key — so a
      // team grid of six portraits yields six different faces.
      if (source.name) parts.push(`Subject: ${source.name}.`);
      break;
    case "landscape":
      parts.push(
        `Scenic landscape photograph${source.location ? ` of ${source.location}` : ""}${source.mood ? `, ${source.mood} mood` : ""}.`,
      );
      break;
    case "product":
      parts.push(
        `Clean studio product photograph${source.name ? ` of ${source.name}` : ""}${source.brand ? ` by ${source.brand}` : ""}, on a neutral seamless background, soft shadows.`,
      );
      break;
    case "food":
      parts.push(
        `Appetizing food photograph${source.dish ? ` of ${source.dish}` : ""}${source.cuisine ? `, ${source.cuisine} cuisine` : ""}, shallow depth of field.`,
      );
      break;
    case "generic":
      parts.push(source.prompt);
      break;
    default:
      return null;
  }
  if ("description" in source && source.description) {
    parts.push(source.description);
  }
  parts.push("Photorealistic, high quality. No watermarks, no UI chrome.");
  return parts.join(" ");
}

/**
 * Tiny concurrency gate. The router resolves a batch via `Promise.all`,
 * so a screen with ten MediaSurfaces would otherwise fire ten Gemini
 * calls at once — fine for the API, unkind to the free-tier quota and to
 * serverless function memory (each result passes through sharp).
 */
const MAX_CONCURRENT = 4;
let active = 0;
const queue: Array<() => void> = [];

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}

export interface GenerativeSourceOptions {
  /** Override the per-kind aspect mapping. */
  aspectByKind?: Partial<Record<SourceKind, GenerateOptions["aspect"]>>;
  /** Cap the longest edge of generated images. Default 1600. */
  maxWidth?: number;
}

export function createGenerativeProvider(
  opts: GenerativeSourceOptions = {},
): SourceProvider {
  const aspects = { ...ASPECT_BY_KIND, ...opts.aspectByKind };

  return {
    id: "generative",
    handles: GENERATIVE_KINDS,

    async resolve(source: SourceDescriptor): Promise<SourceResolution | null> {
      const prompt = promptForSource(source);
      if (!prompt) return null;

      try {
        // Lazy import — see header. Pulls sharp/storage only when a
        // generation actually runs.
        const { generateImage } = await import("../index");
        const result = await withSlot(() =>
          generateImage({
            prompt,
            aspect: aspects[source.kind] ?? "4:3",
            maxWidth: opts.maxWidth ?? 1600,
            format: "webp",
          }),
        );
        return { url: result.url, provider: result.provider };
      } catch {
        // Soft miss — router falls through to Picsum. Generation failures
        // (quota, rotated model name, network) must never break Fill.
        return null;
      }
    },
  };
}
