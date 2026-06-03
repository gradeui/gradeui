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
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Copy,
  Crosshair,
  ExternalLink,
  Eye,
  Film,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  MousePointerClick,
  MoveHorizontal,
  Package,
  PanelLeft,
  PanelRight,
  Plus,
  Redo2,
  RotateCcw,
  Share2,
  UserPlus,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import {
  buildSandpackFiles,
  looksComplete,
  prepareAppSource,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { openInCodeSandboxNpm } from "@/lib/chat-export-npm";
import {
  backfillMediaSurfaceSrcProp,
  setInlineMediaSurfaceSrc,
  updateDataArrayEntry,
} from "@/lib/data-array-mutator";
import { useRotatingPhrase } from "@/lib/studio-loading-phrases";
import type { GeneratedTheme } from "@/lib/themes";
import type { Design } from "@/lib/studio-designs";
import type { CommentThreadWithMessages } from "@/lib/studio-storage";
import { DesignBreadcrumb } from "@/components/studio/design-breadcrumb";
import { CanvasPathBar } from "@/components/studio/canvas-path-bar";
import { SelectionChip } from "@/components/studio/selection-chip";
import { StarterPicker } from "@/components/studio/starter-picker";
import { TimelineDock } from "@/components/studio/timeline-dock";
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
  view: "preview" | "code" | "timeline";
  onViewChange: (view: "preview" | "code" | "timeline") => void;
  /** True while the chat is generating a response for the focused
   *  design. Drives the header spinner + the full-column placeholder in
   *  fit mode. */
  isStreaming?: boolean;
  /** Current in-iframe element selection for the focused design.
   *  Selection is fit-only — in all mode we suppress the select button
   *  and clear any dangling highlight. */
  selection?: StudioSelection | null;
  onSelect?: (selection: StudioSelection) => void;
  /** Fires when the iframe agent clears the persistent selection ring
   *  (currently: user pressed Escape inside the iframe). Wired to the
   *  same per-design selection state setter as the chat's chip ×. */
  onClearSelection?: () => void;
  /** Fires when the user picks an element while Comment mode is on
   *  (instead of Select mode). The payload is the same selection
   *  shape — the consumer decides what to do with it. The canvas
   *  itself uses this to pop an inline composer right next to the
   *  picked element; consumers can also listen if they want to
   *  surface the pick elsewhere (e.g. flip a side panel). */
  onCommentSelect?: (selection: StudioSelection) => void;
  /** Fires when the user posts a comment via the inline overlay.
   *  Consumer creates the thread + comment via the storage adapter
   *  and returns once persisted; the overlay closes on resolve. */
  onCommentSubmit?: (input: {
    selection: StudioSelection;
    body: string;
  }) => Promise<void> | void;
  /** The current user — used by the inline overlay's composer
   *  avatar + as the authorId when threads get created.
   *  Optional so consumers that don't wire comment mode at all
   *  can ignore it. */
  currentUserForComment?: {
    name: string;
    avatarUrl?: string;
  };
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
  /** Mint + copy a public share link for a screen. Receives the canvas's
   *  current viewport so the share captures the device the creator was
   *  viewing. Omitting disables the "Share link" menu item. */
  onShareScreen?: (id: string, viewport?: ViewportWidth) => void;
  /** Open the "Invite people" dialog for the active project. Omitting
   *  disables the menu item. Project-scoped (the grant is project-level)
   *  even though it lives in the screen-actions menu. */
  onInviteToProject?: () => void;
  /** False when the design cap is reached. Disables New + Duplicate
   *  both in the tab strip and in the All-mode toolbar. */
  canAddMore?: boolean;
  /** Mutation channel for the focused design's appSource — fed by the
   *  "Fill images" button (and, in future, any other in-canvas tool
   *  that patches JSX without a chat round-trip). Same shape as the
   *  callback the settings panel uses; parent wires both to its
   *  per-design appSource state. The optional `label` tags the undo
   *  snapshot ("Fill images", "Refresh image"). */
  onSourceMutation?: (next: string, label?: string) => void;
  // ─── Undo / redo (per-design) ────────────────────────────────────
  // The canvas owns the toolbar that surfaces undo + redo; the actual
  // history lives in the page via `useUndoHistory(activeId)`. Buttons
  // are disabled when there's nothing to restore in the relevant
  // direction; tooltips include the human label of the snapshot
  // ("Undo Fill images" / "Redo Chat edit") so the user can tell what
  // they're about to revert without diffing screens.
  canUndo?: boolean;
  canRedo?: boolean;
  undoLabel?: string | null;
  redoLabel?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;
  // ─── Side-panel visibility ───────────────────────────────────────
  // The chat (left) and tabbed-settings (right) columns are owned by
  // the page; the canvas toolbar just surfaces toggles for them. The
  // canvas needs to know the current open/closed state so the icon
  // and tooltip can reflect "show" vs "hide". `undefined` from the
  // parent hides the toggle entirely — useful for embeds where the
  // panels don't exist.
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  // ─── Canvas zoom (controlled by parent) ──────────────────────────
  // Lifted out of the canvas so the studio page can route the left
  // panel based on view ("all" → Projects menu, "fit" → Chat).
  // Optional so other consumers can still let the canvas manage its
  // own zoom state internally. When provided, the parent owns the
  // truth and the canvas drives it via onZoomChange.
  zoom?: "fit" | "all";
  onZoomChange?: (zoom: "fit" | "all") => void;
  // ─── Comment pins ──────────────────────────────────────────────
  // Open threads to surface as positioned pins over the preview.
  // Forwarded through FocusedFrame → FocusedFastMount → the
  // FastIframeHost overlay. Empty / undefined = no pins.
  commentThreads?: CommentThreadWithMessages[];
  activeCommentThreadId?: string | null;
  onCommentPinClick?: (threadId: string) => void;
  /** Resolve a userId → user record so the comment-pin overlay
   *  can render the thread originator's Avatar. Pass through the
   *  same lookup the Comments tab uses. */
  getCommentUser?: (id: string) => import("@/lib/studio-users").User | undefined;
  // ─── Project context ──────────────────────────────────────────────
  // Name of the project currently loaded into the workbench. Shown
  // as the parent crumb in Fit mode and as the heading in Grid mode
  // so the canvas chrome reflects where the user actually is in the
  // Studio hierarchy. Optional — embed consumers without project
  // semantics fall back to the previous "All screens" wording.
  projectName?: string;
  /** Persistence status for the active screen — drives the subtle
   *  saved/saving/error chip in the canvas toolbar so a failed write is
   *  never silent. `idle` renders nothing. See STUDIO-PERSISTENCE.md (P4). */
  saveStatus?: "idle" | "saving" | "saved" | "error";
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
  onClearSelection,
  onCommentSelect,
  onCommentSubmit,
  currentUserForComment,
  onAddDesign,
  onCloseDesign,
  onRenameDesign,
  onDuplicateDesign,
  onShareScreen,
  onInviteToProject,
  canAddMore = true,
  onSourceMutation,
  canUndo = false,
  canRedo = false,
  undoLabel = null,
  redoLabel = null,
  onUndo,
  onRedo,
  leftPanelOpen,
  rightPanelOpen,
  onToggleLeftPanel,
  onToggleRightPanel,
  zoom: controlledZoom,
  onZoomChange,
  projectName,
  saveStatus = "idle",
  commentThreads,
  activeCommentThreadId,
  onCommentPinClick,
  getCommentUser,
  rendererMode = "sandpack",
  className,
}: StudioCanvasProps) {
  // Zoom — controlled by the parent when `controlledZoom` is passed
  // (Studio uses this to route the left panel based on view), with
  // an internal fallback for any consumer that doesn't lift state.
  // Default to "fit" so the initial Studio experience matches the
  // pre-canvas single-screen feel.
  const [internalZoom, setInternalZoom] = useState<"fit" | "all">("fit");
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = useCallback(
    (next: "fit" | "all") => {
      // Mirror to internal state for the uncontrolled path; emit to
      // the parent on the controlled path so it can react (e.g. swap
      // the left panel content).
      if (controlledZoom === undefined) setInternalZoom(next);
      onZoomChange?.(next);
    },
    [controlledZoom, onZoomChange],
  );

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
  /**
   * The canvas picker — one mode at a time, multiple possible
   * destinations.
   *
   * The iframe has a single click-capture mechanism
   * (`grade:select-mode`); what differs between modes is which
   * page-side callback receives the picked element. Today there
   * are two destinations:
   *
   *   - `"select"` — fires `onSelect`, used by chat to attach the
   *     pick to the next prompt.
   *   - `"comment"` — fires `onCommentSelect`, used by the
   *     Comments tab to open a new-thread composer anchored to
   *     the pick.
   *
   * `null` means the canvas is interactive — clicks pass through
   * to the rendered preview as normal. Future modes (annotate,
   * measure, etc.) slot into this enum without rewiring the
   * iframe protocol.
   */
  type CanvasMode = "select" | "comment" | null;
  const [canvasMode, setCanvasMode] = useState<CanvasMode>(null);
  const selectMode = canvasMode === "select";
  const commentMode = canvasMode === "comment";
  // Capture is on whenever ANY non-null mode is active. The iframe
  // doesn't care which mode it is — the same `grade:select-mode`
  // enabled message turns on click capture.
  const captureOn = canvasMode !== null;
  // Toggling a mode is "click the active button to leave the mode,
  // click another to switch". Pulled out so the toolbar buttons
  // can call it without duplicating the if-equal-then-null logic.
  const toggleCanvasMode = useCallback((next: Exclude<CanvasMode, null>) => {
    setCanvasMode((cur) => (cur === next ? null : next));
  }, []);

  // Viewport width for the focused frame. Default "responsive" matches
  // the pre-picker behavior (no width constraint). Canvas-level state
  // so flipping fit → all → fit preserves the user's width choice, and
  // so the tiles ("all" view) aren't constrained by it — tiles want the
  // full 1280 virtual width regardless.
  const [viewportWidth, setViewportWidth] =
    useState<ViewportWidth>("responsive");

  // Replay counter — bumping it re-keys the focused iframe so every
  // inView reveal + mount animation runs again. The control lives in
  // the canvas toolbar (next to viewport toggles) and the state is
  // forwarded down to FocusedFastMount as a key. Lives at this level
  // so the toolbar and the mount stay synced without prop drilling
  // through three layers.
  const [replayKey, setReplayKey] = useState(0);
  const replay = React.useCallback(() => setReplayKey((k) => k + 1), []);

  // Fidelity — historically a wireframe vs full toggle, but the
  // wireframe surface is no longer used in the canvas chrome (the
  // toggle was removed; designs always render in "full" now). The
  // constant + `setFidelity` no-op are kept so the postMessage
  // contract with the iframe (`grade:set-fidelity`) and every
  // downstream `fidelity={fidelity}` prop continue to compile and
  // behave correctly. If the wireframe view returns, lift this back
  // into useState + an explicit affordance.
  type Fidelity = "wireframe" | "full";
  const fidelity: Fidelity = "full";
  const setFidelity = (_next: Fidelity) => {
    // no-op — fidelity is pinned to "full" until the wireframe view
    // gets a meaningful product surface again.
  };

  // Fill-images flow — POSTs the focused design's appSource to the
  // /api/media/resolve route, which walks for MediaSurfaces with static
  // `source` props and patches each with a `src=` URL resolved from the
  // free-tier providers (MusicBrainz → Pollinations → Picsum). On success
  // we (a) push the patched JSX through onSourceMutation so Sandpack
  // HMRs to it, and (b) auto-flip fidelity to "full" so the user
  // actually sees the result instead of staring at the same placeholders
  // they had before. Errors are surfaced via the `fillError` state which
  // the button reads to show a small inline message.
  const [filling, setFilling] = useState(false);
  const [fillError, setFillError] = useState<string | null>(null);
  const [fillReport, setFillReport] = useState<{
    filled: number;
    skipped: number;
  } | null>(null);
  // Auto-dismiss the success report after ~5s so the header doesn't
  // accumulate stale "filled 6 of 7" pills across multiple clicks.
  useEffect(() => {
    if (!fillReport) return;
    const id = window.setTimeout(() => setFillReport(null), 5000);
    return () => window.clearTimeout(id);
  }, [fillReport]);

  // Resolved media URLs, scoped **per design** so two starter-template
  // instances don't share state. Same reasoning as the overrides
  // below — each iframe IS its own design, and a Fill on Music App #1
  // shouldn't silently fill Music App #2's identical-titled cards.
  // Duplicating a design copies the URLs (and overrides) explicitly,
  // so the user gets the right "yes, carry this state with the
  // duplicate" semantic without the spooky cross-design action of a
  // flat global map.
  //
  // Persisted to localStorage so a page reload doesn't drop everything
  // and force the user to re-click Fill (which on the playlist hints
  // means triggering Pollinations cold-starts all over again).
  const MEDIA_URLS_STORAGE_KEY = "studio:media-urls-by-design";
  type UrlsByDesign = Record<string, Record<string, string>>;
  const [mediaUrlsByDesign, setMediaUrlsByDesign] = useState<UrlsByDesign>(
    () => {
      if (typeof window === "undefined") return {};
      try {
        const raw = window.localStorage.getItem(MEDIA_URLS_STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as UrlsByDesign;
        }
        return {};
      } catch {
        return {};
      }
    },
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        MEDIA_URLS_STORAGE_KEY,
        JSON.stringify(mediaUrlsByDesign),
      );
    } catch {
      /* see overrides persistence — same trade-off */
    }
  }, [mediaUrlsByDesign]);

  // Slice for the focused design — flat shape FastIframeHost receives.
  const focusedUrls = useMemo(
    () => mediaUrlsByDesign[focusedId] ?? {},
    [mediaUrlsByDesign, focusedId],
  );

  // Per-instance prop overrides for selected MediaSurfaces.
  //
  // Shape is **nested by designId**: `Record<designId, Record<sourceKey, override>>`.
  // Why nested rather than flat:
  //   Two starter-template instantiations (e.g. two music apps the
  //   user spun up to compare designs) have IDENTICAL scaffold data,
  //   which means identical sourceKeys for their cards (album:One
  //   Direction|Midnight Memories|...). A flat global map keyed only
  //   by sourceKey would have those two instances share state — edit
  //   Discovery in Music App #1 and Music App #2's Discovery silently
  //   changes too. Per-design scoping decouples them. Inside a single
  //   design, sourceKey stays unique (scaffolds are curated to have
  //   no within-design duplicates), so no further keying is needed —
  //   for now. When same-content-different-instance becomes a thing
  //   inside ONE design, the deeper fix is per-instance synthetic IDs
  //   via React's useId() (see project_studio_per_instance_overrides
  //   memory for the longer plan).
  //
  // mediaUrls is **intentionally NOT** scoped this way — CDN URLs are
  // content-addressed and benefit from sharing across designs (fill
  // Discovery once, every design that references it picks it up). The
  // user-customisation case is what needs scoping; the cache-share
  // case is fine flat.
  const MEDIA_OVERRIDES_STORAGE_KEY = "studio:media-overrides-by-design";
  type MediaOverride = Partial<{
    hint: string;
    aspect: string;
    radius: string;
    border: boolean;
    loading: boolean;
    alt: string;
    src: string;
    emptyState: "auto" | "icon" | "none";
  }>;
  type OverridesByDesign = Record<string, Record<string, MediaOverride>>;
  const [mediaOverridesByDesign, setMediaOverridesByDesign] = useState<
    OverridesByDesign
  >(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(MEDIA_OVERRIDES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as OverridesByDesign;
      }
      return {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        MEDIA_OVERRIDES_STORAGE_KEY,
        JSON.stringify(mediaOverridesByDesign),
      );
    } catch {
      /* see mediaUrls persistence — same trade-off */
    }
  }, [mediaOverridesByDesign]);

  // Cleanup: when the user closes a design, the page-level state
  // (messages, selection, notes) drops the entry in `handleCloseDesign`.
  // The canvas-level per-design state (URL map, override map) lives
  // here, so the page can't reach in to clean it. Watch the `designs`
  // list — any designId that's in our state but no longer in the
  // designs array is orphaned and gets pruned. Same effect, same
  // localStorage key, just driven by the designs array as the source
  // of truth instead of a callback. Cleanup writes through to
  // localStorage on the next render (the persistence effects above
  // re-fire whenever the maps change).
  useEffect(() => {
    const liveIds = new Set(designs.map((d) => d.id));
    setMediaUrlsByDesign((prev) => {
      let changed = false;
      const next: typeof prev = {};
      for (const [k, v] of Object.entries(prev)) {
        if (liveIds.has(k)) {
          next[k] = v;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setMediaOverridesByDesign((prev) => {
      let changed = false;
      const next: typeof prev = {};
      for (const [k, v] of Object.entries(prev)) {
        if (liveIds.has(k)) {
          next[k] = v;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [designs]);

  // Slice for the focused design — the flat shape FastIframeHost
  // expects. Computed via useMemo so identity is stable when the
  // focused design's slice hasn't changed; the iframe-broadcast
  // useEffect avoids posting redundantly.
  const focusedOverrides = useMemo(
    () => mediaOverridesByDesign[focusedId] ?? {},
    [mediaOverridesByDesign, focusedId],
  );

  // Mirror frequently-changing values into refs so the long-lived
  // `grade:component-action` listener (installed once on mount with
  // empty deps) reads the LATEST appSource / focused id / mutation
  // callback. Without this the listener would close over stale values
  // every time it fires after the first render.
  //
  // Refs are initialised with placeholder values (null / focusedId /
  // onSourceMutation) so we don't touch `focusedAppSource` here — it's
  // computed later in the function from `focused?.appSource`, and
  // accessing it before its declaration trips a temporal-dead-zone
  // error. The effects below mirror the live values onto the refs
  // every render.
  const focusedAppSourceRef = useRef<string | null>(null);
  const focusedIdRef = useRef(focusedId);
  const onSourceMutationRef = useRef(onSourceMutation);
  useEffect(() => {
    focusedIdRef.current = focusedId;
  }, [focusedId]);
  useEffect(() => {
    onSourceMutationRef.current = onSourceMutation;
  }, [onSourceMutation]);
  // focusedAppSource is mirrored separately, AFTER its declaration
  // below — see the matching effect near `const focusedAppSource = …`.

  // ─── Per-slot action handler ─────────────────────────────────────
  //
  // The settings panel renders contract-declared `actions` as buttons
  // that dispatch `grade:component-action` events on the window. Here
  // we listen for those events and route by `detail.kind`. The two
  // recognised kinds today are MediaSurface's:
  //
  //   resolve-media-source — POST the single source to
  //                          /api/media/resolve-batch and merge the
  //                          returned URL into mediaUrls. Same shape as
  //                          the global Fill flow, just N=1.
  //   refresh-media-source — delete the existing entry first (so the
  //                          browser's <img onError> shows the
  //                          placeholder during the reload), then
  //                          resolve fresh.
  //
  // Both flip fidelity to "full" on success so the user sees the
  // result instead of staring at the same placeholder.
  useEffect(() => {
    async function handler(e: Event) {
      const evt = e as CustomEvent<{
        kind: string;
        source?: unknown;
        sourceJson?: string;
        componentName?: string;
      }>;
      const detail = evt.detail;
      if (!detail || typeof detail.kind !== "string") return;

      // The source descriptor — parsed by the panel from
      // selection.mediaSourceJson before the dispatch. If parsing
      // failed (malformed JSON on the element) the panel ships
      // sourceJson instead; we attempt one more parse here.
      let source = detail.source as
        | { kind: string; [key: string]: unknown }
        | undefined;
      if (!source && detail.sourceJson) {
        try {
          source = JSON.parse(detail.sourceJson);
        } catch {
          /* unrecoverable — bail */
          return;
        }
      }
      if (!source || typeof source !== "object" || !("kind" in source)) return;

      if (detail.kind === "set-media-override") {
        // Per-instance prop override. The panel ships
        // `{ propName, value }` in the event detail; we merge it
        // into the map under this slot's sourceKey. The canvas's
        // useEffect propagates the new map to every iframe, where
        // the agent stamps it on `window.__gradeMediaOverrides` and
        // MediaSurface picks it up via `useResolvedOverride`.
        const extra = (evt.detail as unknown as {
          propName?: string;
          value?: unknown;
        });
        const propName = extra?.propName;
        const value = extra?.value;
        if (typeof propName !== "string") return;
        const key = clientSideSourceKey(source);
        // Write into the focused design's override slot. The selection
        // event is always on the focused frame, so focusedId is the
        // correct scope. The nested update preserves other designs'
        // overrides untouched.
        const designId = focusedId;
        setMediaOverridesByDesign((prev) => {
          const designOverrides = prev[designId] ?? {};
          const cur = designOverrides[key] ?? {};
          if (value === null || value === undefined) {
            const nextSlot = { ...cur };
            delete (nextSlot as Record<string, unknown>)[propName];
            const nextDesign = { ...designOverrides };
            if (Object.keys(nextSlot).length === 0) {
              delete nextDesign[key];
            } else {
              nextDesign[key] = nextSlot;
            }
            // Drop the design entry entirely if no overrides remain
            // for it — keeps the persisted map from accumulating
            // empty design slots.
            if (Object.keys(nextDesign).length === 0) {
              const next = { ...prev };
              delete next[designId];
              return next;
            }
            return { ...prev, [designId]: nextDesign };
          }
          return {
            ...prev,
            [designId]: {
              ...designOverrides,
              [key]: { ...cur, [propName]: value },
            },
          };
        });
        return;
      }

      if (
        detail.kind === "resolve-media-source" ||
        detail.kind === "refresh-media-source"
      ) {
        // Pull the selection's instanceId + alt off the event detail.
        // The panel's ActionButton ships the full selection object so
        // we can pair the resolved URL back to the matching data-array
        // entry (instanceId) AND forward the designer's intent string
        // (mediaAlt) to the resolver as a prompt-style description.
        // No instanceId → standalone MediaSurface, can't write into a
        // data array; we still resolve the URL via the inline JSX path.
        const sel = (evt.detail as unknown as {
          selection?: { instanceId?: string; mediaAlt?: string };
        }).selection;
        const instanceId = sel?.instanceId;
        const description = sel?.mediaAlt;
        // Enrich the source with the description before sending. The
        // descriptor schemas are open (discriminated union on `kind`)
        // and providers ignore unknown fields, so adding `description`
        // here is non-breaking. Prompt-aware providers (Gemini, etc.)
        // read it; Picsum/MusicBrainz don't care.
        const enrichedSource = description
          ? { ...source, description }
          : source;
        const key = clientSideSourceKey(source);

        if (detail.kind === "refresh-media-source") {
          // Clear the existing src on the data entry (so MediaSurface
          // drops back to its placeholder while the refetch is in
          // flight) plus the legacy URL-map entry, which still drives
          // any non-data-driven MediaSurfaces.
          if (instanceId && focusedAppSourceRef.current && onSourceMutationRef.current) {
            const cleared = updateDataArrayEntry(
              focusedAppSourceRef.current,
              instanceId,
              "src",
              undefined,
            );
            if (cleared.ok && cleared.jsx && cleared.jsx !== focusedAppSourceRef.current) {
              onSourceMutationRef.current(cleared.jsx, "Refresh image");
            }
          }
          setMediaUrlsByDesign((prev) => {
            const designUrls = prev[focusedIdRef.current] ?? {};
            if (!(key in designUrls)) return prev;
            const nextDesign = { ...designUrls };
            delete nextDesign[key];
            return { ...prev, [focusedIdRef.current]: nextDesign };
          });
        }

        setFilling(true);
        setFillError(null);
        try {
          const res = await fetch("/api/media/resolve-batch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sources: [enrichedSource] }),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(
              `${res.status} ${res.statusText}${txt ? ` — ${txt.slice(0, 200)}` : ""}`,
            );
          }
          const data = (await res.json()) as {
            urls: Record<string, string>;
            filled: number;
            skipped: number;
          };
          const url = data.urls[key];
          let wroteToJsx = false;
          if (
            url &&
            instanceId &&
            focusedAppSourceRef.current &&
            onSourceMutationRef.current
          ) {
            const result = updateDataArrayEntry(
              focusedAppSourceRef.current,
              instanceId,
              "src",
              url,
            );
            if (result.ok && result.jsx && result.jsx !== focusedAppSourceRef.current) {
              onSourceMutationRef.current(
                result.jsx,
                detail.kind === "refresh-media-source" ? "Refresh image" : "Fill image",
              );
              wroteToJsx = true;
            }
          }
          // Legacy URL map: still merge for standalone MediaSurfaces
          // without instanceId. Once every MediaSurface lives inside a
          // data array, this side-channel can be dropped.
          if (!wroteToJsx && data.filled > 0) {
            setMediaUrlsByDesign((prev) => ({
              ...prev,
              [focusedIdRef.current]: {
                ...(prev[focusedIdRef.current] ?? {}),
                ...data.urls,
              },
            }));
          }
          if (data.filled > 0 || wroteToJsx) {
            setFidelity("full");
            setFillReport({
              filled: wroteToJsx ? 1 : data.filled,
              skipped: wroteToJsx ? 0 : data.skipped,
            });
            // Trail entry — the page (which has project + screen context)
            // listens for grade:image-action and logs it.
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("grade:image-action", {
                  detail: { action: "asset.fill", designId: focusedIdRef.current },
                }),
              );
            }
          } else {
            setFillReport({ filled: 0, skipped: data.skipped });
          }
        } catch (err) {
          setFillError(err instanceof Error ? err.message : String(err));
        } finally {
          setFilling(false);
        }
      }
    }

    window.addEventListener("grade:component-action", handler);
    return () => window.removeEventListener("grade:component-action", handler);
  }, []);

  /**
   * Wait for the next `grade:fast-compiled` message from any iframe.
   *
   * The sandbox emits this after it has committed its React render
   * (via `flushSync`), so on resolution the new DOM — including any
   * `data-gds-instance-id` attributes added by Studio's self-heal pass
   * — is guaranteed to be in place. Used by the Fill flow between
   * "push healed JSX" and "collect MediaSurface items from the DOM".
   *
   * Resolves on the FIRST matching message regardless of `requestId`
   * — Fill is a single-flight operation (the button is disabled while
   * in-flight) so cross-talk between requests doesn't happen today.
   * If we ever pipeline Fills we'd start matching by requestId here
   * and threading it through `onSourceMutation`.
   *
   * Falls back to resolving after `timeoutMs` so a wedged iframe
   * doesn't deadlock the Fill button. Caller accepts partial results
   * in that case.
   */
  const waitForFastCompiled = useCallback(
    (timeoutMs = 5000): Promise<void> => {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.clearTimeout(timer);
          window.removeEventListener("message", handler);
          resolve();
        };
        const handler = (e: MessageEvent) => {
          const data = e.data;
          if (!data || typeof data !== "object") return;
          if ((data as { type?: string }).type !== "grade:fast-compiled") return;
          finish();
        };
        const timer = window.setTimeout(finish, timeoutMs);
        window.addEventListener("message", handler);
      });
    },
    [],
  );

  /**
   * Find the focused Sandpack iframe and post a message to it. The
   * iframe lives a few levels down inside FocusedFrame; we tag its
   * container with `data-grade-focused-frame=""` so we can find it
   * without threading a ref up. Returns `false` if the iframe isn't
   * ready or the contentWindow rejects the post.
   */
  const postToFocusedIframe = useCallback(
    (payload: Record<string, unknown>): boolean => {
      const container = document.querySelector<HTMLElement>(
        "[data-grade-focused-frame]"
      );
      if (!container) return false;
      const iframe = container.querySelector("iframe");
      const win = iframe?.contentWindow;
      if (!win) return false;
      try {
        win.postMessage(payload, "*");
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * Request → response wrapper around postMessage. Sends
   * `grade:collect-media-sources` to the iframe and resolves with the
   * `{ instanceId, source }` items the agent walks out of the live DOM.
   *
   * The pairing of source ↔ instanceId is what lets the Fill flow write
   * resolved URLs BACK into the JSX (each data-array entry gets a `src`
   * field). The JSX is the source of truth — no parallel URL map needed,
   * undo snapshots are self-contained, exporting to CodeSandbox just
   * works.
   *
   * A correlation id pairs the response back to this specific call so
   * concurrent fills don't cross-contaminate (the user can't trigger
   * that today — the button is disabled while filling — but the
   * protocol stays correct in case we wire other fillers later).
   */
  const collectMediaSources = useCallback(
    async (): Promise<{ instanceId?: string; source: { kind: string; [k: string]: unknown } }[]> => {
      return new Promise((resolve, reject) => {
        const requestId = `fill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const timer = window.setTimeout(() => {
          window.removeEventListener("message", handler);
          reject(new Error("Timed out waiting for iframe to respond"));
        }, 8000);
        function handler(e: MessageEvent) {
          const data = e.data;
          if (!data || typeof data !== "object") return;
          if ((data as { type?: string }).type !== "grade:media-sources") return;
          if ((data as { requestId?: string }).requestId !== requestId) return;
          window.clearTimeout(timer);
          window.removeEventListener("message", handler);
          // The sandbox sends both `items` (new shape, source + instanceId
          // pairs) and `sources` (legacy, flat list). Prefer items; fall
          // back to sources only if the sandbox bundle is stale.
          const items = (data as { items?: { instanceId?: string; source: unknown }[] })
            .items;
          if (Array.isArray(items)) {
            const safe = items.filter(
              (it): it is { instanceId?: string; source: { kind: string; [k: string]: unknown } } =>
                !!it &&
                typeof it === "object" &&
                !!it.source &&
                typeof it.source === "object" &&
                "kind" in (it.source as object),
            );
            resolve(safe);
            return;
          }
          const sources = (data as { sources?: unknown[] }).sources ?? [];
          resolve(
            sources
              .filter(
                (s): s is { kind: string; [k: string]: unknown } =>
                  !!s && typeof s === "object" && "kind" in (s as object),
              )
              .map((source) => ({ source })),
          );
        }
        window.addEventListener("message", handler);
        const ok = postToFocusedIframe({
          type: "grade:collect-media-sources",
          requestId,
        });
        if (!ok) {
          window.clearTimeout(timer);
          window.removeEventListener("message", handler);
          reject(new Error("Focused preview iframe not ready"));
        }
      });
    },
    [postToFocusedIframe],
  );

  const postUrlsToFocusedIframe = useCallback(
    (urls: Record<string, string>) => {
      postToFocusedIframe({ type: "grade:set-media-urls", urls });
    },
    [postToFocusedIframe]
  );

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

  // Mirror focusedAppSource onto the ref declared near the top of the
  // component — the long-lived `grade:component-action` listener reads
  // from the ref so its closure stays current across renders.
  useEffect(() => {
    focusedAppSourceRef.current = focusedAppSource;
  }, [focusedAppSource]);

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

  // ─── Fill images — promoted out of the inline toolbar button into a
  // shared handler so the overflow DropdownMenuItem can call it. The
  // long form lives below; this is exactly the same flow:
  //   1. Self-heal pass to mint missing instanceIds (waits for the
  //      iframe to re-render before collecting).
  //   2. Collect runtime { instanceId, source } items from the DOM.
  //   3. POST to /api/media/resolve-batch to map sourceKey → URL.
  //   4. Patch the focused JSX (data-array write first, inline write
  //      as fall-through for standalone MediaSurfaces).
  //   5. Push the patched JSX through onSourceMutation; auto-flip
  //      fidelity to "full" so the result is visible.
  // Errors and counts go into the existing fillError / fillReport
  // state, which is surfaced as a small chip in the toolbar's leading
  // slot rather than as a sibling of a button that no longer exists.
  const handleFillImages = async () => {
    if (!focusedAppSource || filling) return;
    setFilling(true);
    setFillError(null);
    setFillReport(null);
    try {
      let patched = backfillMediaSurfaceSrcProp(focusedAppSource);
      if (patched !== focusedAppSource && onSourceMutation) {
        onSourceMutation(patched, "Self-heal for Fill");
        await waitForFastCompiled(5000);
      }
      const items = await collectMediaSources();
      if (items.length === 0) {
        setFillReport({ filled: 0, skipped: 0 });
        return;
      }
      const res = await fetch("/api/media/resolve-batch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sources: items.map((it) => it.source) }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `${res.status} ${res.statusText}${txt ? ` — ${txt.slice(0, 200)}` : ""}`,
        );
      }
      const data = (await res.json()) as {
        urls: Record<string, string>;
        filled: number;
        skipped: number;
      };
      let writtenCount = 0;
      const skippedNoInstance: number = items.filter(
        (it) => !it.instanceId,
      ).length;
      for (const it of items) {
        if (!it.instanceId) continue;
        const key = clientSideSourceKey(it.source);
        const url = data.urls[key];
        if (!url) continue;
        const arrayWrite = updateDataArrayEntry(
          patched,
          it.instanceId,
          "src",
          url,
        );
        if (arrayWrite.ok && arrayWrite.jsx) {
          patched = arrayWrite.jsx;
          writtenCount += 1;
          continue;
        }
        const inlineWrite = setInlineMediaSurfaceSrc(
          patched,
          it.instanceId,
          url,
        );
        if (inlineWrite.ok && inlineWrite.jsx) {
          patched = inlineWrite.jsx;
          writtenCount += 1;
        }
      }
      if (writtenCount > 0 && onSourceMutation) {
        onSourceMutation(
          patched,
          writtenCount === 1
            ? "Fill image"
            : `Fill ${writtenCount} images`,
        );
      }
      if (data.filled > 0 || writtenCount > 0) {
        setFidelity("full");
      }
      setFillReport({
        filled: writtenCount,
        skipped: data.skipped + skippedNoInstance,
      });
    } catch (err) {
      setFillError(err instanceof Error ? err.message : String(err));
    } finally {
      setFilling(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      {/* Canvas toolbar — DS Toolbar primitive with leading/trailing
          slots. Leading hosts the breadcrumb + live status chips;
          trailing hosts the screen-state action cluster (or the
          grid-state add-a-screen cluster when zoomed out). The
          Toolbar's auto/1fr/auto grid keeps leading flush-left and
          trailing flush-right with no manual flex math. */}
      <Toolbar
        position="top"
        size="sm"
        aria-label="Canvas toolbar"
        className="px-3 shrink-0"
        leading={
          <div className="flex items-center gap-2 min-w-0 text-xs text-muted-foreground">
          {/* Left-panel toggle — show/hide the chat column. Lives in the
              start slot of the canvas toolbar (page-level chrome is
              owned by the parent; this is just the affordance). The
              icon is static — state is communicated by aria-pressed +
              tooltip swap rather than an icon flip, which avoids the
              "is it currently showing the open or closed glyph?"
              ambiguity that PanelLeftOpen/Close pairs introduce. The
              ⌘\ hint mirrors VS Code's "Toggle Sidebar" shortcut,
              which the studio page wires globally. */}
          {onToggleLeftPanel && (
            <button
              type="button"
              onClick={onToggleLeftPanel}
              aria-pressed={leftPanelOpen}
              aria-label={leftPanelOpen ? "Hide chat panel" : "Show chat panel"}
              title={
                leftPanelOpen
                  ? "Hide chat panel (⌘\\)"
                  : "Show chat panel (⌘\\)"
              }
              className={cn(
                "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                "[&_svg]:size-3.5 [&_svg]:shrink-0",
                leftPanelOpen
                  ? "text-foreground hover:bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <PanelLeft />
            </button>
          )}
          {isFit && focused ? (
            <DesignBreadcrumb
              focused={focused}
              onBack={() => setZoom("all")}
              onRename={onRenameDesign}
              // Surface the project as the parent crumb so the
              // breadcrumb reads as a real "you are here" trail.
              // Click navigates back to the grid (same target the
              // old "All screens" link served, just labelled with
              // project context). Falls back to "All screens" for
              // embed consumers without project semantics.
              parentLabel={projectName ?? "All screens"}
            />
          ) : (
            // Grid-mode heading: project name as the where-am-I
            // anchor, screen count as a subordinate counter.
            <span className="flex items-center gap-1.5 px-1 text-xs">
              {projectName && (
                <>
                  <span className="font-medium text-foreground">
                    {projectName}
                  </span>
                  <span className="text-muted-foreground">/</span>
                </>
              )}
              <span className="font-medium text-foreground">
                All screens
              </span>
              {designs.length > 1 && (
                <span className="text-muted-foreground">
                  ({designs.length})
                </span>
              )}
            </span>
          )}
          {isFit && selection?.componentName && (
            <SelectionChip selection={selection} prefix="Editing" />
          )}
          {isStreaming && isFit && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating
            </span>
          )}
          {/* Fill status chip — surfaces success / skipped / error
              counts now that the inline button has moved into the
              overflow. Filling-in-progress is shown on the menu
              item itself; this chip appears once the run completes.
              Hidden again the next time Fill runs (the handler
              clears fillReport + fillError on entry). */}
          {isFit && fillReport && !filling && (
            <span
              className="text-[10px] text-muted-foreground tabular-nums"
              title={`Filled ${fillReport.filled} slot${fillReport.filled === 1 ? "" : "s"}; skipped ${fillReport.skipped} (dynamic or no result)`}
            >
              {fillReport.filled} filled
              {fillReport.skipped > 0 && ` · ${fillReport.skipped} skipped`}
            </span>
          )}
          {isFit && fillError && !filling && (
            <span
              className="text-[10px] text-destructive tabular-nums truncate max-w-[12rem]"
              title={fillError}
            >
              Fill failed
            </span>
          )}
          {/* Persistence status — saving / saved / error. Sits with the
              other live chips. `idle` and the brief "saved" flash keep
              the chrome calm; an error stays put (and red) until the
              next successful write so a silent data-loss can't happen. */}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span
              className="text-[10px] text-destructive tabular-nums"
              title="Your last change could not be saved to the server. It is still on screen but not yet durable — keep this tab open; the next edit will retry."
            >
              Save failed — not saved
            </span>
          )}
          </div>
        }
        trailing={
        <div className="flex items-center gap-1">
          {/* No more Fit/All toggle — navigation between the two
              states goes through the breadcrumb ("All screens" link
              returns to grid-state) and the grid itself (clicking a
              tile enters screen-state). One way to switch, no two
              redundant affordances. */}

          {isFit ? (
            // ─── Screen-state cluster ─────────────────────────────
            // Per-screen actions, left-to-right:
            //   - Undo / Redo (per-design history)
            //   - Preview/Code (icon-only with tooltips)
            //   - Viewport width (Mobile/Tablet/Desktop/Responsive)
            //   - Select (element pick)
            //   - Overflow menu (Duplicate, Open in CodeSandbox, Share)
            // All operate on the focused screen — they belong on the
            // same row as the breadcrumb that names that screen.
            <div className="flex items-center gap-2">
              {/* Undo / Redo — per-design history. Tooltip exposes the
                  label of the snapshot we'd restore so the user can
                  tell whether the next ⌘Z reverts a Fill or a panel
                  edit. Disabled state surfaces the "nothing to undo"
                  case cleanly without us hiding the affordance.
                  Keyboard ⌘Z / ⌘⇧Z (and ⌘Y for redo) is wired in
                  studio/page.tsx so the shortcut works anywhere on
                  the canvas, not just when the button has focus. */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo || !onUndo}
                  title={
                    canUndo
                      ? `Undo${undoLabel ? ` ${undoLabel}` : ""} (⌘Z)`
                      : "Nothing to undo"
                  }
                  aria-label="Undo"
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                    "[&_svg]:size-3.5 [&_svg]:shrink-0",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                >
                  <Undo2 />
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo || !onRedo}
                  title={
                    canRedo
                      ? `Redo${redoLabel ? ` ${redoLabel}` : ""} (⌘⇧Z)`
                      : "Nothing to redo"
                  }
                  aria-label="Redo"
                  className={cn(
                    "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                    "[&_svg]:size-3.5 [&_svg]:shrink-0",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                >
                  <Redo2 />
                </button>
              </div>
              {/* Preview / Code — icon-only; the tooltip prop on each
                  item carries the label (and fills in aria-label for
                  screen readers, so we don't have to repeat it). */}
              <ToggleGroup
                type="single"
                size="sm"
                value={view}
                onValueChange={(v: string) => {
                  if (v === "preview" || v === "code" || v === "timeline")
                    onViewChange(v);
                }}
                aria-label="Preview mode"
              >
                <ToggleGroupItem value="preview" tooltip="Preview">
                  <Eye />
                </ToggleGroupItem>
                <ToggleGroupItem value="code" tooltip="Code">
                  <Code2 />
                </ToggleGroupItem>
                <ToggleGroupItem value="timeline" tooltip="Timeline">
                  <Film />
                </ToggleGroupItem>
              </ToggleGroup>
              {/* Replay — re-keys the focused iframe so every inView
                  reveal + mount animation runs again. Lives next to the
                  Preview/Code toggle (was a floating overlay in the
                  preview chrome; user flagged that as out of place,
                  toolbar is the right home). Disabled in Code view —
                  there's no preview animation to replay there. */}
              <button
                type="button"
                onClick={replay}
                disabled={view !== "preview"}
                title="Replay animations"
                aria-label="Replay animations"
                className={cn(
                  "h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                  "[&_svg]:size-3.5 [&_svg]:shrink-0",
                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                  "disabled:opacity-40 disabled:pointer-events-none",
                )}
              >
                <RotateCcw />
              </button>
              {/* Viewport width — icon-only with tooltips. Responsive
                  picks up MoveHorizontal (←→) as its glyph since it
                  conveys "stretches to fill the column" without
                  needing a text label. */}
              <ToggleGroup
                type="single"
                size="sm"
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
                <ToggleGroupItem value="mobile" tooltip="Mobile — 390px">
                  <Smartphone />
                </ToggleGroupItem>
                <ToggleGroupItem value="tablet" tooltip="Tablet — 768px">
                  <Tablet />
                </ToggleGroupItem>
                <ToggleGroupItem value="desktop" tooltip="Desktop — 1024px">
                  <Monitor />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="responsive"
                  tooltip="Responsive — fills the column"
                >
                  <MoveHorizontal />
                </ToggleGroupItem>
              </ToggleGroup>
              {/* Fidelity toggle removed — wireframe/full has no
                  product surface yet; fidelity is pinned to "full"
                  via the constant near the top of this component. */}
              {/* Fill images has moved into the overflow menu below
                  to cut toolbar clutter. The handler is hoisted as
                  `handleFillImages` near the top of the component;
                  status (filling spinner, filled count, errors) lives
                  on the menu item label + a small chip in the
                  toolbar's leading slot. */}

              {/* Canvas picker — one toggle per destination mode.
                  Mutually exclusive (the canvasMode state holds at
                  most one); clicking the active mode again exits
                  to the null/interactive state. Both buttons share
                  the same active-style + capture mechanism in the
                  iframe; only the page-side callback differs. */}
              <button
                type="button"
                onClick={() => toggleCanvasMode("select")}
                disabled={!focusedAppSource || !focusedCanRender}
                aria-pressed={selectMode}
                title={
                  selectMode
                    ? "Click an element in the preview to attach it to your next prompt"
                    : "Enable element select — click a component to attach it to chat"
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
              {/* Comment mode — same picker mechanism, routes the
                  pick into the Comments tab (new-thread composer)
                  instead of chat. Hidden when there's no
                  comment-select consumer wired (embed surfaces). */}
              {onCommentSelect && (
                <button
                  type="button"
                  onClick={() => toggleCanvasMode("comment")}
                  disabled={!focusedAppSource || !focusedCanRender}
                  aria-pressed={commentMode}
                  title={
                    commentMode
                      ? "Click an element in the preview to start a comment thread on it"
                      : "Enable comment mode — click a component to leave feedback on it"
                  }
                  className={cn(
                    "h-7 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                    "[&_svg]:size-3.5 [&_svg]:shrink-0",
                    commentMode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                >
                  <MessageSquare />
                  {commentMode ? "Pick…" : "Comment"}
                </button>
              )}

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
                  {/* Fill images — relocated from the inline toolbar
                      button so the chrome reads cleaner. Same handler,
                      same side effects (fidelity flip + onSourceMutation).
                      Status surfaces as a chip in the leading slot
                      after the action settles. */}
                  <DropdownMenuItem
                    onClick={handleFillImages}
                    disabled={!focusedAppSource || filling}
                  >
                    {filling ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <ImageIcon />
                    )}
                    {filling ? "Filling images…" : "Fill images"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
                  <DropdownMenuItem
                    onClick={() => onShareScreen?.(focusedId, viewportWidth)}
                    disabled={!focusedAppSource || !onShareScreen}
                  >
                    <Share2 />
                    Copy share link
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onInviteToProject?.()}
                    disabled={!onInviteToProject}
                  >
                    <UserPlus />
                    Invite people…
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
          {/* Right-panel toggle — sits at the very end of the toolbar
              and lives in both Fit and Grid mode (panel visibility is
              chrome, not canvas state). Mirror of the left toggle in
              the leading slot — same icon-only treatment, same
              aria-pressed semantics, tooltip swaps for show/hide.
              ⌘⇧\ matches VS Code's "Toggle Secondary Sidebar". */}
          {onToggleRightPanel && (
            <button
              type="button"
              onClick={onToggleRightPanel}
              aria-pressed={rightPanelOpen}
              aria-label={
                rightPanelOpen
                  ? "Hide settings panel"
                  : "Show settings panel"
              }
              title={
                rightPanelOpen
                  ? "Hide settings panel (⌘⇧\\)"
                  : "Show settings panel (⌘⇧\\)"
              }
              className={cn(
                "ml-1 h-7 w-7 inline-flex items-center justify-center rounded-md transition-colors",
                "[&_svg]:size-3.5 [&_svg]:shrink-0",
                rightPanelOpen
                  ? "text-foreground hover:bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <PanelRight />
            </button>
          )}
        </div>
        }
      />

      {/* Path bar — column-view-style breadcrumb between toolbar and
          canvas. Lets the designer walk the rendered tree by clicking
          dropdowns at each level rather than hunting for deeply-nested
          components in the canvas. Only shown in Fit view (the All
          tile grid has no single "selected design" to render a path
          for). */}
      {isFit && (
        <CanvasPathBar selection={selection} />
      )}

      {/* Body. Both FocusedFrame and TileGrid stay mounted once they've
          been visited — we toggle visibility via `hidden` rather than
          unmount/remount so Sandpack iframes don't reboot on every
          Fit ↔ All flip. TileGrid is gated on `hasEnteredAll` so we
          don't pay the boot cost until the user actually opens it. */}
      <FocusedFrame
        appSource={focusedAppSource}
        onSourceMutation={onSourceMutation}
        theme={theme}
        mode={mode}
        // Timeline is a dock UNDER the preview, not a replacement for it —
        // collapse it to the preview render so the screen still shows above
        // the timeline panel.
        view={view === "code" ? "code" : "preview"}
        isStreaming={isStreaming}
        selection={selection}
        onSelect={onSelect}
        onClearSelection={onClearSelection}
        selectMode={selectMode}
        onSelectModeChange={(next) => {
          // Bridge FocusedFrame's boolean API to the unified
          // canvasMode enum. Frame asking to enable select while
          // we're in comment mode wins for select (frame is the
          // authority on its own state). Frame asking to disable
          // only clears canvasMode when select was the active
          // mode — leaves comment mode alone.
          if (next) setCanvasMode("select");
          else if (canvasMode === "select") setCanvasMode(null);
        }}
        commentMode={commentMode}
        onCommentSelect={onCommentSelect}
        onCommentSubmit={onCommentSubmit}
        currentUserForComment={currentUserForComment}
        commentThreads={commentThreads}
        activeCommentThreadId={activeCommentThreadId}
        onCommentPinClick={onCommentPinClick}
        getCommentUser={getCommentUser}
        viewportWidth={viewportWidth}
        replayKey={replayKey}
        fidelity={fidelity}
        mediaUrls={focusedUrls}
        mediaOverrides={focusedOverrides}
        hidden={!isFit}
        rendererMode={rendererMode}
      />
      {/* Timeline dock — a flex child at the bottom of app-main, so the
          preview (flex-1, above) shrinks to make room. Placeholder for now;
          the real thing gets camera + element tracks with draggable scrub
          handles. Only in Fit view (the grid has no single screen to direct). */}
      {view === "timeline" && isFit && (
        <TimelineDock appSource={focusedAppSource} />
      )}
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
          onShareScreen={onShareScreen}
          theme={theme}
          mode={mode}
          fidelity={fidelity}
          mediaUrlsByDesign={mediaUrlsByDesign}
          mediaOverridesByDesign={mediaOverridesByDesign}
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
  /** Source write-back (chat/Fill/editor). Forwarded to FocusedFastMount
   *  as onSourceEdit so the Code view's editor can mutate the source. */
  onSourceMutation?: (next: string, label?: string) => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  isStreaming: boolean;
  selection: StudioSelection | null;
  onSelect?: (selection: StudioSelection) => void;
  onClearSelection?: () => void;
  /** Controlled select-mode. Lifted up so the toggle button can live
   *  in the canvas header. */
  selectMode: boolean;
  onSelectModeChange: (next: boolean) => void;
  /** Controlled comment-mode — same shape as selectMode. When true,
   *  the same iframe capture mechanism is on, but element picks are
   *  routed to `onCommentSelect` instead of `onSelect`. */
  commentMode?: boolean;
  onCommentSelect?: (selection: StudioSelection) => void;
  /** Fires when the inline overlay's composer is submitted. Consumer
   *  persists the thread; the overlay closes on resolve. */
  onCommentSubmit?: (input: {
    selection: StudioSelection;
    body: string;
  }) => Promise<void> | void;
  /** Current user for the inline overlay's composer avatar. */
  currentUserForComment?: {
    name: string;
    avatarUrl?: string;
  };
  /** Comment threads to surface as positioned pins over the
   *  preview. Forwarded to FocusedFastMount → FastIframeHost
   *  → CanvasCommentPinsOverlay. Empty / undefined = no pins. */
  commentThreads?: CommentThreadWithMessages[];
  activeCommentThreadId?: string | null;
  onCommentPinClick?: (threadId: string) => void;
  /** Forwarded to the pins overlay so each pin can render the
   *  thread originator's Avatar. */
  getCommentUser?: (id: string) => import("@/lib/studio-users").User | undefined;
  /** Current viewport width constraint for the preview iframe.
   *  "responsive" means no constraint — the iframe fills the column.
   *  Applied only to the Preview view; the Code view always uses the
   *  full column because narrowing a text editor is user-hostile. */
  viewportWidth: ViewportWidth;
  /** Replay counter. Bumping it re-keys the focused iframe so every
   *  inView reveal + mount animation runs again. Owned by the outer
   *  StudioCanvas (toolbar Replay button lives there); FocusedFrame
   *  is a pass-through. */
  replayKey: number;
  /** Fidelity — `"wireframe"` shows MediaSurface placeholders only;
   *  `"full"` shows the underlying images/video/canvas. The toggle is
   *  delivered to the iframe via postMessage and lands as a single
   *  attribute on the iframe root (data-fidelity), where CSS in the
   *  playground stylesheet drives the visible/hidden state. */
  fidelity: "wireframe" | "full";
  /** Resolved media URL map (sourceKey → url). Forwarded down to the
   *  iframe host so MediaSurface inside the focused preview reads
   *  resolved URLs alongside the All-view tiles. */
  mediaUrls: Record<string, string>;
  /** Per-instance MediaSurface prop overrides (sourceKey → partial
   *  props). Same flow as mediaUrls. */
  mediaOverrides: Record<string, Record<string, unknown>>;
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
  onSourceMutation,
  theme,
  mode,
  view,
  isStreaming,
  selection,
  onSelect,
  onClearSelection,
  selectMode,
  onSelectModeChange,
  commentMode = false,
  onCommentSelect,
  commentThreads,
  activeCommentThreadId,
  onCommentPinClick,
  getCommentUser,
  viewportWidth,
  replayKey,
  fidelity,
  mediaUrls,
  mediaOverrides,
  hidden = false,
  rendererMode = "sandpack",
}: FocusedFrameProps) {
  // Iframe-side capture is on whenever EITHER toolbar mode is on.
  // The page-side handler routes to the right consumer based on
  // which mode triggered it.
  const captureOn = selectMode || commentMode;
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

  // appSource changes now leave select mode + the persistent selection
  // ring alone. Earlier this effect cleared select mode on every JSX
  // mutation under the theory that the picked element might be gone —
  // but with the persistent-ring redesign that ALSO killed selection
  // on every settings-panel edit (which mutates appSource even though
  // the element absolutely still exists). Net result: clicking a prop
  // dropdown in the right panel dropped both the ring and the chip,
  // which felt awful.
  //
  // Trade-off: if a chat regenerates JSX that no longer contains the
  // selected element, the ring lingers at stale coordinates. The
  // agent's `getBoundingClientRect()` on a detached element returns
  // a 0x0 box so the ring visually collapses, and Escape always
  // clears explicitly. A future iteration can re-locate the element
  // by componentName+part after appSource mutations to reposition
  // the ring smartly.
  const appSourceRef = useRef(appSource);
  useEffect(() => {
    appSourceRef.current = appSource;
  }, [appSource]);

  // ─── Bundling overlay ──────────────────────────────────────────────
  //
  // The user-perceived gap is "model finished talking → screen actually
  // repaints" — Sandpack chewing through a fresh App.tsx after every
  // stream completion (and on settings-panel mutations). Mask it with a
  // dialog so the wait reads as intentional. Trigger is the **stream-end
  // edge** of `isStreaming`: reliable, fires once per response. Hold for
  // a 1.2s min so quick bundles don't flash, with a 5s safety ceiling.
  // Sandpack's `status === "running"` would be a cleaner close signal,
  // but it doesn't surface reliably for HMR-style incremental updates,
  // so we rely on the timer as the source of truth.
  const [bundling, setBundling] = useState(false);
  const prevIsStreamingRef = useRef(isStreaming);
  useEffect(() => {
    const prev = prevIsStreamingRef.current;
    prevIsStreamingRef.current = isStreaming;
    if (prev && !isStreaming && appSource) {
      setBundling(true);
      const minId = window.setTimeout(() => setBundling(false), 1200);
      const safetyId = window.setTimeout(() => setBundling(false), 5000);
      return () => {
        window.clearTimeout(minId);
        window.clearTimeout(safetyId);
      };
    }
  }, [isStreaming, appSource]);

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
    postToIframe({ type: "grade:select-mode", enabled: captureOn });
  }, [captureOn, postToIframe]);

  useEffect(() => {
    if (!selection) {
      postToIframe({ type: "grade:clear-selection" });
    }
  }, [selection, postToIframe]);

  // Push fidelity into the iframe whenever it changes. The agent in the
  // iframe writes it to `<html data-fidelity>`; the playground stylesheet
  // selectors take care of hiding the media-surface-content layer when
  // wireframe. No re-bundle, no React state inside the iframe.
  useEffect(() => {
    postToIframe({ type: "grade:set-fidelity", value: fidelity });
  }, [fidelity, postToIframe]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      const type = (data as { type?: string }).type;
      if (type === "grade:selected") {
        const sel = (data as { selection?: StudioSelection }).selection;
        if (sel && typeof sel === "object") {
          // Route by mode. Both modes share the iframe's capture
          // mechanism — the page-side handler is what differs.
          // Comment mode wins when both happen to be on (shouldn't
          // happen, the toolbar enforces mutual exclusivity, but
          // belt-and-braces).
          if (commentMode) {
            onCommentSelect?.(sel);
          } else {
            onSelect?.(sel);
          }
          // No auto-exit any more — the persistent selection ring (added
          // in the same redesign that introduced grade:selection-cleared)
          // requires select mode to stay on so the user can see what
          // they've picked, switch to another element with one more
          // click, or hit Escape to clear. Toggling the Select pill off
          // is the explicit exit gesture.
        }
      } else if (type === "grade:selection-cleared") {
        // Iframe-side Escape — drop the parent's chip too. Same code
        // path FastIframeHost uses; duplicated here because the
        // Sandpack-era listener in FocusedFrame is a separate `message`
        // subscriber (it catches from any iframe, not just the focused
        // one — both renderers' messages flow through this handler).
        onClearSelection?.();
      } else if (type === "grade:agent-ready") {
        // Fresh iframe — replay our current intent. Fidelity has to be
        // re-sent here too: a Sandpack reboot drops the previous
        // data-fidelity attribute on <html>, and without this the iframe
        // would default to "full" until the next user-driven toggle.
        postToIframe({ type: "grade:select-mode", enabled: captureOn });
        postToIframe({ type: "grade:set-fidelity", value: fidelity });
        if (!selection) {
          postToIframe({ type: "grade:clear-selection" });
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [
    onSelect,
    onCommentSelect,
    onSelectModeChange,
    postToIframe,
    captureOn,
    commentMode,
    selection,
    fidelity,
  ]);

  return (
    <div
      ref={previewContainerRef}
      data-grade-focused-frame=""
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
          replayKey={replayKey}
          selectMode={selectMode}
          onSelect={onSelect}
          onClearSelection={onClearSelection}
          onSelectModeChange={onSelectModeChange}
          fidelity={fidelity}
          mediaUrls={mediaUrls}
          mediaOverrides={mediaOverrides}
          commentThreads={commentThreads}
          activeCommentThreadId={activeCommentThreadId}
          onCommentPinClick={onCommentPinClick}
          getCommentUser={getCommentUser}
          onSourceEdit={onSourceMutation}
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

      {/* Gated on Sandpack — the dialog masks Sandpack's post-stream
          bundler lag. The fast renderer has no separate bundle
          step, so firing the dialog there just produces a jarring
          full-screen scrim at the moment of stream completion for
          no reason. */}
      <PreviewLoadingDialog
        open={
          rendererMode === "sandpack" && bundling && Boolean(appSource)
        }
      />
    </div>
  );
}

/**
 * Modal loading dialog shown while Sandpack is rebundling a freshly-arrived
 * App.tsx (post-stream-end). Composes the DS <Dialog> primitive so the
 * scrim, portal, focus trap, and entry/exit animation are inherited from
 * the same component the rest of the product uses — no bespoke overlay.
 *
 *   - `[&>button]:hidden` on DialogContent suppresses the auto-rendered X.
 *     Loading isn't user-cancellable (closing the dialog wouldn't stop the
 *     bundler) so the affordance would mislead.
 *   - Escape / pointer-outside / interact-outside handlers all `preventDefault`
 *     so the dialog can't be dismissed by accident.
 *   - `useRotatingPhrase()` shares the phrase pool with the chat's thinking
 *     indicator so the two surfaces read as one continuous loading state.
 *   - sr-only DialogTitle keeps Radix's a11y warning quiet without adding
 *     visible chrome to the surface.
 */
function PreviewLoadingDialog({ open }: { open: boolean }) {
  const phrase = useRotatingPhrase();
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-sm [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Updating preview</DialogTitle>
        <div className="flex flex-col items-center justify-center gap-4 py-2">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
          <AnimatePresence mode="wait">
            <motion.p
              key={phrase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground"
            >
              {phrase}…
            </motion.p>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compute the same `sourceKey` the server uses for MediaSurface URL
 * map entries. Algorithm MUST match `sourceKey()` in
 * @gradeui/media/sources/router.ts — duplicated here because
 * @gradeui/media is server-only (sharp + Vercel Blob deps). If you
 * change one, change both. There's a parallel copy in
 * packages/ui/components/ui/media-surface.tsx (`sourceKeyFor`) for
 * the in-iframe lookup; same rule applies.
 */
function clientSideSourceKey(source: { kind: string; [key: string]: unknown }): string {
  const s = source as Record<string, unknown>;
  switch (source.kind) {
    case "album":
      return `album:${s.artist}|${s.title}|${s.year ?? ""}`;
    case "tv-show":
      return `tv-show:${s.title}|${s.year ?? ""}`;
    case "movie":
      return `movie:${s.title}|${s.year ?? ""}`;
    case "game":
      return `game:${s.title}`;
    case "book":
      return `book:${s.isbn ?? ""}|${s.title ?? ""}|${s.author ?? ""}`;
    case "poster":
      return `poster:${s.title}|${s.year ?? ""}`;
    case "portrait":
      return `portrait:${s.name ?? ""}|${s.role ?? ""}`;
    case "landscape":
      return `landscape:${s.location ?? ""}|${s.mood ?? ""}`;
    case "product":
      return `product:${s.brand ?? ""}|${s.name ?? ""}`;
    case "food":
      return `food:${s.dish ?? ""}|${s.cuisine ?? ""}`;
    case "generic":
      return `generic:${s.prompt}`;
    default:
      return `${source.kind}:`;
  }
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
  /** Mint + copy a share link for a screen (tile overflow menu). */
  onShareScreen?: (id: string) => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  /** Wireframe / full toggle, forwarded to each tile's iframe so the
   *  All-view tiles render identically to the focused frame. */
  fidelity: "wireframe" | "full";
  /** Per-design URL maps. Each tile slices to ITS own design's slot
   *  so Music App #1's URLs don't leak into Music App #2's tile.
   *  Slicing happens at the ScreenTile level (it has access to
   *  design.id); the grid just passes the nested map through. */
  mediaUrlsByDesign: Record<string, Record<string, string>>;
  /** Per-design override maps. Same scoping as mediaUrlsByDesign. */
  mediaOverridesByDesign: Record<string, Record<string, Record<string, unknown>>>;
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
  onShareScreen,
  theme,
  mode,
  fidelity,
  mediaUrlsByDesign,
  mediaOverridesByDesign,
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
            // The grid only ever renders at the project home (no screen
            // focused), so no tile is "focused" here — the active id is
            // just where you'll land when you open one, not a selection.
            focused={false}
            onFocus={() => onFocus(d.id)}
            onExpand={() => onExpand(d.id)}
            onClose={canClose ? () => onClose(d.id) : undefined}
            onShareScreen={onShareScreen ? () => onShareScreen(d.id) : undefined}
            theme={theme}
            mode={mode}
            fidelity={fidelity}
            // Slice each tile to its OWN design's URL + override map.
            // Without this, every tile would either share the focused
            // design's slice (cross-design state leakage) or get the
            // raw nested map (wrong shape, MediaSurface wouldn't find
            // its URL by sourceKey).
            mediaUrls={mediaUrlsByDesign[d.id] ?? {}}
            mediaOverrides={mediaOverridesByDesign[d.id] ?? {}}
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
  /** Mint + copy a share link for this screen (overflow menu). Omit to
   *  hide the Share item. */
  onShareScreen?: () => void;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  fidelity: "wireframe" | "full";
  mediaUrls: Record<string, string>;
  mediaOverrides: Record<string, Record<string, unknown>>;
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
  onExpand,
  onClose,
  onShareScreen,
  theme,
  mode,
  fidelity,
  mediaUrls,
  mediaOverrides,
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
      aria-label={`Open ${design.name}`}
      tabIndex={0}
      // A single click opens the screen — clicking a thumbnail takes you
      // straight to the actual screen rather than just selecting it in
      // place. (onExpand = focus this design + enter the fit view.)
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          // Space would otherwise scroll. Eat both and open the screen.
          e.preventDefault();
          onExpand();
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
        {/* Overflow menu — replaces the old expand/close icons. The tile
            body is a single click-to-open target now; per-screen actions
            live here. stopPropagation everywhere so opening the menu (or
            picking an item) doesn't also fire the tile's open click. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
              title="More"
              aria-label={`More actions for ${design.name}`}
            >
              <MoreHorizontal />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
            >
              <Maximize2 />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!design.appSource}
              onClick={(e) => {
                e.stopPropagation();
                if (!design.appSource || typeof window === "undefined") return;
                const key = `grade:screen:${design.id}`;
                try {
                  window.localStorage.setItem(
                    key,
                    JSON.stringify({
                      source: design.appSource,
                      name: design.name,
                    }),
                  );
                } catch {
                  return;
                }
                window.open(
                  `/fast-sandbox#screen=${encodeURIComponent(key)}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              <Eye />
              Preview
            </DropdownMenuItem>
            {onShareScreen && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onShareScreen();
                }}
              >
                <Share2 />
                Share
              </DropdownMenuItem>
            )}
            {onClose && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
              fidelity={fidelity}
              mediaUrls={mediaUrls}
              mediaOverrides={mediaOverrides}
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
