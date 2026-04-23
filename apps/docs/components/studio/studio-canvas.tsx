"use client";

/**
 * StudioCanvas — the middle column of /studio.
 *
 * Evolves the preview surface from "one iframe per active design" into a
 * canvas that can show every open design at once. Two zoom modes:
 *
 *   "fit"  — the focused design fills the column at full size. Equivalent
 *            to the pre-canvas Studio behavior: select-mode, preview/code
 *            toggle, and the npm-export button all live here.
 *
 *   "all"  — every design renders as a shrunk tile in an auto-grid.
 *            Clicking a tile focuses it (flips the page's activeId), which
 *            retargets chat + settings to that design. Tiles are read-only:
 *            select-mode and code-view only make sense on the focused frame,
 *            so we suppress them while the canvas is in "all".
 *
 * Mount lifecycle:
 *   - fit: only the focused design's Sandpack mounts. Others are absent.
 *   - all: one Sandpack per design, in parallel. Flipping fit → all triggers
 *     a burst of bundler boots for the N-1 newly-visible frames; we accept
 *     that cost at Tier 1 in exchange for not paying memory for unused
 *     iframes at idle. 8-screen page cap keeps the burst tolerable.
 *
 * The canvas evolves StudioPreview rather than wrapping it — we share the
 * same Sandpack wiring helpers (buildSandpackFiles, PLAYGROUND_*, the
 * selection-agent postMessage bus) and duplicate the small amount of local
 * UI (error boundary, empty/generating overlays) rather than exporting
 * them. StudioPreview itself is no longer wired up but left in place for
 * now — deleting it is a cleanup task.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Code2,
  Copy,
  Crosshair,
  ExternalLink,
  Eye,
  LayoutGrid,
  Loader2,
  Maximize2,
  Monitor,
  MousePointerClick,
  Package,
  Plus,
  RotateCcw,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildSandpackFiles,
  looksComplete,
  PLAYGROUND_DEPENDENCIES,
  PLAYGROUND_EXTERNAL_RESOURCES,
  prepareAppSource,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { openInCodeSandboxNpm } from "@/lib/chat-export-npm";
import type { GeneratedTheme } from "@/lib/themes";
import type { Design } from "@/lib/studio-designs";
import { DesignTabs } from "@/components/studio/design-tabs";
import { StarterPicker } from "@/components/studio/starter-picker";

/**
 * Minimal App module used to prewarm Sandpack when we don't yet have real
 * JSX from the chat. See the matching comment in studio-preview.tsx —
 * mirrored here so canvas mounts don't flash a Sandpack bundler error on
 * first visit.
 */
const PLAYGROUND_PLACEHOLDER_APP = [
  "export default function App() {",
  "  return null;",
  "}",
  "",
].join("\n");

/**
 * Virtual viewport used for tile rendering in "all" mode. The Sandpack
 * iframe is rendered at these pixel dimensions and then CSS-scaled down
 * to fit its tile, so a 1280px-wide design looks like a 1280px-wide
 * design — just smaller. Picked to match a reasonable laptop width so
 * Tailwind responsive breakpoints inside the preview don't flip into
 * mobile layout.
 */
const TILE_VIRTUAL_WIDTH = 1280;
const TILE_VIRTUAL_HEIGHT = 800;

/**
 * Viewport widths for the focused-frame picker. "responsive" means "let
 * the preview fill the column" — the equivalent of having no width
 * constraint. The pixel presets mirror common device-frame widths that
 * the model is already trained on through Tailwind's `sm/md/lg`
 * breakpoints, so picking "Mobile" actually exercises the sm: branch
 * of the generated markup rather than just cropping the desktop layout.
 *
 * Kept as a module constant so adding a bespoke width later (say a
 * custom iPad Pro 1024 vs 1194) is a one-line change and every
 * consumer picks it up.
 */
type ViewportWidth = "mobile" | "tablet" | "desktop" | "responsive";
const VIEWPORT_WIDTHS: Record<Exclude<ViewportWidth, "responsive">, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1024,
};

