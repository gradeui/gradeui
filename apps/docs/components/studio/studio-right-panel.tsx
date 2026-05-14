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
import { ArrowLeft } from "lucide-react";

import type { StudioSelection } from "@/lib/chat-sandpack";
import { cn } from "@/lib/utils";
import {
  resolveRightPanelStage,
  type RightPanelStage,
} from "@/lib/studio-right-panel-stage";

import { LayoutStartersPanel } from "./layout-starters-panel";
import { StudioSettingsPanel } from "./settings-panel";

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
        <StudioSettingsPanel
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
      return (
        <StageBPlaceholder
          className={className}
          onSwapStarter={() => setForceStarters(true)}
        />
      );
  }
}

/**
 * Temporary Stage B surface — page-level structure (AppShell, container
 * width, sidebar position, padding density) lands as part of the Stage B
 * work-item. For now this card explains the slot and offers a "Swap
 * starter…" button that re-opens Stage A.
 */
function StageBPlaceholder({
  className,
  onSwapStarter,
}: {
  className?: string;
  onSwapStarter: () => void;
}) {
  return (
    <div
      className={cn(
        // Bare wrapper — chrome is owned by the parent TabsContent
        // in StudioRightTabs. No duplicate "Layout" header here —
        // the tab trigger already names the section.
        "flex flex-col h-full",
        className,
      )}
    >
      {/* Swap-starter action sits inline at the top of the body
          rather than in a dedicated header strip — keeps the chrome
          minimal. */}
      <div className="px-3 pt-3 pb-1 shrink-0 flex justify-end">
        <button
          type="button"
          onClick={onSwapStarter}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5",
            "text-[10px] font-medium text-muted-foreground",
            "hover:bg-muted hover:text-foreground transition-colors",
          )}
          title="Show the reference-layout starter picker"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden />
          Swap starter
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs text-muted-foreground">
        <p>
          Page-level structure controls live here — AppShell on/off,
          container width, sidebar position, padding density.
        </p>
        <p className="text-muted-foreground/70">
          For now, edit structure via the chat or by clicking parts of the
          preview. Themes have moved to the palette icon in the header
          above.
        </p>
      </div>
    </div>
  );
}
