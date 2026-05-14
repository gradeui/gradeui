"use client";

/**
 * SkillsExplorer — master/detail UI for the /skills page.
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Header (in page.tsx)                                      │
 *   ├──────────────┬─────────────────────────────────────────────┤
 *   │              │                                             │
 *   │  Layouts     │  Detail pane                                │
 *   │  (left)      │   - selected layout's snapshots             │
 *   │              │   - skill picker (defaults to responsive)   │
 *   │              │   - Run / Re-run button                     │
 *   │              │   - RubricResultView                        │
 *   │              │                                             │
 *   └──────────────┴─────────────────────────────────────────────┘
 *
 * Layouts that have a captured manifest are runnable. Layouts without one
 * show an empty state with the exact CLI command needed to capture them.
 *
 * Run history is in-session only (per Ali's call — no persistence in v1).
 * Re-runs against the same skill+layout pair show score delta vs. the most
 * recent prior run for that pair.
 */

import { useCallback, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RubricResult } from "@gradeui/skills";
// Types are erased at compile time, so a `type`-only import from the
// server-only module is safe — but the runtime helper has to come from
// the client-safe `snapshot-url` file.
import type { LayoutListing } from "@/lib/skills/load-layouts";
import { snapshotUrl } from "@/lib/skills/snapshot-url";
import { RubricResultView } from "./rubric-result-view";

interface SkillsExplorerProps {
  layouts: LayoutListing[];
}

/**
 * Skill ids supported by the layout-on-runner. Mirrors `SUPPORTED_SKILLS` in
 * the route's `INPUT_BUILDERS` map. `requiresManifest` gates the Run button
 * UI; the route also enforces it server-side.
 */
const LAYOUT_SKILLS = [
  {
    id: "responsive-reviewer",
    label: "Responsive review",
    description:
      "Grades how the layout adapts across viewport widths (375 / 768 / 1024 / 1440). Requires captured screenshots.",
    requiresManifest: true,
  },
  {
    id: "a11y-reviewer",
    label: "Accessibility review",
    description:
      "WCAG 2.2 AA — heading order, landmarks, alt text, labels, contrast (when a screenshot is available).",
    requiresManifest: false,
  },
  {
    id: "qa-reviewer",
    label: "QA review",
    description:
      "Catches placeholder leftovers, dead links, content incoherence, and formatting mistakes.",
    requiresManifest: false,
  },
] as const;

interface RunRecord {
  skillId: string;
  layoutId: string;
  result: RubricResult;
  durationMs: number;
  runAt: number;
}

