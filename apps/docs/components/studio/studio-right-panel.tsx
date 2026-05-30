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

import type { StudioSelection } from "@/lib/chat-sandpack";
import type { DesignStatus } from "@/lib/studio-designs";
import { cn } from "@/lib/utils";
import {
  resolveRightPanelStage,
  type RightPanelStage,
} from "@/lib/studio-right-panel-stage";

import { LayoutStartersPanel } from "./layout-starters-panel";
import { SelectionInspector } from "./selection-inspector";
import { StageBScreenInfo } from "./stage-b-screen-info";

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
  // Stage B metadata — surfaced by the screen-info panel.
  designName: string;
  designCreatedAt?: number;
  designUpdatedAt?: number;
  designStatus?: DesignStatus;
  /** Snapshot count from the undo history hook. */
  revisions: number;
  /** Owning project's display name. */
  projectName: string;
  /** Patch status on the active design. */
  onStatusChange: (status: DesignStatus) => void;
  className?: string;
}

export function StudioRightPanel({
  appSource,
  selection,
  onSourceChange,
  onRequestSettingsUndock,
  designName,
  designCreatedAt,
  designUpdatedAt,
  designStatus,
  revisions,
  projectName,
  onStatusChange,
  className,
}: StudioRightPanelProps) {
  const stage: RightPanelStage = resolveRightPanelStage({
    appSource,
    selection,
  });

  switch (stage) {
    case "A":
      return (
        <LayoutStartersPanel
          className={className}
          onPick={(scaffold) => {
            onSourceChange(scaffold);
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
      // Stage B is "design has content, nothing selected". The
      // default view is now SCREEN METADATA (name, status, project,
      // revisions, created, updated) — what the user typically
      // wants to know about the thing they're working on. The
      // component inventory that used to live here is still
      // available, tucked inside the "Component inventory"
      // accordion at the bottom of the panel. Page-level structure
      // controls (AppShell on/off, container width, density) are
      // deferred to a future iteration — STUDIO-LAYOUT-PANEL.md.
      return (
        <StageBScreenInfo
          appSource={appSource}
          designName={designName}
          createdAt={designCreatedAt}
          updatedAt={designUpdatedAt}
          status={designStatus}
          revisions={revisions}
          projectName={projectName}
          onStatusChange={onStatusChange}
          className={className}
        />
      );
  }
}
