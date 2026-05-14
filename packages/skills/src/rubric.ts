/**
 * Shared rubric primitive — the common output shape every review skill returns.
 *
 * Why it lives here and not in each skill: the orchestrator (in @gradeui/studio
 * compose pipeline) applies *uniform policies* across reviewer output —
 * auto-fix, gate, retry, surface to user. That only works if every reviewer
 * agrees on a shape. So the type is shared, not skill-specific.
 *
 * The skill author still chooses dimension *names* and weights. They don't
 * choose the result shape.
 *
 * Severity vocabulary (deliberate; matches lint-tool conventions):
 *   - critical → block ship regardless of score
 *   - major    → fix before ship; surfaces to user if not auto-fixable
 *   - minor    → nice to fix; auto-applied if `autoFixable`
 *   - polish   → cosmetic; surfaced as suggestions only, never gates
 *
 * Pass criteria (computed in `evaluateRubric()`):
 *   `passed` = overallScore >= threshold AND no critical issues.
 */

import { z } from "zod";

export const severitySchema = z.enum(["critical", "major", "minor", "polish"]);
export type Severity = z.infer<typeof severitySchema>;

export const rubricDimensionSchema = z.object({
  name: z.string().describe("Short label, e.g. 'layout fidelity'"),
  score: z.number().min(0).max(100),
  weight: z
    .number()
    .min(0)
    .max(1)
    .describe("Contribution to overall score; dimensions sum to 1"),
  notes: z.string().describe("One-sentence justification for the score"),
});
export type RubricDimension = z.infer<typeof rubricDimensionSchema>;

export const rubricIssueSchema = z.object({
  dimension: z.string().describe("Which dimension this issue affects"),
  severity: severitySchema,
  description: z.string(),
  /** What to do about it. Phrase as an imperative ("Change X to Y"). */
  suggestedFix: z.string().optional(),
  /**
   * True if the orchestrator can apply `suggestedFix` deterministically
   * without another model call (e.g. swap a CSS variable, set a missing alt).
   */
  autoFixable: z.boolean().optional(),
  /** Optional CSS selector pinpointing where the issue lives in the markup. */
  selector: z.string().optional(),
});
export type RubricIssue = z.infer<typeof rubricIssueSchema>;

export const rubricResultSchema = z.object({
  /** Weighted aggregate of dimension scores, 0-100. */
  overallScore: z.number().min(0).max(100),
  /** Pass bar for this run (skill default unless overridden by caller). */
  threshold: z.number().min(0).max(100),
  /** True iff overallScore >= threshold AND no critical issues. */
  passed: z.boolean(),
  dimensions: z.array(rubricDimensionSchema).min(1),
  issues: z.array(rubricIssueSchema),
});
export type RubricResult = z.infer<typeof rubricResultSchema>;

/**
 * Compute `overallScore` and `passed` from dimensions + issues. Use this in
 * unit tests or as a defensive recomputation step — *don't* trust the model's
 * own arithmetic on `overallScore`.
 */
export function evaluateRubric(args: {
  dimensions: RubricDimension[];
  issues: RubricIssue[];
  threshold: number;
}): { overallScore: number; passed: boolean } {
  const totalWeight = args.dimensions.reduce((s, d) => s + d.weight, 0);
  if (totalWeight === 0) return { overallScore: 0, passed: false };

  const weighted =
    args.dimensions.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight;
  const overallScore = Math.round(weighted * 10) / 10;
  const hasCritical = args.issues.some((i) => i.severity === "critical");
  const passed = overallScore >= args.threshold && !hasCritical;

  return { overallScore, passed };
}

/**
 * Verdict the orchestrator derives from a RubricResult. Keep this as a pure
 * function — the orchestrator's policy lives one layer up but it always reads
 * the same way.
 */
export type Verdict =
  | { kind: "ship" }
  | { kind: "auto-fix"; issues: RubricIssue[] }
  | { kind: "surface-to-user"; issues: RubricIssue[] }
  | { kind: "retry-with-feedback"; issues: RubricIssue[] }
  | { kind: "block"; reason: string };

export function deriveVerdict(
  result: RubricResult,
  opts: { retriesRemaining: number },
): Verdict {
  const critical = result.issues.filter((i) => i.severity === "critical");
  if (critical.length > 0) {
    return {
      kind: "block",
      reason: `${critical.length} critical issue(s): ${critical
        .map((i) => i.description)
        .join("; ")}`,
    };
  }

  if (result.passed) {
    if (result.issues.length === 0) return { kind: "ship" };

    const autoFixable = result.issues.filter((i) => i.autoFixable);
    if (autoFixable.length === result.issues.length) {
      return { kind: "auto-fix", issues: autoFixable };
    }

    const significant = result.issues.filter(
      (i) => i.severity !== "polish" && !i.autoFixable,
    );
    if (significant.length > 0) {
      return { kind: "surface-to-user", issues: significant };
    }
    return { kind: "ship" }; // only polish-level non-auto-fixables
  }

  if (opts.retriesRemaining > 0) {
    return { kind: "retry-with-feedback", issues: result.issues };
  }

  return {
    kind: "block",
    reason: `Score ${result.overallScore} below threshold ${result.threshold} after retries exhausted`,
  };
}
