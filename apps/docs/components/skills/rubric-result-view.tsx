"use client";

/**
 * RubricResultView — renders a `RubricResult` from `@gradeui/skills`.
 *
 * The shape is shared across all review skills (a11y, brand, qa, fidelity,
 * responsive) so this component is reused for all of them. Three layers:
 *
 *   1. Header  — overall score, threshold, pass/fail badge, optional delta
 *                vs. a previous run
 *   2. Dimensions — bar per dimension showing score + weight, with notes
 *   3. Issues — grouped by severity, with description, suggestedFix, and
 *               selector. autoFixable flag is surfaced as a chip; actual
 *               application is left to the parent (this component is pure
 *               view).
 *
 * Design system note: uses CSS custom properties from the docs site theme
 * (`--primary`, `--destructive`, `--muted`, etc.) for color, never hex.
 * Severity → token mapping is centralized so it stays consistent.
 */

import { cn } from "@/lib/utils";
import type { RubricResult, Severity } from "@gradeui/skills";

interface RubricResultViewProps {
  result: RubricResult;
  /** Optional previous overall score for delta display ("78 → 91 △ +13"). */
  previousScore?: number;
  className?: string;
}

const SEVERITY_TOKEN: Record<Severity, { bg: string; fg: string; label: string }> = {
  critical: {
    bg: "bg-destructive/10",
    fg: "text-destructive",
    label: "Critical",
  },
  major: {
    bg: "bg-orange-500/10",
    fg: "text-orange-600 dark:text-orange-400",
    label: "Major",
  },
  minor: {
    bg: "bg-amber-500/10",
    fg: "text-amber-600 dark:text-amber-400",
    label: "Minor",
  },
  polish: {
    bg: "bg-muted",
    fg: "text-muted-foreground",
    label: "Polish",
  },
};

const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor", "polish"];

export function RubricResultView({
  result,
  previousScore,
  className,
}: RubricResultViewProps) {
  const delta =
    typeof previousScore === "number"
      ? Math.round((result.overallScore - previousScore) * 10) / 10
      : null;

  const groupedIssues = SEVERITY_ORDER.flatMap((sev) => {
    const list = result.issues.filter((i) => i.severity === sev);
    return list.length === 0 ? [] : [{ severity: sev, list }];
  });

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Overall score
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-4xl font-semibold tabular-nums",
                  result.passed ? "text-primary" : "text-destructive",
                )}
              >
                {result.overallScore.toFixed(1)}
              </span>
              <span className="text-base text-muted-foreground tabular-nums">
                / 100
              </span>
              {delta !== null && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                    delta > 0
                      ? "bg-primary/10 text-primary"
                      : delta < 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)} vs previous
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                result.passed
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {result.passed ? "Pass" : "Fail"}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              Threshold: {result.threshold}
            </span>
          </div>
        </div>
      </div>

      {/* ── Dimensions ────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-sm font-medium">Dimensions</h3>
        <div className="space-y-2.5">
          {result.dimensions.map((dim) => (
            <div key={dim.name} className="rounded-md border bg-card p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{dim.name}</span>
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    weight {dim.weight.toFixed(2)}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    dim.score >= 80
                      ? "text-primary"
                      : dim.score >= 60
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-destructive",
                  )}
                >
                  {dim.score.toFixed(0)}
                </span>
              </div>
              {/* Score bar — width is the score itself */}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    dim.score >= 80
                      ? "bg-primary"
                      : dim.score >= 60
                        ? "bg-amber-500"
                        : "bg-destructive",
                  )}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              {dim.notes && (
                <p className="mt-2 text-xs text-muted-foreground">{dim.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Issues ────────────────────────────────────────────────── */}
      <div>
        <h3 className="mb-3 text-sm font-medium">
          Issues{" "}
          <span className="text-xs font-normal text-muted-foreground">
            ({result.issues.length})
          </span>
        </h3>
        {result.issues.length === 0 ? (
          <p className="rounded-md border border-dashed bg-card p-4 text-sm text-muted-foreground">
            No issues identified.
          </p>
        ) : (
          <div className="space-y-3">
            {groupedIssues.map(({ severity, list }) => (
              <div key={severity}>
                <div
                  className={cn(
                    "mb-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    SEVERITY_TOKEN[severity].bg,
                    SEVERITY_TOKEN[severity].fg,
                  )}
                >
                  {SEVERITY_TOKEN[severity].label} · {list.length}
                </div>
                <div className="space-y-2">
                  {list.map((issue, i) => (
                    <div
                      key={`${severity}-${i}`}
                      className="rounded-md border bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 text-sm">{issue.description}</p>
                        {issue.autoFixable && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                            Auto-fixable
                          </span>
                        )}
                      </div>
                      {issue.suggestedFix && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            Fix:
                          </span>{" "}
                          {issue.suggestedFix}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span>
                          <span className="font-medium">dimension:</span>{" "}
                          {issue.dimension}
                        </span>
                        {issue.selector && (
                          <span>
                            <span className="font-medium">selector:</span>{" "}
                            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                              {issue.selector}
                            </code>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