interface StudioCanvasProps {
  /** All designs the user has open. The canvas renders all of them in
   *  "all" mode and just the focused one in "fit" mode. */
  designs: Design[];
  /** Which design is currently focused. In fit mode this is the only
   *  design with a mounted Sandpack; in all mode it's the highlighted
   *  tile and the target of chat + settings. */
  focusedId: string;
  /** Called when the user clicks a tile to change focus. Parent wires
   *  this up to setActiveId. */
  onFocus: (id: string) => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  onViewChange: (view: "preview" | "code") => void;
  /** True while the chat is generating a response for the focused
   *  design. Drives the header spinner + the full-column placeholder in
   *  fit mode. */
  isStreaming?: boolean;
  /** Current in-iframe element selection for the focused design.
   *  Selection is fit-only — in all mode we suppress the select button
   *  and clear any dangling highlight. */
  selection?: StudioSelection | null;
  onSelect?: (selection: StudioSelection) => void;
  // ─── Design-management (previously on the page-level tab strip) ──
  //
  // The canvas owns the multi-screen surface, so the operations that
  // create, rename, close, and duplicate screens live here too. In Fit
  // mode they surface as a tab strip inside the canvas; in All mode
  // "+ New" and "Duplicate focused" sit in the canvas toolbar (tiles
  // take over navigation, and × lives back in Fit mode's tab strip
  // only — no need to double up).
  /** Add a design. Parent enforces MAX_DESIGNS. No args → blank screen
   *  (the existing DesignTabs "+" path). Passing a `seed` pre-fills
   *  the new design's appSource — used by the StarterPicker when the
   *  user picks a reference layout or pastes JSX. */
  onAddDesign: (seed?: { source: string; name?: string }) => void;
  /** Close a specific design. Parent may ignore the call if it would
   *  remove the last remaining screen. */
  onCloseDesign: (id: string) => void;
  /** Rename a design. Parent decides whether to trim / uniquify. */
  onRenameDesign: (id: string, name: string) => void;
  /** Duplicate a design by id. Omitting hides the Duplicate affordance
   *  in both mode toolbars and in the tab strip. */
  onDuplicateDesign?: (id: string) => void;
  /** False when the design cap is reached. Disables New + Duplicate
   *  both in the tab strip and in the All-mode toolbar. */
  canAddMore?: boolean;
  className?: string;
}

