/**
 * POST /api/media/resolve
 *
 * Receives a JSX source string from Studio's "Fill images" button, walks
 * it for `<MediaSurface ... source={...} />` elements with static source
 * descriptors, resolves each via the @gradeui/media source router (MB →
 * Pollinations → Picsum), and returns the JSX patched with `src="..."`
 * attributes plus a small diagnostics object.
 *
 * Single round-trip per click — N parallel provider lookups under the
 * hood, dedup'd by descriptor content so a screen with three identical
 * album slots triggers one MB call. Dynamic sources (variable refs,
 * template strings) are reported as `skipped` so the UI can offer the
 * user the per-slot regenerate path later.
 *
 * Server-only — the route runs in Node (TS compiler API + the source
 * router both need that), and is safe to keep behind the existing
 * `runtime: "nodejs"` default. The free providers don't require any
 * environment variables (MusicBrainz uses a UA we set in code,
 * Pollinations is keyless, Picsum is keyless), so this is wireable on
 * Vercel preview/branch builds with no secrets configuration.
 */

import { NextResponse } from "next/server";
import {
  resolveMediaSources,
  type ResolutionEntry,
} from "@gradeui/media";
import { findMediaSurfaces, applyFills } from "@/lib/media-fill";

export const runtime = "nodejs";

interface RequestBody {
  /** The JSX source string of the design to fill. */
  jsx?: string;
}

interface ResolveResponse {
  jsx: string;
  /** How many MediaSurfaces we attempted to fill (static + had a source). */
  attempted: number;
  /** How many were patched with src= in the response. */
  filled: number;
  /** How many had a source but couldn't be statically resolved or matched. */
  skipped: number;
  /** Per-skip breakdown so the UI can explain "3 dynamic, 1 unknown kind". */
  skipReasons: Record<string, number>;
  /** Provider attribution per filled slot — handy for showing in the UI. */
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

  const jsx = body.jsx;
  if (typeof jsx !== "string" || !jsx.trim()) {
    return NextResponse.json(
      { error: "Missing `jsx` in request body" },
      { status: 400 },
    );
  }

  // Static walk: find every MediaSurface, record which have fillable
  // sources and which were skipped.
  const matches = findMediaSurfaces(jsx);

  // Build the descriptor list to send to the resolver, remembering which
  // match each entry came from so we can stitch the URL back to it.
  const fillable = matches.filter(
    (m) => m.source !== null && !m.alreadyFilled,
  );
  const sources = fillable.map((m) => m.source!).filter(Boolean);

  const resolutions: ResolutionEntry[] =
    sources.length > 0
      ? await resolveMediaSources(sources)
      : [];

  // Stitch resolutions back onto matches.
  const fills = fillable.map((match, idx) => {
    const resolution = resolutions[idx]?.resolution ?? null;
    return { match, url: resolution?.url ?? null };
  });

  // Diagnostics — split skip reasons so the UI can be specific.
  const skipReasons: Record<string, number> = {};
  let skipped = 0;
  for (const m of matches) {
    if (!m.hasSource) continue; // not a fill target at all
    if (m.alreadyFilled) continue; // intentionally not filled
    if (m.source && fills.find((f) => f.match === m && f.url)) continue;
    if (m.source && !fills.find((f) => f.match === m && f.url)) {
      // Static descriptor but the resolver returned null for it (e.g.
      // album with no MB hit). Lump under "no-result".
      skipReasons["no-result"] = (skipReasons["no-result"] ?? 0) + 1;
      skipped += 1;
      continue;
    }
    const reason = m.skipReason ?? "unknown";
    skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
    skipped += 1;
  }

  // Provider breakdown for the UI (e.g. "3 via musicbrainz, 4 via pollinations").
  const filledBy: Record<string, number> = {};
  for (let i = 0; i < resolutions.length; i++) {
    const r = resolutions[i]?.resolution;
    if (!r) continue;
    filledBy[r.provider] = (filledBy[r.provider] ?? 0) + 1;
  }

  const patched = applyFills(jsx, fills);

  const response: ResolveResponse = {
    jsx: patched,
    attempted: fillable.length,
    filled: fills.filter((f) => f.url).length,
    skipped,
    skipReasons,
    filledBy,
  };
  return NextResponse.json(response);
}
