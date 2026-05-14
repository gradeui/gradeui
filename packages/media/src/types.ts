/**
 * Public types for the @gradeui/media package.
 *
 * The package is structured as three composable concerns:
 *   - **Provider** — talks to the upstream model (Gemini Flash Image, etc.) and
 *     returns raw image bytes.
 *   - **Processor** — resizes / converts format / compresses (via sharp).
 *   - **Storage** — persists the processed bytes and returns a stable public URL.
 *
 * `generateImage()` (see ./index.ts) wires the three together with a content-hash
 * cache so repeated calls with identical inputs are O(1) lookups.
 */

/** Aspect ratio token. The provider maps these to its own size primitives. */
export type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

/** Output formats supported by the sharp processor. */
export type OutputFormat = "webp" | "avif" | "png" | "jpeg";

/** Inputs that affect *what* the model generates. Goes to the provider. */
export interface GenerateOptions {
  /** Free-text prompt sent to the image model. */
  prompt: string;
  /** Aspect ratio. Defaults to "16:9" for marketing / hero use. */
  aspect?: AspectRatio;
  /** Optional style hint appended to the prompt (e.g. "photoreal", "flat illustration"). */
  style?: string;
}

/** Inputs that affect *how* we store the result. Goes to the processor. */
export interface ProcessOptions {
  /** Output format. Defaults to "webp" — best size/quality/compatibility trade-off. */
  format?: OutputFormat;
  /** Quality 1-100. Defaults to 80. Ignored for png. */
  quality?: number;
  /** Optional max width in px — image is resized down to this if larger. */
  maxWidth?: number;
}

/** Combined input to `generateImage()`. */
export interface MediaRequest extends GenerateOptions, ProcessOptions {}

/** Result returned to callers. */
export interface MediaResult {
  /** Public URL (local API route in dev, blob CDN URL in prod). */
  url: string;
  /** The cache key — useful for deduping batch requests on the caller side. */
  key: string;
  /** Format we actually wrote (after defaults applied). */
  format: OutputFormat;
  /** True if this came from cache (no provider call, no processor work). */
  cached: boolean;
  /**
   * The provider id that produced this image (e.g. "pollinations:flux",
   * "gemini:gemini-2.5-flash-image"). For cache hits, this is the provider
   * id from when the bytes were originally generated — the cache key
   * includes the provider id, so cache hits always reflect actual lineage.
   */
  provider: string;
}

/** Raw bytes returned by a provider, plus metadata so the processor can dispatch. */
export interface ProviderResult {
  buffer: Buffer;
  /** MIME type of the raw bytes (almost always image/png from Gemini). */
  mimeType: string;
}

/** A swap-in image generation provider. */
export interface MediaProvider {
  /** Stable identifier — embedded in the cache key so a model swap invalidates cache. */
  readonly id: string;
  generate(options: GenerateOptions): Promise<ProviderResult>;
}

/** A swap-in storage backend (local fs, Vercel Blob, R2, etc.). */
export interface StorageDriver {
  /** Stable identifier for diagnostics. */
  readonly id: string;
  /** Returns the public URL for `key` if present, else null. Should be cheap. */
  resolve(key: string): Promise<string | null>;
  /** Persist `buffer` at `key`. Returns the public URL. */
  write(key: string, buffer: Buffer, contentType: string): Promise<string>;
}
