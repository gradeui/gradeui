/**
 * POST /api/media/generate
 *
 * Image generation endpoint. The route is intentionally thin: it validates
 * the request shape, then delegates to @gradeui/media. Provider keys never
 * leak past this layer.
 *
 * Body shape (JSON):
 *   {
 *     prompt: string;
 *     aspect?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
 *     style?: string;
 *     format?: "webp" | "avif" | "png" | "jpeg";
 *     quality?: number;     // 1-100
 *     maxWidth?: number;
 *   }
 *
 * Response:
 *   { url: string; key: string; format: string; cached: boolean }
 *
 * NOTE: Auth + rate limiting were removed for the un-gated /media flow
 * (matches the un-gated /skills routes). Before this surface is publicly
 * deployed, re-add `auth()` and key the rate limit by user.
 */

import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@gradeui/media";
import type { MediaRequest } from "@gradeui/media";

// Image generation is slow-ish (2-6s on Gemini). Default route timeout on
// Vercel Hobby is 10s, which is enough; bump to 30s here as headroom in
// case sharp encoding spikes.
export const maxDuration = 30;

const VALID_ASPECTS = new Set(["1:1", "4:3", "3:4", "16:9", "9:16"]);
const VALID_FORMATS = new Set(["webp", "avif", "png", "jpeg"]);

export async function POST(request: NextRequest) {
  // Validate body.
  let body: Partial<MediaRequest>;
  try {
    body = (await request.json()) as Partial<MediaRequest>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "`prompt` is required (string)." },
      { status: 400 },
    );
  }
  if (body.prompt.length > 2000) {
    return NextResponse.json(
      { error: "`prompt` exceeds 2000 characters." },
      { status: 400 },
    );
  }
  if (body.aspect && !VALID_ASPECTS.has(body.aspect)) {
    return NextResponse.json(
      { error: `\`aspect\` must be one of ${[...VALID_ASPECTS].join(", ")}.` },
      { status: 400 },
    );
  }
  if (body.format && !VALID_FORMATS.has(body.format)) {
    return NextResponse.json(
      { error: `\`format\` must be one of ${[...VALID_FORMATS].join(", ")}.` },
      { status: 400 },
    );
  }
  if (body.quality !== undefined) {
    if (
      typeof body.quality !== "number" ||
      body.quality < 1 ||
      body.quality > 100
    ) {
      return NextResponse.json(
        { error: "`quality` must be a number between 1 and 100." },
        { status: 400 },
      );
    }
  }
  if (body.maxWidth !== undefined) {
    if (
      typeof body.maxWidth !== "number" ||
      body.maxWidth < 16 ||
      body.maxWidth > 4096
    ) {
      return NextResponse.json(
        { error: "`maxWidth` must be a number between 16 and 4096." },
        { status: 400 },
      );
    }
  }

  // Generate.
  try {
    const result = await generateImage(body as MediaRequest);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/media/generate]", err);
    const message =
      err instanceof Error ? err.message : "Image generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
