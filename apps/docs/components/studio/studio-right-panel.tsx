"use client";

/**
 * StudioRightPanel — stage-aware shell for the Studio right column.
 *
 * Routes between four stages based on `(appSource, selection)`:
 *
 *   A → blank/trivial design → <LayoutStartersPanel> (reference layout
 *       starter picker, surfaces every REFERENCE_LAYOUTS entry).
 *   B → design has content, nothing selected → page-level structure
 *       controls. v1 ships a placeholder card; the full panel lands as
 *       part of the Stage B work tracked in STUDIO-LAYOUT-PANEL.md.
 *   C → a non-layout DS component selected → existing
 *       <StudioSettingsPanel variant="docked">. The settings panel
 *       already does the docked layout, so we just delegate.
 *   D → a layout primitive selected → same settings panel; lifting of
 *       gap/cols/align/justify to the top is a follow-up tweak inside
 *       StudioSettingsPanel (Stage D), not a separate panel.
 *
 * Theme switching moved back to the chrome popover (GradeThemeSwitcher).
 * This panel intentionally has no theme UI — the previous ThemeBuilderPanel
 * mount was retired as part of the layout-first redesign.
 *
 * The router stays small on purpose: stage detection is pure
 * (`resolveRightPanelStage`), individual stage UIs are owned by their
 * own files, and any new stage is one entry in the switch.
 */

import * as React from "react";

import type { StudioSelection } from "@/lib/chat-sandpack";
import { cn } from "@/lib/utils";
import {
  resolveRightPanelStage,
  type RightPanelStage,
} from "@/lib/studio-right-panel-stage";

import { LayoutStartersPanel } from "./layout-starters-panel";
import { SelectionInspector } from "./selection-inspector";
import { StageBInspector } from "./stage-b-inspector";

export interface StudioRightPanelProps {
  /** Active design's JSX source. Drives the Stage A/B fork. */
  appSource: string | null;
  /** Current preview selection. Drives the Stage C/D fork when populated. */
  selection: StudioSelection | null;
  /** Single source-of-truth callback for any mutation a stage produces —
   *  Stage A's starter pick, Stage B's structural edits, Stage C/D's prop
   *  edits. Parent persists into the per-design appSource map. */
  onSourceChange: (next: string) => void;
  /** Forwarded to the settings panel so the user can flip back to the
   *  inline variant if they prefer it in the chat column. */
  onRequestSettingsUndock?: () => void;
  className?: string;
}

export function StudioRightPanel({
  appSource,
  selection,
  onSourceChange,
  onRequestSettingsUndock,
  className,
}: StudioRightPanelProps) {
  const stage: RightPanelStage = resolveRightPanelStage({
    appSource,
    selection,
  });

  // The "show starter picker again" affordance pinned to Stage B's
  // header. Toggled locally so it doesn't survive a tab switch — that
  // would be a footgun (the user could clobber a non-empty design by
  // accident).
  const [forceStarters, setForceStarters] = React.useState(false);
  // Selection change always wins over a forced Stage A — once you pick
  // something, the panel responds to that pick.
  React.useEffect(() => {
    if (selection?.componentName) setForceStarters(false);
  }, [selection?.componentName]);

  const effectiveStage: RightPanelStage =
    forceStarters && stage === "B" ? "A" : stage;

  switch (effectiveStage) {
    case "A":
      return (
        <LayoutStartersPanel
          className={className}
          onPick={(scaffold) => {
            onSourceChange(scaffold);
            setForceStarters(false);
          }}
        />
      );

    case "C":
    case "D":
      return (
        <SelectionInspector
          variant="docked"
          selection={selection}
          appSource={appSource}
          onSourceChange={onSourceChange}
          onRequestUndock={onRequestSettingsUndock}
          // Strip the panel's own card chrome — the parent
          // TabsContent provides the bordered container, so the
          // settings panel renders bare inside it. tailwind-merge
          // resolves the conflicts: border-0 wins over the
          // panel's default `border border-border`, rounded-none
          // over rounded-lg, etc.
          className={cn(
            "border-0 rounded-none bg-transparent",
            className,
          )}
        />
      );

    case "B":
    default:
      // Stage B is "design has content, nothing selected". Replaced
      // the original placeholder (May 2026) with a live inspector:
      // shows Grade components + external libraries actually in use
      // on the current screen. Page-level structure controls
      // (AppShell on/off, container width, density) are deferred to
      // a future iteration — STUDIO-LAYOUT-PANEL.md.
      return (
        <StageBInspector
          appSource={appSource}
          onSwapStarter={() => setForceStarters(true)}
          className={className}
        />
      );
  }
}
