/**
 * Gemini Flash Image provider — informally "Nano Banana".
 *
 * Uses the REST endpoint directly rather than `@google/genai` to keep the
 * package dependency-light. If we end up needing more of the SDK surface
 * (function calling, streaming, multi-modal chains), swap to the SDK.
 *
 * Free tier: requires a Google AI Studio key (https://aistudio.google.com/),
 * set as GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY. As of mid-2026 the
 * free tier ships 500 requests/day on the GA model.
 *
 * **Model name churn — read this before debugging "404 model not found":**
 * Google rotates model names through `-preview` → GA → newer-`-preview`
 * cycles regularly. The original "Nano Banana" preview was
 * `gemini-2.5-flash-image-preview`; it went GA as `gemini-2.5-flash-image`
 * (mid-2026). A newer Nano Banana 2 ships as `gemini-3.1-flash-image-preview`.
 * If a name shifts again, **don't** patch the default below — set
 * `GEMINI_IMAGE_MODEL=<new-name>` in env or pass `model` to the factory.
 * The default tracks GA names only.
 */

import type { GenerateOptions, MediaProvider, ProviderResult } from "../types";

const ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/** Default model — GA, not preview. Track stable names here only. */
const DEFAULT_MODEL = "gemini-2.5-flash-image";

/** Map our aspect tokens to the size hints the model honors. */
const ASPECT_HINT: Record<NonNullable<GenerateOptions["aspect"]>, string> = {
  "1:1": "Square (1:1) framing.",
  "4:3": "Landscape 4:3 framing.",
  "3:4": "Portrait 3:4 framing.",
  "16:9": "Wide landscape 16:9 framing.",
  "9:16": "Tall portrait 9:16 framing.",
};

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType: string; data: string };
      }>;
    };
  }>;
  error?: { message: string };
}

export interface GeminiProviderOptions {
  apiKey: string;
  /**
   * Override the model id. Resolution order: this option →
   * `GEMINI_IMAGE_MODEL` env var → `DEFAULT_MODEL`. The env var is the
   * intended escape hatch for users when Google rotates a name and we
   * haven't patched the default yet.
   */
  model?: string;
}

export function createGeminiProvider(opts: GeminiProviderOptions): MediaProvider {
  const model =
    opts.model ?? process.env.GEMINI_IMAGE_MODEL ?? DEFAULT_MODEL;

  return {
    id: `gemini:${model}`,

    async generate(req: GenerateOptions): Promise<ProviderResult> {
      const aspect = req.aspect ?? "16:9";
      const stylePrefix = req.style ? `${req.style}. ` : "";
      const promptText = `${stylePrefix}${req.prompt}\n\n${ASPECT_HINT[aspect]}`;

      const url = `${ENDPOINT_BASE}/${model}:generateContent`;

      const res = await fetch(`${url}?key=${encodeURIComponent(opts.apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            responseModalities: ["IMAGE"],
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        // 404 almost always means the model name has rotated. Surface the
        // env-var escape hatch in the error so the next person debugging
        // doesn't have to read the source.
        if (res.status === 404) {
          throw new Error(
            `[gemini] 404 — model "${model}" not found. Google rotates these names; set GEMINI_IMAGE_MODEL=<current-id> in env. Server: ${text.slice(0, 300)}`,
          );
        }
        throw new Error(
          `[gemini] ${res.status} ${res.statusText}: ${text.slice(0, 500)}`,
        );
      }

      const json = (await res.json()) as GeminiResponse;

      if (json.error) {
        throw new Error(`[gemini] ${json.error.message}`);
      }

      const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!part?.inlineData) {
        throw new Error("[gemini] no image part returned in response");
      }

      return {
        buffer: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "image/png",
      };
    },
  };
}
