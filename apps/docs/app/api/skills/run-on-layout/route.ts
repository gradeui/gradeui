/**
 * POST /api/skills/run-on-layout
 *
 * Runs a layout-applicable skill against a saved reference layout. The route
 * knows how to resolve `layoutId` to its scaffold source (for markup-based
 * skills) and to its captured screenshot manifest (for vision-based skills),
 * so the client just sends `{ layoutId, skillId }` and gets back a typed
 * skill output.
 *
 * Per-skill input construction:
 *
 *   - responsive-reviewer  → requires manifest. Reads PNGs from
 *                            public/layout-checks/<id>/, base64-encodes them
 *                            into data URLs (vision models can't fetch
 *                            localhost URLs), passes as `snapshots[]`.
 *   - a11y-reviewer        → uses the JSX scaffold as `markup`. Optionally
 *                            attaches the largest viewport screenshot as
 *                            `outputImage` for color/contrast scoring.
 *   - qa-reviewer          → same shape as a11y-reviewer.
 *
 * Body:    { layoutId: string; skillId: SupportedSkill; threshold?: number }
 * Response: { skillId, layoutId, output, durationMs }
 *
 * NOTE: Auth + per-user rate limiting were removed for the un-gated /skills
 * flow (Ali's call). Before this surface is publicly deployed, re-add an
 * `auth()` check at the top of POST() and key the rate limit by user.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  getSkill,
  runSkill,
  type A11yReviewerInput,
  type QaReviewerInput,
  type ResponsiveReviewerInput,
} from "@gradeui/skills";
import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook";
import {
  manifestPath,
  snapshotPath,
  type LayoutManifest,
  type ManifestSnapshot,
} from "@/lib/skills/load-layouts";

export const maxDuration = 60;

/**
 * Skills supported by this route. Adding one means writing a builder below
 * and adding it to `INPUT_BUILDERS`.
 */
const SUPPORTED_SKILLS = [
  "responsive-reviewer",
  "a11y-reviewer",
  "qa-reviewer",
] as const;
type SupportedSkill = (typeof SUPPORTED_SKILLS)[number];

/** Whether a skill needs a captured manifest, or whether markup alone is fine. */
const REQUIRES_MANIFEST: Record<SupportedSkill, boolean> = {
  "responsive-reviewer": true,
  "a11y-reviewer": false,
  "qa-reviewer": false,
};

// ─── Per-skill input builders ──────────────────────────────────────────────

