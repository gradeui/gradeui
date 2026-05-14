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
import { motion } from "framer-motion";
import {
  Code2,
  Copy,
  Crosshair,
  ExternalLink,
  Eye,
  LayoutGrid,
  Loader2,
  Maximize2,
  Monitor,
  MoreHorizontal,
  MousePointerClick,
  Package,
  Plus,
  Share2,
  Smartphone,
  Sparkles,
  Tablet,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import {
  buildSandpackFiles,
  looksComplete,
  prepareAppSource,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { openInCodeSandboxNpm } from "@/lib/chat-export-npm";
import type { GeneratedTheme } from "@/lib/themes";
import type { Design } from "@/lib/studio-designs";
import { DesignBreadcrumb } from "@/components/studio/design-breadcrumb";
import { StarterPicker } from "@/components/studio/starter-picker";
import {
  FocusedSandpackMount,
  TileSandpackMount,
  type ViewportWidth,
} from "@/components/studio/sandpack-frame";
import {
  FocusedFastMount,
  TileFastMount,
} from "@/components/studio/fast-frame";

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
  /** Which renderer mounts inside the preview frames. "sandpack" is the
   *  legacy/stable path (npm install, iframe, full bundler). "fast" is
   *  an in-document same-origin renderer (no iframe, no npm, imports
   *  @gradeui/ui straight from the workspace). Until the fast renderer
   *  ships this prop is accepted but acted on only via a TODO inside
   *  FocusedFrame/ScreenTile — both still mount Sandpack regardless.
   *  Default "sandpack" so the current behavior is the unchanged path. */
  rendererMode?: "sandpack" | "fast";
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
  rendererMode = "sandpack",
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

  // Flip the "first visit to grid" flag whenever the user is in
  // grid-state. With the Fit/All toggle removed, the only entries
  // to grid-state are the breadcrumb's "All screens" link and the
  // initial mount — both flow through setZoom, so a useEffect on
  // `zoom` is the simplest single source of truth.
  useEffect(() => {
    if (zoom === "all" && !hasEnteredAll) setHasEnteredAll(true);
  }, [zoom, hasEnteredAll]);

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
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border shrink-0">
        {/* Top row — single row hosting:
              - screen-state: breadcrumb (All screens / Screen 1)
                with inline rename, plus live status chips
              - grid-state: "All screens (N)" label, status chips
            Plus a right-aligned cluster (per-screen actions in
            screen-state, add-a-screen actions in grid-state).
            No bg-muted strip any more — the canvas is surface-less
            at the top so the breadcrumb reads as part of the
            content, not as separate chrome. */}
        <div className="flex items-center gap-2 min-w-0 text-xs text-muted-foreground">
          {isFit && focused ? (
            <DesignBreadcrumb
              focused={focused}
              onBack={() => setZoom("all")}
              onRename={onRenameDesign}
            />
          ) : (
            <span className="px-1 text-xs font-medium text-foreground">
              All screens
              {designs.length > 1 && (
                <span className="ml-1 text-muted-foreground">
                  ({designs.length})
                </span>
              )}
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
          {/* No more Fit/All toggle — navigation between the two
              states goes through the breadcrumb ("All screens" link
              returns to grid-state) and the grid itself (clicking a
              tile enters screen-state). One way to switch, no two
              redundant affordances. */}

          {isFit ? (
            // ─── Screen-state cluster ─────────────────────────────
            // Per-screen actions, left-to-right:
            //   - Preview/Code (icon-only with tooltips)
            //   - Viewport width (Mobile/Tablet/Desktop/Responsive)
            //   - Select (element pick)
            //   - Overflow menu (Duplicate, Open in CodeSandbox, Share)
            // All operate on the focused screen — they belong on the
            // same row as the breadcrumb that names that screen.
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v: string) => {
                  if (v === "preview" || v === "code") onViewChange(v);
                }}
                aria-label="Preview mode"
              >
                <ToggleGroupItem
                  value="preview"
                  aria-label="Preview"
                  title="Preview"
                >
                  <Eye />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="code"
                  aria-label="Code"
                  title="Code"
                >
                  <Code2 />
                </ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup
                type="single"
                value={viewportWidth}
                onValueChange={(v: string) => {
                  if (
                    v === "mobile" ||
                    v === "tablet" ||
                    v === "desktop" ||
                    v === "responsive"
                  )
                    setViewportWidth(v);
                }}
                aria-label="Viewport width"
              >
                <ToggleGroupItem value="mobile" title="Mobile — 390px">
                  <Smartphone />
                  Mobile
                </ToggleGroupItem>
                <ToggleGroupItem value="tablet" title="Tablet — 768px">
                  <Tablet />
                  Tablet
                </ToggleGroupItem>
                <ToggleGroupItem value="desktop" title="Desktop — 1024px">
                  <Monitor />
                  Desktop
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="responsive"
                  title="Responsive — fills the column"
                >
                  Responsive
                </ToggleGroupItem>
              </ToggleGroup>

              {/* Select — element pick. Custom-rolled toggle until
                  Toggle picks up tooltip support. */}
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
                  "h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                  "[&_svg]:size-3.5 [&_svg]:shrink-0",
                  selectMode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  "disabled:opacity-40 disabled:pointer-events-none"
                )}
              >
                <MousePointerClick />
                {selectMode ? "Pick…" : "Select"}
              </button>

              {/* Overflow — Duplicate (works), Open in CodeSandbox
                  (mostly works), Share (placeholder). */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="More actions"
                    aria-label="More actions"
                    className={cn(
                      "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                      "[&_svg]:size-3.5 [&_svg]:shrink-0",
                      "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <MoreHorizontal />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {onDuplicateDesign && (
                    <DropdownMenuItem
                      onClick={() => onDuplicateDesign(focusedId)}
                      disabled={!canAddMore}
                    >
                      <Copy />
                      Duplicate screen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      // Open preview — stable per-design localStorage
                      // key. The page-level effect in studio/page.tsx
                      // keeps this key in sync afterwards (so the
                      // standalone tab live-updates via `storage`
                      // events), but we EAGERLY write the latest
                      // payload here too so the new tab reads fresh
                      // JSON on first paint. Without this write, an
                      // old raw-string entry from a previous session
                      // could win the race and the preview tab would
                      // mount with no title until the user makes an
                      // edit in Studio.
                      if (!focusedAppSource || !focused) return;
                      const key = `grade:screen:${focusedId}`;
                      try {
                        window.localStorage.setItem(
                          key,
                          JSON.stringify({
                            source: focusedAppSource,
                            name: focused.name,
                          }),
                        );
                      } catch {
                        // storage disabled / quota — bail rather
                        // than open a guaranteed-blank tab.
                        return;
                      }
                      window.open(
                        `/fast-sandbox#screen=${encodeURIComponent(key)}`,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    disabled={!focusedAppSource}
                  >
                    <ExternalLink />
                    Open preview in new tab
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleOpenNpm}
                    disabled={!focusedAppSource || exportingNpm}
                  >
                    {exportingNpm ? <Loader2 className="animate-spin" /> : <Package />}
                    Open in CodeSandbox
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Share2 />
                    Share link
                    <span className="ml-auto text-[10px] text-muted-foreground/70">
                      Soon
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            // ─── Grid-state cluster ───────────────────────────────
            // Tiles ARE the navigation in this view, so the only
            // chrome we need here is "add a screen" actions:
            // + New, Starters, and Duplicate-focused. Per-screen
            // affordances (viewport, preview/code, select, npm)
            // would mislead if they showed up without a single
            // focused screen on stage.
            <>
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
        rendererMode={rendererMode}
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
          onClose={onCloseDesign}
          theme={theme}
          mode={mode}
          hidden={isFit}
          rendererMode={rendererMode}
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
  /** Forwarded from StudioCanvas. Currently accepted-and-ignored —
   *  until the fast renderer lands in step 5 of the renderer rollout
   *  the mount below always uses FocusedSandpackMount. See TODO(#5)
   *  inside this component for the swap point. */
  rendererMode?: "sandpack" | "fast";
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
  rendererMode = "sandpack",
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
      {rendererMode === "fast" ? (
        <FocusedFastMount
          appSource={appSource}
          theme={theme}
          mode={mode}
          view={view}
          canRender={canRender}
          viewportWidth={viewportWidth}
          selectMode={selectMode}
          onSelect={onSelect}
          onSelectModeChange={onSelectModeChange}
        />
      ) : (
        <FocusedSandpackMount
          sandpackFiles={sandpackFiles}
          preparedSource={preparedSource}
          mode={mode}
          view={view}
          canRender={canRender}
          viewportWidth={viewportWidth}
        />
      )}

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
  /** Delete a design. The tile renders a close (×) button when more
   *  than one design is open (the grid is the only nav path now —
   *  removing a screen always happens here). */
  onClose: (id: string) => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  /** Stay mounted but render invisible. Tiles remain alive so flipping
   *  back to All view is instant — no Sandpack reboot. */
  hidden?: boolean;
  /** Forwarded to each ScreenTile so tiles pick the same renderer as
   *  the focused frame. Defaults to "sandpack" for backwards compat. */
  rendererMode?: "sandpack" | "fast";
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
  onClose,
  theme,
  mode,
  hidden = false,
  rendererMode = "sandpack",
}: TileGridProps) {
  const canClose = designs.length > 1;
  return (
    <div
      // Lenis wraps the Studio site and by default intercepts wheel
      // events on any scrollable container. The All-mode tile grid
      // is a native-scroll surface — navigating between tiles needs
      // trackpad wheel to move the viewport, not Lenis's duration/easing
      // curve. `data-lenis-prevent` tells Lenis to skip wheel events
      // that target this subtree. The individual tile previews already
      // have the same attribute on their FastPreviewWrapper, so scroll
      // inside a tile and scroll in the gaps between tiles both work
      // natively.
      data-lenis-prevent
      className={cn(
        "flex-1 min-h-0 overflow-auto p-4 bg-muted/20",
        hidden && "hidden"
      )}
      style={{ overscrollBehavior: "contain" }}
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
            onClose={canClose ? () => onClose(d.id) : undefined}
            theme={theme}
            mode={mode}
            rendererMode={rendererMode}
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
  /** Close (delete) this screen. Omit to hide the × — the grid sets
   *  this only when more than one screen is open, so the user can't
   *  delete their way to an empty canvas. */
  onClose?: () => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  /** Which renderer mounts inside this tile. Matches FocusedFrame so a
   *  user flipping Dev → Fast in the header gets consistent results
   *  across Fit + All views. */
  rendererMode?: "sandpack" | "fast";
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
  onClose,
  theme,
  mode,
  rendererMode = "sandpack",
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
        <div className="flex items-center gap-0.5 shrink-0">
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
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title="Expand — focus this screen and switch to Fit zoom"
            aria-label={`Expand ${design.name} to Fit zoom`}
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors",
                "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              )}
              title={`Delete ${design.name}`}
              aria-label={`Delete ${design.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
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
          {rendererMode === "fast" ? (
            <TileFastMount
              appSource={appSource}
              theme={theme}
              mode={mode}
            />
          ) : (
            <TileSandpackMount
              sandpackFiles={sandpackFiles}
              preparedSource={preparedSource}
              mode={mode}
            />
          )}
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

// ─── Shared overlays ──────────────────────────────────────────────────
//
// Renderer-agnostic — EmptyPreview and GeneratingPreview paint above
// whichever frame (Sandpack or fast) is mounted beneath them. The
// Sandpack-specific error boundary and its failure view have moved to
// ./sandpack-frame so they travel with the code that can actually throw
// a bundler error.

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
