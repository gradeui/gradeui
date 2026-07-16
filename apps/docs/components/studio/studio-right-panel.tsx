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
import type { DesignStatus, DesignTag } from "@/lib/studio-designs";
import { cn } from "@/lib/utils";
import {
  resolveRightPanelStage,
  type RightPanelStage,
} from "@/lib/studio-right-panel-stage";

import { DisplaySection } from "./display-section";
import { LayoutStartersPanel } from "./layout-starters-panel";
import { MotionScenePanel } from "./motion-scene-panel";
import { SelectionInspector } from "./selection-inspector";
import { StageBScreenInfo } from "./stage-b-screen-info";
import { isMotionSource } from "./timeline-dock";
import type { ViewportWidth } from "./sandpack-frame";

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
  /** Active design id — the stable flow-link handle (STUDIO-FLOWS). */
  designId?: string;
  designCreatedAt?: number;
  designUpdatedAt?: number;
  designStatus?: DesignStatus;
  /** Snapshot count from the undo history hook. */
  revisions: number;
  /** Owning project's display name. */
  projectName: string;
  /** Patch status on the active design. */
  onStatusChange: (status: DesignStatus) => void;
  /** Typed tags on the active design (STUDIO-TAGS T0). */
  designTags?: DesignTag[];
  onTagsChange?: (tags: DesignTag[]) => void;
  // ─── Display section (persistent, top of panel) ──────────────────
  // Canvas-wide view controls lifted out of the canvas toolbar. The
  // page owns the state; this panel renders the picker at the top of
  // whatever stage is active.
  viewportWidth: ViewportWidth;
  onViewportChange: (v: ViewportWidth) => void;
  zoomState: { effectiveZoom: number; fitMode: boolean };
  zoomApi: {
    pickZoom: (z: number) => void;
    stepZoom: (dir: number) => void;
    fit: () => void;
  } | null;
  className?: string;
}

export function StudioRightPanel({
  appSource,
  selection,
  onSourceChange,
  onRequestSettingsUndock,
  designName,
  designId,
  designCreatedAt,
  designUpdatedAt,
  designStatus,
  revisions,
  projectName,
  onStatusChange,
  designTags,
  onTagsChange,
  viewportWidth,
  onViewportChange,
  zoomState,
  zoomApi,
  className,
}: StudioRightPanelProps) {
  // The Display section is PERSISTENT — it sits at the very top of the
  // panel regardless of which stage (or the Motion inspector) renders
  // below. The stage content fills the remaining height in a min-h-0
  // flex column so its own scroller behaves exactly as before.
  const display = (
    <DisplaySection
      viewportWidth={viewportWidth}
      onViewportChange={onViewportChange}
      zoomState={zoomState}
      zoomApi={zoomApi}
    />
  );

  const stageContent = (() => {
    // Motion designs get the SCENE INSPECTOR instead of the stage
    // machine — a Motion's blob is `<Motion>` of `<MotionScene>`s, so
    // the component/layout inspector has nothing useful to hang controls
    // on, and the unit the user edits is the SCENE. Same write channel
    // (`onSourceChange` is the page's handleSourceMutation, which also
    // accepts an undo label), same collapsible-section idiom as the
    // selection inspector.
    if (isMotionSource(appSource)) {
      return (
        <MotionScenePanel
          appSource={appSource}
          onSourceMutation={onSourceChange}
        />
      );
    }

    const stage: RightPanelStage = resolveRightPanelStage({
      appSource,
      selection,
    });

    switch (stage) {
      case "A":
        return (
          <LayoutStartersPanel
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
            className="border-0 rounded-none bg-transparent"
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
            designId={designId}
            createdAt={designCreatedAt}
            updatedAt={designUpdatedAt}
            status={designStatus}
            revisions={revisions}
            projectName={projectName}
            onStatusChange={onStatusChange}
            tags={designTags}
            onTagsChange={onTagsChange}
          />
        );
    }
  })();

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {display}
      <div className="min-h-0 flex-1 overflow-hidden">{stageContent}</div>
    </div>
  );
}
