/**
 * Pollinations.ai provider — keyless image generation.
 *
 * No API key required. The public endpoint at `image.pollinations.ai/prompt/<text>`
 * returns generated PNG/JPEG bytes directly. Quality varies more than Nano
 * Banana but it always works — no billing setup, no quota dance, no account
 * region lockouts.
 *
 * Used as the default provider in `@gradeui/media` so the package works out
 * of the box. Set `MEDIA_PROVIDER=gemini` to opt back into Gemini Flash Image.
 *
 * Trade-offs vs Gemini:
 *   - Pro: keyless, free, no rate-limit-zero billing surprises
 *   - Con: lower fidelity for marketing-grade imagery
 *   - Con: cold-start latency can spike to 15-30s on the public endpoint
 *
 * Docs: https://github.com/pollinations/pollinations
 */

import type { GenerateOptions, MediaProvider, ProviderResult } from "../types";

const ENDPOINT_BASE = "https://image.pollinations.ai/prompt";

/**
 * Map aspect tokens to width/height pixels. Pollinations honors width+height
 * exactly; we pick sane defaults that play well with the sharp resize step
 * downstream (which can downscale but not usefully upscale).
 */
const ASPECT_DIMENSIONS: Record<NonNullable<GenerateOptions["aspect"]>, {
  width: number;
  height: number;
}> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1280, height: 960 },
  "3:4": { width: 960, height: 1280 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
};

/** Pollinations model variants. "flux" is a strong default. */
const DEFAULT_MODEL = "flux";

export interface PollinationsProviderOptions {
  /**
   * Override the model name. Common options as of 2026: "flux", "flux-realism",
   * "flux-anime", "flux-3d", "turbo". See pollinations docs for the live list.
   */
  model?: string;
  /**
   * Append `nologo=true` to suppress the Pollinations watermark. Some accounts
   * require a referrer/token for this to work; default off so the package
   * is keyless-and-functional out of the box.
   */
  noLogo?: boolean;
}

export function createPollinationsProvider(
  opts: PollinationsProviderOptions = {},
): MediaProvider {
  const model = opts.model ?? process.env.POLLINATIONS_MODEL ?? DEFAULT_MODEL;
  const noLogo = opts.noLogo ?? false;

  return {
    id: `pollinations:${model}`,

    async generate(req: GenerateOptions): Promise<ProviderResult> {
      const aspect = req.aspect ?? "16:9";
      const { width, height } = ASPECT_DIMENSIONS[aspect];

      // Style hint goes ahead of the prompt — Pollinations doesn't have a
      // separate "style" knob, so we prepend it inline.
      const stylePrefix = req.style ? `${req.style}. ` : "";
      const promptText = `${stylePrefix}${req.prompt}`;

      const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        model,
        // Deterministic-ish: same prompt+aspect+model → same seed → same image.
        // Pollinations randomizes if seed is omitted; we pin so the cache
        // layer's content-hash stays meaningful.
        seed: "42",
      });
      if (noLogo) params.set("nologo", "true");

      const url = `${ENDPOINT_BASE}/${encodeURIComponent(promptText)}?${params}`;

      // Pollinations queues 1 request per IP at a time on the free tier and
      // returns 429 if a previous request hasn't drained yet. Retry with
      // exponential backoff (2s → 4s → 8s) so a quick double-click or a
      // race with the previous gen doesn't tank the whole flow. Non-429
      // errors throw immediately — they're not transient.
      const RETRY_DELAYS_MS = [2_000, 4_000, 8_000];
      let lastError: string | null = null;

      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const res = await fetch(url, {
          // Pollinations cold-start can take 15-30s; give it room before the
          // route handler's own timeout kills us.
          signal: AbortSignal.timeout(45_000),
        });

        if (res.ok) {
          const buffer = Buffer.from(await res.arrayBuffer());
          const mimeType = res.headers.get("content-type") ?? "image/jpeg";
          return { buffer, mimeType };
        }

        const text = await res.text().catch(() => "");

        // Only retry on 429; everything else is permanent.
        if (res.status !== 429 || attempt === RETRY_DELAYS_MS.length) {
          throw new Error(
            `[pollinations] ${res.status} ${res.statusText}: ${text.slice(0, 300)}`,
          );
        }

        lastError = text.slice(0, 200);
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAYS_MS[attempt]),
        );
      }

      // Unreachable — the loop either returns or throws.
      throw new Error(
        `[pollinations] retries exhausted. Last error: ${lastError ?? "unknown"}`,
      );
    },
  };
}
