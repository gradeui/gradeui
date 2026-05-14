/**
 * Content-hash cache key.
 *
 * The key is derived from every input that influences the *bytes on disk*:
 * prompt, aspect, style, output format, quality, max-width, and the provider
 * id. That means:
 *
 *   - Identical inputs always hit cache (no provider call, no processor work).
 *   - Changing any knob (e.g. webp80 → avif50) yields a different key, so both
 *     artifacts coexist legitimately.
 *   - Swapping the provider invalidates cache automatically.
 *
 * SHA-256 is overkill for cache keys cryptographically but it's free here and
 * makes the keys collision-resistant enough to not have to think about it.
 */

import { createHash } from "node:crypto";
import type { MediaRequest, OutputFormat } from "./types";

export interface CacheKeyInput extends MediaRequest {
  providerId: string;
}

/** Defaults applied before hashing — keeps keys stable across explicit/implicit calls. */
export function applyDefaults(req: MediaRequest) {
  return {
    prompt: req.prompt,
    aspect: req.aspect ?? "16:9",
    style: req.style ?? "",
    format: (req.format ?? "webp") as OutputFormat,
    quality: req.quality ?? 80,
    maxWidth: req.maxWidth ?? 0, // 0 = no resize
  };
}

export function cacheKey(input: CacheKeyInput): string {
  const d = applyDefaults(input);
  const payload = JSON.stringify({
    p: d.prompt,
    a: d.aspect,
    s: d.style,
    f: d.format,
    q: d.quality,
    w: d.maxWidth,
    pid: input.providerId,
  });
  // First 16 bytes (32 hex chars) is plenty — keeps URLs short.
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

/** Filename = `{key}.{ext}` so storage drivers can serve with correct content-type. */
export function cacheFilename(key: string, format: OutputFormat): string {
  return `${key}.${format}`;
}

/** Reverse lookup — extract format from a stored filename. */
export function formatFromFilename(filename: string): OutputFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "webp" || ext === "avif" || ext === "png" || ext === "jpeg") {
    return ext;
  }
  if (ext === "jpg") return "jpeg";
  return null;
}

export const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  webp: "image/webp",
  avif: "image/avif",
  png: "image/png",
  jpeg: "image/jpeg",
};
