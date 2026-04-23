/**
 * GET /api/component-manifest
 *
 * Serves the structured prop manifest for one or more DS components. Consumed
 * by the Studio settings panel (Stage 3 of the highlight-and-comment feature)
 * to decide which control to render for each prop of the currently-selected
 * component.
 *
 * Query:
 *   ?part=three-scene                 single component by data-gds-part
 *   ?name=ThreeScene                  single component by PascalCase name
 *   ?parts=three-scene,video-player   batch
 *   (no query)                        all components — dev/debug only
 *
 * Source of truth is `components/ui/<name>.md` frontmatter; the route just
 * calls `buildComponentManifest()` in lib/component-refs.ts and returns the
 * result. Keep lookups cheap — this endpoint may be hit on every selection
 * change.
 */

import { NextResponse, type NextRequest } from "next/server";
import { buildComponentManifest } from "@gradeui/studio/playbook";

// The playbook package inlines sidecars as a TS string map — no fs access
// needed at runtime, so this route runs fine on the edge if we ever want.
// Keeping it `nodejs` for now to match the rest of the API surface.
export const runtime = "nodejs";

// The manifest is cached at module scope inside the playbook package, so
// per-request work is trivial — no need to layer a response cache on top.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const onlyFor: string[] = [];
  const singlePart = searchParams.get("part");
  const singleName = searchParams.get("name");
  const multiParts = searchParams.get("parts");

  if (singlePart) onlyFor.push(singlePart);
  if (singleName) onlyFor.push(singleName);
  if (multiParts) {
    for (const p of multiParts.split(",").map((s) => s.trim()).filter(Boolean)) {
      onlyFor.push(p);
    }
  }

  const manifest = buildComponentManifest(
    onlyFor.length ? { onlyFor } : undefined
  );

  return NextResponse.json(
    { manifest },
    {
      headers: {
        // Client-side cache for a short window — sidecar edits in dev should
        // still appear promptly, but we don't want every keystroke in the
        // settings panel to re-hit the route. 30s is the sweet spot.
        "Cache-Control": "private, max-age=30",
      },
    }
  );
}