export function SkillsExplorer({ layouts }: SkillsExplorerProps) {
  // Default to the first layout that has a manifest, falling back to the
  // first layout regardless. So "ready to review" surfaces by default.
  const initialId = useMemo(
    () => layouts.find((l) => l.hasManifest)?.id ?? layouts[0]?.id ?? null,
    [layouts],
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [skillId, setSkillId] = useState<string>(LAYOUT_SKILLS[0].id);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);

  const selected = useMemo(
    () => layouts.find((l) => l.id === selectedId) ?? null,
    [layouts, selectedId],
  );

  const currentRun = useMemo(() => {
    // Most recent run for the selected pair.
    if (!selected) return null;
    for (let i = history.length - 1; i >= 0; i--) {
      const r = history[i];
      if (r.layoutId === selected.id && r.skillId === skillId) return r;
    }
    return null;
  }, [history, selected, skillId]);

  const previousScore = useMemo(() => {
    // Score from the second-most-recent run for the same pair, used for delta.
    if (!selected || !currentRun) return undefined;
    let seenCurrent = false;
    for (let i = history.length - 1; i >= 0; i--) {
      const r = history[i];
      if (r.layoutId !== selected.id || r.skillId !== skillId) continue;
      if (!seenCurrent) {
        seenCurrent = true;
        continue;
      }
      return r.result.overallScore;
    }
    return undefined;
  }, [history, selected, skillId, currentRun]);

  const handleRun = useCallback(async () => {
    if (!selected) return;
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/skills/run-on-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutId: selected.id,
          skillId,
        }),
      });
      const json = (await res.json()) as
        | { skillId: string; layoutId: string; output: RubricResult; durationMs: number }
        | { error: string; details?: unknown };
      if (!res.ok) {
        const msg = "error" in json ? json.error : `Run failed: ${res.status}`;
        throw new Error(msg);
      }
      const ok = json as {
        skillId: string;
        layoutId: string;
        output: RubricResult;
        durationMs: number;
      };
      setHistory((prev) => [
        ...prev,
        {
          skillId: ok.skillId,
          layoutId: ok.layoutId,
          result: ok.output,
          durationMs: ok.durationMs,
          runAt: Date.now(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill run failed.");
    } finally {
      setRunning(false);
    }
  }, [selected, skillId]);

  const skillMeta = LAYOUT_SKILLS.find((s) => s.id === skillId)!;
  const canRun =
    selected !== null && (!skillMeta.requiresManifest || selected.hasManifest);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[280px_minmax(0,1fr)] md:px-6">
      {/* ── Layout list ───────────────────────────────────────────── */}
      <aside className="md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:overflow-y-auto">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Layouts
        </h2>
        <ul className="space-y-1">
          {layouts.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setSelectedId(l.id)}
                className={cn(
                  "group w-full rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors",
                  selectedId === l.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{l.label}</span>
                  {l.hasManifest ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-label="Manifest captured"
                    />
                  ) : (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30"
                      aria-label="No manifest"
                    />
                  )}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {l.description}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ── Detail pane ───────────────────────────────────────────── */}
      <main className="space-y-5">
        {selected === null ? (
          <p className="text-sm text-muted-foreground">No layouts available.</p>
        ) : (
          <>
            <div>
              <h2 className="text-lg font-semibold">{selected.label}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.description}
              </p>
              <a
                href={selected.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-block text-xs text-primary hover:underline"
              >
                View raw preview ↗
              </a>
            </div>

            {/* Snapshots row — only present if manifest exists. */}
            {selected.hasManifest && selected.manifest && (
              <div>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Captured snapshots
                </h3>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {selected.manifest.snapshots.map((s) =>
                    s.file ? (
                      <figure
                        key={s.viewportWidth}
                        className="overflow-hidden rounded-md border bg-card"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={snapshotUrl(s.file)}
                          alt={`${selected.label} at ${s.viewportWidth}px`}
                          className="aspect-[4/3] w-full object-cover object-top"
                        />
                        <figcaption className="border-t px-2 py-1 text-[11px] text-muted-foreground">
                          <span className="tabular-nums">
                            {s.viewportWidth}px
                          </span>
                          {s.consoleErrors.length > 0 && (
                            <span className="ml-2 text-destructive">
                              {s.consoleErrors.length} error
                              {s.consoleErrors.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </figcaption>
                      </figure>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            {/* Skill picker + run controls */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex-1 space-y-1.5">
                  <label
                    htmlFor="skill-select"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Skill
                  </label>
                  <Select value={skillId} onValueChange={setSkillId}>
                    <SelectTrigger id="skill-select" className="w-full md:w-[320px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYOUT_SKILLS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {skillMeta.description}
                  </p>
                </div>
                <Button
                  onClick={handleRun}
                  disabled={!canRun || running}
                  size="default"
                >
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running…
                    </>
                  ) : currentRun ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Re-run
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Run
                    </>
                  )}
                </Button>
              </div>
              {!canRun && skillMeta.requiresManifest && (
                <p className="mt-3 flex items-start gap-1.5 rounded-md border border-dashed bg-background/50 p-3 text-xs text-muted-foreground">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    No manifest captured for this layout yet. Run{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                      pnpm -F @gradeui/docs check:layouts --layout {selected.id}
                    </code>{" "}
                    from the gradeui workspace, then refresh this page.
                  </span>
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Result */}
            {currentRun && (
              <section>
                <div className="mb-3 flex items-baseline justify-between">
                  <h3 className="text-sm font-medium">
                    Result{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({(currentRun.durationMs / 1000).toFixed(1)}s)
                    </span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(currentRun.runAt).toLocaleTimeString()}
                  </span>
                </div>
                <RubricResultView
                  result={currentRun.result}
                  previousScore={previousScore}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