async function snapshotToDataUrl(snapshotFile: string): Promise<string> {
  const bytes = await readFile(snapshotPath(snapshotFile));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

/** Pick the widest captured snapshot — best for color/contrast & QA reviews. */
function widestSnapshot(manifest: LayoutManifest): ManifestSnapshot | null {
  const captured = manifest.snapshots.filter(
    (s): s is ManifestSnapshot & { file: string } => typeof s.file === "string",
  );
  if (captured.length === 0) return null;
  return captured.reduce((widest, s) =>
    s.viewportWidth > widest.viewportWidth ? s : widest,
  );
}

async function buildResponsiveReviewerInput(
  layoutId: string,
  ctx: { manifest: LayoutManifest; scaffold: string; threshold?: number },
): Promise<ResponsiveReviewerInput> {
  const captured = ctx.manifest.snapshots.filter(
    (s): s is ManifestSnapshot & { file: string } => typeof s.file === "string",
  );
  if (captured.length < 2) {
    throw new Error(
      `Manifest for "${layoutId}" has fewer than 2 successful captures (${captured.length}). Re-run check:layouts.`,
    );
  }

  const snapshots = await Promise.all(
    captured.map(async (s) => ({
      viewportWidth: s.viewportWidth,
      imageUrl: await snapshotToDataUrl(s.file),
      consoleErrors: s.consoleErrors,
    })),
  );

  return {
    snapshots,
    pageTitle: layoutId,
    threshold: ctx.threshold ?? 80,
  };
}

async function buildA11yReviewerInput(
  _layoutId: string,
  ctx: { manifest: LayoutManifest | null; scaffold: string; threshold?: number },
): Promise<A11yReviewerInput> {
  const widest = ctx.manifest ? widestSnapshot(ctx.manifest) : null;
  return {
    markup: ctx.scaffold,
    outputImage: widest ? await snapshotToDataUrl(widest.file) : undefined,
    threshold: ctx.threshold ?? 85,
    waivers: undefined,
  };
}

async function buildQaReviewerInput(
  layoutId: string,
  ctx: { manifest: LayoutManifest | null; scaffold: string; threshold?: number },
): Promise<QaReviewerInput> {
  const widest = ctx.manifest ? widestSnapshot(ctx.manifest) : null;
  return {
    markup: ctx.scaffold,
    outputImage: widest ? await snapshotToDataUrl(widest.file) : undefined,
    pageBrief: `Reference layout: ${layoutId}`,
    threshold: ctx.threshold ?? 90,
  };
}

type InputBuilder = (
  layoutId: string,
  ctx: { manifest: LayoutManifest | null; scaffold: string; threshold?: number },
) => Promise<unknown>;

const INPUT_BUILDERS: Record<SupportedSkill, InputBuilder> = {
  "responsive-reviewer": (id, ctx) => {
    if (!ctx.manifest) {
      throw new Error(`responsive-reviewer requires a manifest for "${id}".`);
    }
    return buildResponsiveReviewerInput(id, {
      manifest: ctx.manifest,
      scaffold: ctx.scaffold,
      threshold: ctx.threshold,
    });
  },
  "a11y-reviewer": buildA11yReviewerInput,
  "qa-reviewer": buildQaReviewerInput,
};

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Parse body.
  let body: { layoutId?: unknown; skillId?: unknown; threshold?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.layoutId || typeof body.layoutId !== "string") {
    return NextResponse.json(
      { error: "`layoutId` is required (string)." },
      { status: 400 },
    );
  }
  if (!body.skillId || typeof body.skillId !== "string") {
    return NextResponse.json(
      { error: "`skillId` is required (string)." },
      { status: 400 },
    );
  }
  if (!(SUPPORTED_SKILLS as readonly string[]).includes(body.skillId)) {
    return NextResponse.json(
      {
        error: `\`skillId\` "${body.skillId}" not supported on layouts. Supported: ${SUPPORTED_SKILLS.join(", ")}.`,
      },
      { status: 400 },
    );
  }
  const skillId = body.skillId as SupportedSkill;

  let threshold: number | undefined;
  if (body.threshold !== undefined) {
    if (
      typeof body.threshold !== "number" ||
      body.threshold < 0 ||
      body.threshold > 100
    ) {
      return NextResponse.json(
        { error: "`threshold` must be a number between 0 and 100." },
        { status: 400 },
      );
    }
    threshold = body.threshold;
  }

  // Resolve scaffold source from REFERENCE_LAYOUTS — server-side only because
  // the scaffold strings are large and shouldn't ride down to the client.
  const layout = REFERENCE_LAYOUTS.find((l) => l.id === body.layoutId);
  if (!layout) {
    return NextResponse.json(
      { error: `Unknown layoutId "${body.layoutId}".` },
      { status: 404 },
    );
  }

  // Read manifest if it exists. Skills that REQUIRE_MANIFEST will 404 on
  // missing; markup-only skills run fine without it (with reduced fidelity
  // on color/contrast / image-validity dimensions).
  let manifest: LayoutManifest | null = null;
  const mPath = manifestPath(body.layoutId);
  if (existsSync(mPath)) {
    try {
      const raw = await readFile(mPath, "utf8");
      manifest = JSON.parse(raw) as LayoutManifest;
    } catch (err) {
      return NextResponse.json(
        {
          error: `Manifest for "${body.layoutId}" is unreadable: ${err instanceof Error ? err.message : "unknown error"}`,
        },
        { status: 500 },
      );
    }
  } else if (REQUIRES_MANIFEST[skillId]) {
    return NextResponse.json(
      {
        error: `${skillId} requires a manifest. Run \`pnpm -F @gradeui/docs check:layouts --layout ${body.layoutId}\`.`,
      },
      { status: 404 },
    );
  }

  // Build skill input.
  let input: unknown;
  try {
    input = await INPUT_BUILDERS[skillId](body.layoutId, {
      manifest,
      scaffold: layout.scaffold,
      threshold,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to build skill input.",
      },
      { status: 400 },
    );
  }

  // Resolve skill + run.
  let skill;
  try {
    skill = await getSkill(skillId);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : `Unknown skill: ${skillId}`,
      },
      { status: 404 },
    );
  }

  const startedAt = Date.now();
  try {
    const output = await runSkill(skill, { input: input as never });
    return NextResponse.json({
      skillId,
      layoutId: body.layoutId,
      output,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error(
      `[/api/skills/run-on-layout] ${skillId} on ${body.layoutId}`,
      err,
    );
    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json(
        {
          error: "Invalid input for skill.",
          details: (err as { issues: unknown }).issues,
        },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Skill run failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
