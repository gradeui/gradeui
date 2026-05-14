/**
 * Image processing pipeline.
 *
 * Providers (Gemini etc.) return uncompressed PNG — typically 1–2 MB per image.
 * The pipeline:
 *   1. (optional) resize down to `maxWidth`, preserving aspect.
 *   2. encode to the requested output format at the requested quality.
 *
 * WebP @ q=80 is the default — typically 5–15× smaller than the source PNG
 * with no perceptible quality loss, and 99%+ browser support. AVIF squeezes
 * harder but encodes slower.
 *
 * Sharp is what Next.js's image optimizer uses internally, so it's already a
 * known-good dependency on Vercel.
 */

import sharp from "sharp";
import type { OutputFormat, ProcessOptions } from "../types";

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  format: OutputFormat;
}

export async function processImage(
  input: Buffer,
  opts: ProcessOptions,
): Promise<ProcessedImage> {
  const format: OutputFormat = opts.format ?? "webp";
  const quality = opts.quality ?? 80;

  let pipeline = sharp(input, { failOn: "warning" });

  if (opts.maxWidth && opts.maxWidth > 0) {
    pipeline = pipeline.resize({
      width: opts.maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
    case "avif":
      pipeline = pipeline.avif({ quality, effort: 4 });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case "png":
      // PNG quality is lossless; sharp's `quality` here drives palette/zlib effort.
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
      break;
  }

  const buffer = await pipeline.toBuffer();
  return {
    buffer,
    contentType: `image/${format}`,
    format,
  };
}
