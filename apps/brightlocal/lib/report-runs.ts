"use client";

/**
 * The report's runs, shared by Report settings and Reports.
 *
 * Run history used to live on Report settings. It moved to its own Reports
 * page (Ali, 17 Sep: "a button ... that says Reports - We can basically add
 * Run History to that"; Svitlana's review: history inside settings "put the
 * result part into the settings part"). Run report now stays on settings, so
 * a run started there has to land in the history on the other page. The
 * store is module state: it survives client navigation between the two
 * pages and resets on a reload, which is right for a demo.
 *
 * ISO IN, house format OUT. Every date goes through formatDate /
 * formatDateTime from @brightlocal/proposal, like every other date in RM.
 */

import * as React from "react";

export interface ReportRun {
  id: string;
  at: string;
  trigger: "Scheduled" | "Manual";
  found: number;
  added: number;
  state: "ok" | "partial";
}

export const RUN_STATE: Record<ReportRun["state"], { label: string; variant: "secondary" | "outline" }> = {
  ok: { label: "Complete", variant: "secondary" },
  partial: { label: "Facebook skipped", variant: "outline" },
};

const RUNS: ReportRun[] = [
  { id: "r1", at: "2026-09-02T06:00", trigger: "Scheduled", found: 1247, added: 12, state: "ok" },
  { id: "r2", at: "2026-08-26T06:00", trigger: "Scheduled", found: 1235, added: 9, state: "ok" },
  { id: "r3", at: "2026-08-22T14:31", trigger: "Manual", found: 1226, added: 4, state: "ok" },
  { id: "r4", at: "2026-08-19T06:00", trigger: "Scheduled", found: 1222, added: 7, state: "partial" },
  { id: "r5", at: "2026-08-12T06:00", trigger: "Scheduled", found: 1215, added: 11, state: "ok" },
];

/** When the next scheduled run is, for copy that promises the schedule stands. */
export const NEXT_RUN = "2026-09-08";

// RUN REPORT NOW HAS A LIFECYCLE (Ali, 17 Sep: "Can we add three states in?",
// from Margarita's review). Per the PRD an ad-hoc run is credit-checked
// against the subscription and rejected with "no ad-hoc runs left", and the
// API cannot tell us the quota BEFORE the click. So the button is never
// disabled up front: a click either queues a run, which reports running until
// it is done, or comes back rejected.
//   idle      the button
//   running   the button spins and says so
//   rejected  a warning on Report settings, with the way to more runs
// ASSUMPTION, demo only: one manual run is left, so the first click runs (and
// lands in the history when it finishes) and the second is rejected. The real
// allowance is the subscription's, and nothing here knows it.
export type RunState = "idle" | "running" | "rejected";

interface Snapshot {
  runs: ReportRun[];
  runState: RunState;
  manualRunsLeft: number;
}

let snapshot: Snapshot = { runs: RUNS, runState: "idle", manualRunsLeft: 1 };
const listeners = new Set<() => void>();

function set(patch: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...patch };
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function runNow() {
  if (snapshot.runState === "running") return;
  if (snapshot.manualRunsLeft < 1) {
    set({ runState: "rejected" });
    return;
  }
  set({ runState: "running" });
  window.setTimeout(() => {
    set({
      runs: [
        { id: "r0", at: "2026-09-03T10:12", trigger: "Manual", found: 1249, added: 2, state: "ok" },
        ...snapshot.runs,
      ],
      manualRunsLeft: snapshot.manualRunsLeft - 1,
      runState: "idle",
    });
  }, 6000);
}

export function useReportRuns(): Snapshot {
  return React.useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}

export function reportsPath(location: string) {
  return `/locations/${location}/reviews/tracker/reports`;
}

export function reportSettingsPath(location: string) {
  return `/locations/${location}/reviews/tracker/settings`;
}
