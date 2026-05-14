/**
 * /skills — the skills review surface.
 *
 * v0 surfaces the **layout-library reviewer**: pick a reference layout that
 * has captured screenshots (manifest from `scripts/check-layouts.mjs`),
 * pick an applicable skill (today: responsive-reviewer), run it, see the
 * rubric. Re-runs show in-session score deltas so the user can validate
 * whether a fix actually moved the needle.
 *
 * Per-design / Studio in-progress reviewing is a separate surface (planned;
 * see `apps/docs/STUDIO-SKILLS-PLAN.md` for the architecture options).
 *
 * Currently un-gated — see the NOTE block below for the auth re-add plan
 * before this surface is publicly deployed.
 */

import { loadLayouts } from "@/lib/skills/load-layouts";
import { SkillsExplorer } from "@/components/skills/skills-explorer";

export const metadata = {
  title: "Skills — Grade",
  description:
    "Run review skills (responsive, accessibility, brand, QA) over Grade reference layouts and see rubric-graded results.",
};

// NOTE: This page is intentionally un-gated for now — Ali wants to validate
// the skills flow without login friction. When this surface goes public, add
// `auth()` + a sign-in CTA back here, and re-add the auth checks in the
// `/api/skills/run-on-layout` route (and the older `/api/skills/{run,list}`
// + `/api/media/generate` routes if they're still relevant). The routes
// currently use empty user keys for rate limiting, which means no actual
// rate limiting until auth comes back.

export default async function SkillsPage() {
  const layouts = await loadLayouts();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Skills</h1>
            <p className="text-sm text-muted-foreground">
              Run review skills over reference layouts and see rubric-graded
              results.
            </p>
          </div>
        </div>
      </header>
      <SkillsExplorer layouts={layouts} />
    </div>
  );
}
