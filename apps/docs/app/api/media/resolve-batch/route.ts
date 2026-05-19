/**
 * POST /api/media/resolve-batch
 *
 * Companion to /api/media/resolve. This route takes a flat list of
 * `SourceDescriptor`s (collected from the live DOM, not parsed from JSX)
 * and returns a `Record<sourceKey, url>` map suitable for stuffing into
 * the iframe's runtime URL map. This is the path Studio's "Fill images"
 * button uses for any real chat-generated screen, since the model almost
 * always emits `.map(item => <MediaSurface source={{ ... item ... }} />)`
 * — sources with runtime values that the static JSX walker can't see.
 *
 * Wire path:
 *   1. Canvas posts `grade:collect-media-sources` to the iframe.
 *   2. The iframe agent walks `[data-media-source]`, returns descriptors.
 *   3. Canvas POSTs those descriptors here.
 *   4. We resolve via the same router as the static path (MB → Pollinations
 *      → Picsum), dedup'd within the batch.
 *   5. Canvas posts `grade:set-media-urls` back to the iframe with the map.
 *   6. MediaSurface re-reads `window.__gradeMediaUrls` and the <img> paints.
 *
 * No keys required for any provider in the default chain — safe to wire
 * on every Vercel preview without secrets configuration.
 */

import { NextResponse } from "next/server";
import {
  resolveMediaSources,
  sourceKey,
  type SourceDescriptor,
} from "@gradeui/media";

export const runtime = "nodejs";

interface RequestBody {
  sources?: SourceDescriptor[];
}

interface ResolveBatchResponse {
  /** `sourceKey(descriptor)` → resolved URL. Missing entries weren't
   *  resolvable (no MB hit, no Pollinations response, etc.) — caller
   *  shows them as `skipped` in its diagnostics pill. */
  urls: Record<string, string>;
  /** Number of inputs we found URLs for. */
  filled: number;
  /** Number of inputs that ran through the router and returned null. */
  skipped: number;
  /** Provider attribution counts for the filled set. */
  filledBy: Record<string, number>;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const sources = Array.isArray(body.sources) ? body.sources : [];
  if (sources.length === 0) {
    const empty: ResolveBatchResponse = {
      urls: {},
      filled: 0,
      skipped: 0,
      filledBy: {},
    };
    return NextResponse.json(empty);
  }

  // Light shape check — the router already tolerates missing fields per
  // kind, but a missing `kind` would crash sourceKey before the router
  // even runs. Filter and remember the skipped count for the response.
  const validSources: SourceDescriptor[] = [];
  let invalidCount = 0;
  for (const s of sources) {
    if (s && typeof s === "object" && typeof (s as { kind?: unknown }).kind === "string") {
      validSources.push(s);
    } else {
      invalidCount += 1;
    }
  }

  const resolutions = await resolveMediaSources(validSources);

  const urls: Record<string, string> = {};
  const filledBy: Record<string, number> = {};
  let filled = 0;
  let skipped = invalidCount;

  for (const entry of resolutions) {
    if (!entry.resolution) {
      skipped += 1;
      continue;
    }
    const key = sourceKey(entry.source);
    urls[key] = entry.resolution.url;
    filled += 1;
    filledBy[entry.resolution.provider] =
      (filledBy[entry.resolution.provider] ?? 0) + 1;
  }

  const response: ResolveBatchResponse = { urls, filled, skipped, filledBy };
  return NextResponse.json(response);
}
