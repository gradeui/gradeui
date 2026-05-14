/**
 * @gradeui/skills — public entrypoint.
 *
 * Exports:
 *   - The skill registry: a lazy map of `id → ComposeSkill` for every built-in.
 *     `getSkill(id)` and `listSkills()` are the discovery API.
 *   - `runSkill(skill, opts)` — invoke a loaded skill against a typed input.
 *   - Types: `ComposeSkill`, `SkillFrontmatter`, `RunSkillOptions`, etc.
 *   - Per-skill type exports for typed callers.
 *
 * Adding a new skill:
 *   1. Create `src/skills/<id>/SKILL.md` (frontmatter + system prompt).
 *   2. Create `src/skills/<id>/schema.ts` (zod inputSchema + outputSchema, optional formatInput).
 *   3. Create `src/skills/<id>/index.ts` exporting `load<Name>Skill()`.
 *   4. Register it in BUILTINS below.
 *
 * No orchestrator changes needed — the compose pipeline picks the skill up by id.
 */

import type { ComposeSkill } from "./types";
import { loadA11yReviewerSkill } from "./skills/a11y-reviewer";
import { loadBrandReviewerSkill } from "./skills/brand-reviewer";
import { loadFidelityGraderSkill } from "./skills/fidelity-grader";
import { loadImageDescriberSkill } from "./skills/image-describer";
import { loadQaReviewerSkill } from "./skills/qa-reviewer";
import { loadResponsiveReviewerSkill } from "./skills/responsive-reviewer";

export type {
  ComposeSkill,
  FormatInput,
  ProviderId,
  SkillFrontmatter,
  SkillInputPart,
  SkillSchemaModule,
} from "./types";
export type {
  ImageDescriberInput,
  ImageDescriberOutput,
} from "./skills/image-describer";
export type {
  FidelityGraderInput,
  FidelityGraderOutput,
} from "./skills/fidelity-grader";
export type {
  A11yReviewerInput,
  A11yReviewerOutput,
} from "./skills/a11y-reviewer";
export type {
  BrandReviewerInput,
  BrandReviewerOutput,
} from "./skills/brand-reviewer";
export type {
  QaReviewerInput,
  QaReviewerOutput,
} from "./skills/qa-reviewer";
export type {
  ResponsiveReviewerInput,
  ResponsiveReviewerOutput,
  ViewportSnapshot,
} from "./skills/responsive-reviewer";

export { runSkill, type RunSkillOptions } from "./runner";
export { loadSkill } from "./loader";
export {
  deriveVerdict,
  evaluateRubric,
  rubricDimensionSchema,
  rubricIssueSchema,
  rubricResultSchema,
  severitySchema,
  type RubricDimension,
  type RubricIssue,
  type RubricResult,
  type Severity,
  type Verdict,
} from "./rubric";

/**
 * The static registry of built-in skills. Each entry is a loader function so
 * SKILL.md files are read on-demand (and so bundlers don't try to evaluate
 * filesystem reads at import time).
 */
const BUILTINS: Record<string, () => Promise<ComposeSkill>> = {
  "image-describer": loadImageDescriberSkill as () => Promise<ComposeSkill>,
  "fidelity-grader": loadFidelityGraderSkill as () => Promise<ComposeSkill>,
  "a11y-reviewer": loadA11yReviewerSkill as () => Promise<ComposeSkill>,
  "brand-reviewer": loadBrandReviewerSkill as () => Promise<ComposeSkill>,
  "qa-reviewer": loadQaReviewerSkill as () => Promise<ComposeSkill>,
  "responsive-reviewer": loadResponsiveReviewerSkill as () => Promise<ComposeSkill>,
};

const cache = new Map<string, ComposeSkill>();

/** Resolve a skill by id. Cached after first load. */
export async function getSkill(id: string): Promise<ComposeSkill> {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = BUILTINS[id];
  if (!loader) {
    throw new Error(
      `[@gradeui/skills] Unknown skill: ${id}. Known: ${Object.keys(BUILTINS).join(", ")}`,
    );
  }
  const skill = await loader();
  cache.set(id, skill);
  return skill;
}

/** List all built-in skills (frontmatter only — cheap). */
export async function listSkills(): Promise<ComposeSkill["frontmatter"][]> {
  const skills = await Promise.all(
    Object.keys(BUILTINS).map((id) => getSkill(id)),
  );
  return skills.map((s) => s.frontmatter);
}