export function StudioCanvas({
  designs,
  focusedId,
  onFocus,
  theme,
  mode,
  view,
  onViewChange,
  isStreaming = false,
  selection = null,
  onSelect,
  onAddDesign,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
  canAddMore = true,
  className,
}: StudioCanvasProps) {
  // Zoom lives on the canvas itself, not the page — flipping between
  // designs shouldn't reset your zoom, and no other surface needs to
  // know what zoom we're at. Default to "fit" so the initial Studio
  // experience matches the pre-canvas single-screen feel.
  const [zoom, setZoom] = useState<"fit" | "all">("fit");

  // Track whether the user has ever opened All view. The first flip
  // mounts the tile grid; after that we keep it mounted across every
  // subsequent toggle so tiles don't re-boot their Sandpack iframes
  // each time. `display: none` hides without unloading — the bundler
  // state, the rendered DOM, and the module graph all persist. The
  // price is memory (N + 1 iframes at the 8-screen cap), and the
  // user gets instant Fit ↔ All flips in return. First visit still
  // pays the cold-boot cost, but only once per session.
  const [hasEnteredAll, setHasEnteredAll] = useState(false);

  // Select-mode lives on the canvas (not FocusedFrame) so that the
  // toggle button can be rendered in the header, above its sibling
  // controls, while still driving state that the frame's postMessage
  // bus consumes. Lifting it here also means flipping fit → all → fit
  // preserves the user's pick-mode intent.
  const [selectMode, setSelectMode] = useState(false);

  // Viewport width for the focused frame. Default "responsive" matches
  // the pre-picker behavior (no width constraint). Canvas-level state
  // so flipping fit → all → fit preserves the user's width choice, and
  // so the tiles ("all" view) aren't constrained by it — tiles want the
  // full 1280 virtual width regardless.
  const [viewportWidth, setViewportWidth] =
    useState<ViewportWidth>("responsive");

  // StarterPicker open/close. Both Fit and All mode surface a
  // "Starters" button that opens this — the picker is the single
  // doorway for "new screen that isn't blank" (layout + paste-code,
  // for now). Blank-screen creation still goes through the
  // DesignTabs "+ New" pill, unmediated, so the one-click blank path
  // is preserved.
  const [starterPickerOpen, setStarterPickerOpen] = useState(false);

  // Resolve the focused design object up front. Defensive fallback to
  // the first design in case focusedId goes stale during an add/close
  // race — the page is supposed to keep them in sync but a missing
  // design shouldn't crash the canvas.
  const focused = designs.find((d) => d.id === focusedId) ?? designs[0];
  const focusedAppSource = focused?.appSource ?? null;

  // In "all" mode the select/code/npm affordances don't apply — they're
  // operations on one specific frame. Derive this once so the header
  // and the overlay logic share the same rule.
  const isFit = zoom === "fit";

  // canRender still gates whether the focused frame shows iframe vs the
  // overlay (same heuristic as StudioPreview). Only meaningful in fit
  // mode; tiles have their own per-design version below.
  const focusedCanRender =
    Boolean(focusedAppSource) &&
    (isStreaming || looksComplete(focusedAppSource || ""));

  // ─── npm export (fit mode only) ─────────────────────────────────────
  const [exportingNpm, setExportingNpm] = useState(false);
  const handleOpenNpm = async () => {
    if (!focusedAppSource || exportingNpm) return;
    setExportingNpm(true);
    try {
      await openInCodeSandboxNpm({
        appSource: focusedAppSource,
        theme,
        mode,
      });
    } catch (err) {
      console.error("Failed to open in CodeSandbox (npm):", err);
    } finally {
      setExportingNpm(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" />
          {/* Swap the generic "Live preview" for the focused screen's
              name so the header reinforces which design the chat +
              settings are targeting. Falls back to "Live preview" if
              there's somehow no focused design (shouldn't happen in
              practice given designs has a minimum of 1). */}
          <span className="font-medium text-foreground">
            {focused?.name ?? "Live preview"}
          </span>
          {/* Dev-only design-id badge. Surfaces the internal key that
              `StudioChat` and `messagesByDesign` are keyed on, so
              state drift is visible in the UI instead of hiding behind
              a silent fallback. Truncated to the last 6 chars to keep
              the header compact — ids are Date.now()-based so the tail
              is plenty to distinguish siblings. */}
          {focused && process.env.NODE_ENV !== "production" && (
            <span
              className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground/70 border border-border/60 rounded px-1 py-0.5"
              title={`Design id: ${focused.id}`}
            >
              id:{focused.id.slice(-6)}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 border border-border rounded px-1.5 py-0.5">
            {theme.name}
          </span>
          {/* In "all" mode surface which design the chat + settings are
              currently targeting — without this chip it's easy to lose
              track once the grid grows beyond three tiles. */}
          {!isFit && focused && (
            <span
              className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              title={`Chat + settings target "${focused.name}"`}
            >
              <Maximize2 className="h-3 w-3" aria-hidden />
              {focused.name}
            </span>
          )}
          {isFit && selection?.componentName && (
            <span
              className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary"
              title={
                selection.part
                  ? `Editing <${selection.componentName}> (data-gds-part="${selection.part}")`
                  : `Editing <${selection.componentName}>`
              }
            >
              <Crosshair className="h-3 w-3" aria-hidden />
              Editing
              <span className="opacity-90">
                &lt;{selection.componentName}&gt;
              </span>
            </span>
          )}
          {isStreaming && isFit && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom toggle stays visible in BOTH modes — it's the one
              control that's equally valid either way. Everything else
              in the right-hand cluster is mode-specific (and below we
              render only the subset that applies to the current mode
              rather than greying half the row out in All view). */}
          <div
            className="flex items-center rounded border border-border bg-background/60 p-0.5"
            role="group"
            aria-label="Canvas zoom"
          >
            <button
              type="button"
              onClick={() => setZoom("fit")}
              className={cn(
                "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] transition-colors",
                isFit
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={isFit}
              title="Fit focused screen to canvas"
            >
              <Maximize2 className="h-3 w-3" />
              Fit
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom("all");
                setHasEnteredAll(true);
              }}
              className={cn(
                "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] transition-colors",
                !isFit
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={!isFit}
              title="Show all screens side-by-side"
            >
              <LayoutGrid className="h-3 w-3" />
              All
              {designs.length > 1 && (
                <span className="text-[9px] opacity-70">
                  ({designs.length})
                </span>
              )}
            </button>
          </div>

          {isFit ? (
            // ─── Fit-mode cluster ─────────────────────────────────
            // Everything that operates on the *focused* screen:
            // viewport width, preview/code, select, npm. Rendered
            // here rather than disabled-in-All so All mode's header
            // reads as a different tool, not a degraded version of
            // the same one. "Starters" is the odd one out — it creates
            // a NEW screen — but we still surface it here so the same
            // affordance is reachable without a mode flip.
            <>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={() => setStarterPickerOpen(true)}
                disabled={!canAddMore}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
                title={
                  canAddMore
                    ? "Start a new screen from a reference layout or pasted JSX"
                    : "Design cap reached"
                }
              >
                <Sparkles className="h-3 w-3" />
                Starters
              </button>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              <div
                className="flex items-center rounded border border-border bg-background/60 p-0.5"
                role="group"
                aria-label="Viewport width"
              >
                <ViewportButton
                  icon={<Smartphone className="h-3 w-3" />}
                  label="Mobile"
                  width={390}
                  active={viewportWidth === "mobile"}
                  onClick={() => setViewportWidth("mobile")}
                />
                <ViewportButton
                  icon={<Tablet className="h-3 w-3" />}
                  label="Tablet"
                  width={768}
                  active={viewportWidth === "tablet"}
                  onClick={() => setViewportWidth("tablet")}
                />
                <ViewportButton
                  icon={<Monitor className="h-3 w-3" />}
                  label="Desktop"
                  width={1024}
                  active={viewportWidth === "desktop"}
                  onClick={() => setViewportWidth("desktop")}
                />
                <ViewportButton
                  icon={null}
                  label="Responsive"
                  active={viewportWidth === "responsive"}
                  onClick={() => setViewportWidth("responsive")}
                />
              </div>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              {/* Preview/Code — same segmented-control styling as the
                  viewport picker above. Two buttons is still worth a
                  group because a bordered enclosure reads as "these
                  belong to the same axis" more clearly than two loose
                  pills. Likely to grow a Source/Diff entry later, at
                  which point the group carries its weight. */}
              <div
                className="flex items-center rounded border border-border bg-background/60 p-0.5"
                role="group"
                aria-label="Preview mode"
              >
                <button
                  type="button"
                  onClick={() => onViewChange("preview")}
                  aria-pressed={view === "preview"}
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] transition-colors",
                    view === "preview"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("code")}
                  aria-pressed={view === "code"}
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] transition-colors",
                    view === "code"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Code2 className="h-3 w-3" />
                  Code
                </button>
              </div>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={() => setSelectMode((v) => !v)}
                disabled={!focusedAppSource || !focusedCanRender}
                aria-pressed={selectMode}
                title={
                  selectMode
                    ? "Click an element in the preview to attach it to your next prompt"
                    : "Enable element select — click a component to comment on it"
                }
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                  selectMode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
              >
                <MousePointerClick className="h-3 w-3" />
                {selectMode ? "Pick…" : "Select"}
              </button>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={handleOpenNpm}
                disabled={!focusedAppSource || exportingNpm}
                title="Open focused screen in CodeSandbox using @gradeui/ui from npm"
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
              >
                {exportingNpm ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Package className="h-3 w-3" />
                )}
                npm
                <ExternalLink className="h-2.5 w-2.5" />
              </button>
            </>
          ) : (
            // ─── All-mode cluster ─────────────────────────────────
            // Tiles ARE the navigation in this view, so the tab strip
            // doesn't render below. "+ New" and "Duplicate focused"
            // move here from the tab strip so screen creation doesn't
            // force a mode flip. "Starters" opens the reference-layout
            // + paste-code picker (#45/#46). Everything else
            // (viewport/preview/select/npm) is focused-screen-only and
            // would mislead if it showed up without a single focused
            // screen on stage.
            <>
              <div className="mx-1 h-3 w-px bg-border" aria-hidden />
              <button
                type="button"
                onClick={() => onAddDesign()}
                disabled={!canAddMore}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
                title={
                  canAddMore ? "Add a blank screen" : "Design cap reached"
                }
              >
                <Plus className="h-3 w-3" />
                New screen
              </button>
              <button
                type="button"
                onClick={() => setStarterPickerOpen(true)}
                disabled={!canAddMore}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
                title={
                  canAddMore
                    ? "Start from a reference layout or pasted JSX"
                    : "Design cap reached"
                }
              >
                <Sparkles className="h-3 w-3" />
                Starters
              </button>
              {onDuplicateDesign && (
                <button
                  type="button"
                  onClick={() => onDuplicateDesign(focusedId)}
                  disabled={!canAddMore}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors",
                    "text-muted-foreground hover:text-foreground",
                    "disabled:opacity-40 disabled:pointer-events-none"
                  )}
                  title={
                    canAddMore
                      ? `Duplicate “${focused?.name ?? "focused screen"}” — copies JSX, fresh chat`
                      : "Design cap reached"
                  }
                >
                  <Copy className="h-3 w-3" />
                  Duplicate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab strip — Fit-mode only. Canvas owns it now (was page-level
          chrome before the Fit/All split existed). In All mode the tile
          grid IS the tab strip — clicking a tile focuses it — so a
          second row of tabs would be redundant and just steal vertical
          room from the previews. */}
      {isFit && (
        <DesignTabs
          designs={designs}
          activeId={focusedId}
          // DesignTabs.onAdd is a () => void — wrap `onAddDesign` so the
          // optional seed arg stays undefined, preserving the "click +
          // → blank screen" contract. Starters has its own affordance.
          onAdd={() => onAddDesign()}
          onActivate={onFocus}
          onClose={onCloseDesign}
          onRename={onRenameDesign}
          onDuplicate={onDuplicateDesign}
          canAddMore={canAddMore}
          className="shrink-0"
        />
      )}

      {/* Body. Both FocusedFrame and TileGrid stay mounted once they've
          been visited — we toggle visibility via `hidden` rather than
          unmount/remount so Sandpack iframes don't reboot on every
          Fit ↔ All flip. TileGrid is gated on `hasEnteredAll` so we
          don't pay the boot cost until the user actually opens it. */}
      <FocusedFrame
        appSource={focusedAppSource}
        theme={theme}
        mode={mode}
        view={view}
        isStreaming={isStreaming}
        selection={selection}
        onSelect={onSelect}
        selectMode={selectMode}
        onSelectModeChange={setSelectMode}
        viewportWidth={viewportWidth}
        hidden={!isFit}
      />
      {hasEnteredAll && (
        <TileGrid
          designs={designs}
          focusedId={focusedId}
          onFocus={onFocus}
          onExpand={(id) => {
            // Double-click / expand button re-enters fit mode on the
            // chosen tile. Focus change first so the page's activeId
            // updates, then flip zoom so the Fit view shows what you
            // clicked.
            onFocus(id);
            setZoom("fit");
          }}
          theme={theme}
          mode={mode}
          hidden={isFit}
        />
      )}

      {/* StarterPicker dialog. Portalled via Radix so stacking context
          isn't an issue even though the canvas is clipped. Payload from
          onPick feeds straight into `onAddDesign` with the seed shape —
          the page's `handleAddDesign` copies `seed.source` into the new
          design's appSource and uses `seed.name` as the tab label. */}
      <StarterPicker
        open={starterPickerOpen}
        onOpenChange={setStarterPickerOpen}
        onPick={({ source, name }) => onAddDesign({ source, name })}
      />
    </div>
  );
}

// ─── Viewport width picker button ────────────────────────────────────

interface ViewportButtonProps {
  icon: React.ReactNode;
  label: string;
  /** Pixel width shown in the tooltip. Omit for "Responsive". */
  width?: number;
  active: boolean;
  onClick: () => void;
}

/**
 * Single button in the viewport picker row. Abstracted so the four
 * presets share alignment and sizing without four copies of the same
 * classNames. The whole picker only renders in Fit mode, so there's no
 * "disabled" state to handle here anymore — previously it dimmed the
 * row in All view, but we just hide the row now.
 */
function ViewportButton({
  icon,
  label,
  width,
  active,
  onClick,
}: ViewportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={width ? `${label} — ${width}px` : label}
      className={cn(
        "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Focused frame (fit mode) ─────────────────────────────────────────

interface FocusedFrameProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect?: (selection: StudioSelection) => void;
  /** Controlled select-mode. Lifted up so the toggle button can live
   *  in the canvas header. */
  selectMode: boolean;
  onSelectModeChange: (next: boolean) => void;
  /** Current viewport width constraint for the preview iframe.
   *  "responsive" means no constraint — the iframe fills the column.
   *  Applied only to the Preview view; the Code view always uses the
   *  full column because narrowing a text editor is user-hostile. */
  viewportWidth: ViewportWidth;
  /** Stay mounted but render invisible. Lets the canvas keep the
   *  focused Sandpack alive while the All-view grid is on screen,
   *  so flipping back to Fit doesn't re-boot the bundler. */
  hidden?: boolean;
}

/**
 * The full-size Sandpack. Owns the select-mode → iframe postMessage bus;
 * this is the same logic that used to live in StudioPreview — kept here
 * so the bus mounts/unmounts cleanly whenever the canvas flips into or
 * out of fit mode.
 */
function FocusedFrame({
  appSource,
  theme,
  mode,
  view,
  isStreaming,
  selection,
  onSelect,
  selectMode,
  onSelectModeChange,
  viewportWidth,
  hidden = false,
}: FocusedFrameProps) {
  const canRender =
    Boolean(appSource) && (isStreaming || looksComplete(appSource || ""));

  const preparedSource = useMemo(
    () => (appSource ? prepareAppSource(appSource) : PLAYGROUND_PLACEHOLDER_APP),
    [appSource]
  );

  const sandpackFiles = useMemo(
    () =>
      buildSandpackFiles({
        appSource: preparedSource,
        appSourceIsPrepared: true,
        theme,
        mode,
      }),
    [preparedSource, theme, mode]
  );

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // Select mode should clear whenever a fresh snippet arrives — the
  // picked element may no longer exist. Cheapest signal we have is
  // `appSource` changing identity. Skip the initial mount so we don't
  // stomp a pre-set select-mode (e.g., user flipped fit → all → fit
  // with select mode on and no new source).
  const appSourceRef = useRef(appSource);
  useEffect(() => {
    if (appSourceRef.current !== appSource) {
      appSourceRef.current = appSource;
      onSelectModeChange(false);
    }
  }, [appSource, onSelectModeChange]);

  const postToIframe = useCallback(
    (payload: Record<string, unknown>) => {
      const container = previewContainerRef.current;
      if (!container) return;
      const iframe = container.querySelector("iframe");
      const win = iframe?.contentWindow;
      if (!win) return;
      try {
        win.postMessage(payload, "*");
      } catch {
        // Cross-origin can reject once the frame locks down. Swallow
        // so a single stale frame doesn't take the studio with it.
      }
    },
    []
  );

  useEffect(() => {
    postToIframe({ type: "grade:select-mode", enabled: selectMode });
  }, [selectMode, postToIframe]);

  useEffect(() => {
    if (!selection) {
      postToIframe({ type: "grade:clear-selection" });
    }
  }, [selection, postToIframe]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === "grade:selected") {
        const sel = (data as { selection?: StudioSelection }).selection;
        if (sel && typeof sel === "object") {
          onSelect?.(sel);
          // Auto-exit select mode after capture — matches StudioPreview.
          onSelectModeChange(false);
        }
      } else if (type === "grade:agent-ready") {
        // Fresh iframe — replay our current intent.
        postToIframe({ type: "grade:select-mode", enabled: selectMode });
        if (!selection) {
          postToIframe({ type: "grade:clear-selection" });
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onSelect, onSelectModeChange, postToIframe, selectMode, selection]);

  return (
    <div
      ref={previewContainerRef}
      className={cn(
        "relative flex-1 min-h-0",
        // `display: none` rather than unmount: keeps the Sandpack
        // iframe alive so flipping back from All view is instant.
        hidden && "hidden"
      )}
    >
      <SandpackErrorBoundary resetKey={preparedSource}>
        <SandpackProvider
          template="react-ts"
          theme={mode === "dark" ? "dark" : "light"}
          options={{
            externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
            // Scope the code editor to App.tsx. All the other files in
            // the bundle (index.tsx, selection-agent.ts, theme-options.tsx,
            // styles.css, /public/index.html) are scaffold we generate —
            // the user only cares whether the MODEL is emitting the JSX
            // they expected. Hiding them also trims the tab-strip clutter.
            visibleFiles: ["/App.tsx"],
            activeFile: "/App.tsx",
          }}
          customSetup={{
            dependencies: { ...PLAYGROUND_DEPENDENCIES },
            entry: "/index.tsx",
          }}
          files={sandpackFiles}
          style={
            {
              height: "100%",
              "--sp-layout-height": "100%",
            } as React.CSSProperties
          }
        >
          <SandpackLayout
            style={{
              height: "100%",
              display: view === "code" && canRender ? "flex" : "none",
              border: 0,
            }}
          >
            {/* showTabs={false} belt-and-braces with visibleFiles above:
                with a single visible file there's nothing to tab between,
                so the strip is pure chrome. */}
            <SandpackCodeEditor
              showLineNumbers
              showTabs={false}
              style={{ height: "100%" }}
            />
          </SandpackLayout>
          {/* Viewport-width wrapper. The SandpackProvider's root is a
              block-level div, so `flex: 1` on this wrapper wouldn't
              pick up any height — we have to take it explicitly via
              `height: 100%`. "responsive" falls back to width: 100%
              with no max-width so the iframe fills the column as
              before (behavioral parity with pre-picker). Non-responsive
              presets center a width-constrained SandpackLayout on an
              artboard backdrop so the preview reads like a device
              sitting on a design surface — dot grid for spatial cues
              (so you can see exactly where the iframe starts), and an
              outline on the iframe itself so it separates from the
              artboard regardless of whether the rendered UI has its
              own background.

              Pattern: radial-gradient dots at a fixed pitch, tinted
              via the `--border` token so the grid tracks the active
              theme (dark mode gets a dark grid on a slightly-lighter
              artboard, light mode gets the inverse). 16px pitch is
              dense enough to feel like a design tool without moiréing
              against the scaled content inside the iframe. */}
          <div
            style={{
              display: view === "preview" ? "flex" : "none",
              height: "100%",
              width: "100%",
              justifyContent: "center",
              alignItems: "stretch",
              // IMPORTANT: `background` (shorthand) resets
              // `background-image` as part of its longhand
              // cascade, and React doesn't reliably preserve
              // style-object property order when serializing
              // to an inline style attribute. `backgroundColor`
              // longhand alongside `backgroundImage` sidesteps
              // that entirely.
              //
              // Color picked via `--muted-foreground` rather
              // than `--foreground` — the former is the mid-
              // tone the theme already uses for subtle text on
              // `--muted`, so it sits in the same perceptual
              // lightness band across light + dark modes.
              // `--foreground` at any visible alpha was
              // near-black in light mode (way too heavy) and
              // invisible in dark mode (white at low alpha
              // against dark grey just disappears). Mid-tone
              // at ~45% alpha reads in both.
              backgroundColor:
                viewportWidth === "responsive"
                  ? undefined
                  : "var(--muted)",
              backgroundImage:
                viewportWidth === "responsive"
                  ? undefined
                  : "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize:
                viewportWidth === "responsive" ? undefined : "16px 16px",
              color:
                viewportWidth === "responsive"
                  ? undefined
                  : "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
              padding: viewportWidth === "responsive" ? 0 : "1rem",
            }}
          >
            <SandpackLayout
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                // Visible outline only when the iframe is floating on
                // the dot-grid artboard. In responsive mode the frame
                // already butts right against the column chrome, so a
                // second border there would just be noise.
                border:
                  viewportWidth === "responsive"
                    ? 0
                    : "1px solid var(--border)",
                borderRadius:
                  viewportWidth === "responsive" ? 0 : "0.5rem",
                // overflow:hidden so the child SandpackPreview's
                // rounded corners line up with our radius. Without it
                // the iframe bleeds past the outline at the corners.
                overflow:
                  viewportWidth === "responsive" ? undefined : "hidden",
                // A soft drop shadow reinforces the "artboard" read —
                // cheap depth cue, same pattern Figma/Framer use.
                boxShadow:
                  viewportWidth === "responsive"
                    ? undefined
                    : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
                background: "var(--background)",
                // Pin the preview to the selected pixel width, clamped
                // to the column so a narrow canvas doesn't introduce
                // horizontal scroll.
                maxWidth:
                  viewportWidth === "responsive"
                    ? undefined
                    : VIEWPORT_WIDTHS[viewportWidth],
              }}
            >
              <SandpackPreview
                showOpenInCodeSandbox
                showRefreshButton
                style={{ height: "100%", flex: 1 }}
              />
            </SandpackLayout>
          </div>
        </SandpackProvider>
      </SandpackErrorBoundary>

      {!canRender && (
        <div className="absolute inset-0 bg-background z-10">
          {isStreaming ? <GeneratingPreview /> : <EmptyPreview />}
        </div>
      )}
    </div>
  );
}

// ─── Tile grid (all mode) ──────────────────────────────────────────────

interface TileGridProps {
  designs: Design[];
  focusedId: string;
  onFocus: (id: string) => void;
  onExpand: (id: string) => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  /** Stay mounted but render invisible. Tiles remain alive so flipping
   *  back to All view is instant — no Sandpack reboot. */
  hidden?: boolean;
}

/**
 * Auto-grid of mini-tiles. Columns adapt to container width via a
 * Tailwind responsive ladder: 1 col on tiny viewports, 2 on the default
 * canvas width, 3 on wide screens. The tile cap (enforced at the page
 * level) keeps the grid short enough to scroll through comfortably.
 */
function TileGrid({
  designs,
  focusedId,
  onFocus,
  onExpand,
  theme,
  mode,
  hidden = false,
}: TileGridProps) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-auto p-4 bg-muted/20",
        hidden && "hidden"
      )}
    >
      <div
        className={cn(
          "grid gap-4",
          // A grid of big tiles reads better than a tightly packed one;
          // 2-up is the sweet spot for a typical laptop canvas width,
          // 3-up opens up at ≥1600px. We set min-widths on the columns
          // instead of fixed counts so narrow windows fall back to 1.
          "[grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr))]"
        )}
      >
        {designs.map((d) => (
          <ScreenTile
            key={d.id}
            design={d}
            focused={d.id === focusedId}
            onFocus={() => onFocus(d.id)}
            onExpand={() => onExpand(d.id)}
            theme={theme}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}

interface ScreenTileProps {
  design: Design;
  focused: boolean;
  onFocus: () => void;
  onExpand: () => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
}

/**
 * A single tile — mini Sandpack with a label and a click-through
 * overlay. Interactions inside the preview are disabled so clicking
 * anywhere on the tile focuses it; a small "Expand" button in the
 * corner re-enters fit mode on this tile specifically.
 */
function ScreenTile({
  design,
  focused,
  onFocus,
  onExpand,
  theme,
  mode,
}: ScreenTileProps) {
  const appSource = design.appSource;
  const canRender = Boolean(appSource) && looksComplete(appSource || "");

  const preparedSource = useMemo(
    () => (appSource ? prepareAppSource(appSource) : PLAYGROUND_PLACEHOLDER_APP),
    [appSource]
  );

  const sandpackFiles = useMemo(
    () =>
      buildSandpackFiles({
        appSource: preparedSource,
        appSourceIsPrepared: true,
        theme,
        mode,
      }),
    [preparedSource, theme, mode]
  );

  // Measure the tile so we can pick a scale that fits a 1280×800
  // virtual viewport into the available width. Height follows
  // proportionally so the aspect ratio of the preview is preserved.
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setScale(w / TILE_VIRTUAL_WIDTH);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // Outer is a div rather than a button because the header contains a
    // nested real <button> (Expand) — nested interactive elements are
    // invalid HTML and break screen readers. We manually attach the
    // keyboard semantics via role/tabIndex/onKeyDown.
    <div
      role="button"
      aria-pressed={focused}
      aria-label={`Focus ${design.name}${focused ? " (currently focused)" : ""}`}
      tabIndex={0}
      onClick={onFocus}
      onDoubleClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          // Space would otherwise scroll. Eat both and route to focus.
          e.preventDefault();
          onFocus();
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-lg border bg-background text-left cursor-pointer transition-colors overflow-hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        focused
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium truncate">{design.name}</span>
          {focused && (
            <span className="text-[9px] uppercase tracking-wide text-primary shrink-0">
              Focused
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          onKeyDown={(e) => {
            // Prevent the outer key handler from also firing on Space /
            // Enter — the expand button should only expand, not also
            // focus-then-expand which would double-dispatch.
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
          className={cn(
            "shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
            "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title="Expand — focus this screen and switch to Fit zoom"
          aria-label={`Expand ${design.name} to Fit zoom`}
        >
          <Maximize2 className="h-3 w-3" />
        </button>
      </div>

      {/* The tile body. We set an explicit aspect ratio rather than
          letting it collapse to the virtual height — on narrow widths
          the scale can be tiny (say 0.2) and an aspect ratio keeps the
          tile legible regardless. */}
      <div
        ref={bodyRef}
        className="relative w-full overflow-hidden bg-background"
        style={{
          // Match the 1280×800 virtual viewport so the scaled preview
          // fills the tile edge-to-edge.
          aspectRatio: `${TILE_VIRTUAL_WIDTH} / ${TILE_VIRTUAL_HEIGHT}`,
        }}
      >
        {/* Render the Sandpack at its virtual size, then scale the
            whole thing down via CSS transform. pointer-events-none on
            the inner wrapper so clicks fall through to the tile's
            focus handler; the user interacts with tiles, not the
            embedded previews. */}
        <div
          className="absolute top-0 left-0 origin-top-left pointer-events-none"
          style={{
            width: TILE_VIRTUAL_WIDTH,
            height: TILE_VIRTUAL_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <SandpackErrorBoundary resetKey={preparedSource}>
            <SandpackProvider
              template="react-ts"
              theme={mode === "dark" ? "dark" : "light"}
              options={{
                externalResources: [...PLAYGROUND_EXTERNAL_RESOURCES],
                // Same rationale as FocusedFrame — even though tiles
                // don't surface a code editor, the bundler's "which
                // file am I primarily working on" heuristic is a
                // touch faster when we point it at App.tsx directly.
                visibleFiles: ["/App.tsx"],
                activeFile: "/App.tsx",
              }}
              customSetup={{
                dependencies: { ...PLAYGROUND_DEPENDENCIES },
                entry: "/index.tsx",
              }}
              files={sandpackFiles}
              style={
                {
                  height: "100%",
                  width: "100%",
                  "--sp-layout-height": "100%",
                } as React.CSSProperties
              }
            >
              <SandpackLayout
                style={{ height: "100%", width: "100%", border: 0 }}
              >
                <SandpackPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: "100%", width: "100%", flex: 1 }}
                />
              </SandpackLayout>
            </SandpackProvider>
          </SandpackErrorBoundary>
        </div>

        {/* Transparent interaction shield. The scaled iframe wrapper
            already has `pointer-events-none`, but Sandpack's bundler
            chrome (refresh, code-sandbox button) can still reintroduce
            auto-pointer-events on its descendants. An explicit sibling
            overlay guarantees nothing inside the shrunken preview is
            clickable/hoverable from the grid — the tile is a picture,
            not a working UI. The overlay has no handlers of its own so
            clicks bubble up to the card's onClick (focus). */}
        <div
          className="absolute inset-0 z-20"
          aria-hidden
          // `cursor: pointer` keeps the whole tile feeling like a
          // single clickable object, matching the card's role=button.
          style={{ cursor: "pointer" }}
        />

        {/* When there's no code yet, overlay a compact empty state so
            the tile doesn't look broken. Matches the fit-mode empty
            state stylistically but at tile scale. */}
        {!canRender && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center z-30">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Empty screen
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared overlays + error boundary (mirrored from StudioPreview) ───
//
// Kept inline rather than exported from studio-preview.tsx — cheaper to
// duplicate three small components than to export + import them and
// tangle the module graph. If StudioPreview is eventually deleted, the
// copies here become the canonical versions.

interface SandpackErrorBoundaryProps {
  resetKey: string;
  children: React.ReactNode;
}
interface SandpackErrorBoundaryState {
  error: Error | null;
}
class SandpackErrorBoundary extends React.Component<
  SandpackErrorBoundaryProps,
  SandpackErrorBoundaryState
> {
  state: SandpackErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SandpackErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prev: SandpackErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <SandpackFailure error={this.state.error} onRetry={this.handleRetry} />
      );
    }
    return this.props.children;
  }
}

function SandpackFailure({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const cleaned = error.message
    .replace(/^\/?App\.tsx:\s*/, "")
    .replace(
      /^\s*Cannot assign to read only property 'message' of object '[^']+':\s*/,
      ""
    );
  return (
    <div className="h-full overflow-auto p-6 text-sm">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-soft p-4 text-destructive-deep">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="font-medium leading-tight">
            Preview couldn&rsquo;t compile the latest snippet
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words font-mono opacity-90 bg-background/40 border border-border rounded px-2 py-1.5">
            {cleaned}
          </pre>
          <p className="text-xs opacity-80">
            Usually this means the model emitted malformed JSX (common cause:
            a <code className="font-mono">className</code> attribute wrapped
            across lines). Asking the chat to &ldquo;fix the syntax&rdquo; or
            regenerate should clear it.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/70 to-primary/30 flex items-center justify-center mb-4 shadow-md">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Describe a UI on the left
      </h3>
      <p className="text-sm max-w-sm">
        Ask the assistant for a component — a login form, a pricing card,
        a settings panel — and the result renders here, wearing whatever
        theme you&rsquo;re building on the right.
      </p>
    </div>
  );
}

function GeneratingPreview() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md"
      >
        <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">
          Generating your component
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          The preview will light up as soon as the code starts arriving.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
            className={cn(
              "h-3 rounded-md bg-muted",
              i === 0 && "w-3/4",
              i === 1 && "w-full",
              i === 2 && "w-1/2"
            )}
          />
        ))}
      </div>
    </div>
  );
}
