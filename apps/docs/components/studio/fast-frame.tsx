"use client";

/**
 * Fast renderer — iframe edition.
 *
 * Hosts a dedicated Next sandbox page (`/fast-sandbox`) in an iframe and
 * pipes source / theme / selection via postMessage. React lives *inside*
 * the iframe, so:
 *
 *   - Radix portals (Dialog, Popover, DropdownMenu, Sheet, Tooltip, etc.)
 *     land in `iframe.body` rather than leaking to the Studio chrome.
 *   - `instanceof HTMLElement` and other cross-realm checks resolve
 *     against the iframe's own window — no realm mismatches.
 *   - `@media` queries evaluate against the iframe's viewport, so the
 *     viewport-width picker (Mobile 390 / Tablet 768 / Desktop 1024)
 *     actually trips responsive breakpoints inside the preview.
 *   - Scroll events never cross the iframe boundary → no Lenis
 *     touchpoint, no overscroll-behavior hacks.
 *
 * What still lives here (parent realm):
 *   - Iframe lifecycle + message plumbing
 *   - Preview chrome (viewport artboard, Code view read-only pre)
 *   - Per-tile scaling math for All mode
 *
 * What moved to the sandbox page:
 *   - Module vocabulary (all @gradeui/ui, lucide, recharts, etc.)
 *   - sucrase compile + new Function eval
 *   - Selection agent (installStudioSelectionAgent from the shared
 *     module — same one Sandpack will consume once task #10 lands)
 *   - Default provider wrapping (TooltipProvider) so snippets don't
 *     need to include boilerplate a normal app root already has.
 *
 * Exports mirror sandpack-frame.tsx so StudioCanvas switches renderers
 * with a single conditional:
 *   FocusedFastMount — full-column preview with view (preview/code) +
 *                      viewport-width artboard.
 *   TileFastMount    — shrunken preview for All-mode tiles. Pure iframe,
 *                      no chrome.
 */

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  prepareAppSource,
  type StudioSelection,
} from "@/lib/chat-sandpack";
import { CodeView } from "@/components/studio/code-view";
import { CanvasCommentPinsOverlay } from "@/components/studio/canvas-comment-pins-overlay";
import { SourceEditor } from "@/components/studio/source-editor";
import type { CommentThreadWithMessages } from "@/lib/studio-storage";
import { GradePayloadPanel } from "@gradeui/walker";
import {
  STUDIO_REWRITE_RULES,
  STUDIO_UNWRAP_TYPES,
} from "@/lib/studio-walker-register";
import { toast } from "sonner";
import { themeToCSSVars } from "@/lib/themes/apply";
import type { GeneratedTheme } from "@/lib/themes";
import type { ViewportWidth } from "@/components/studio/sandpack-frame";
import {
  ARTBOARD_DEVICE_SIZES,
  ZOOM_MAX,
  ZOOM_MIN,
} from "@/components/studio/use-artboard-zoom";

// URL of the sandbox Next route. Route is defined at
// apps/docs/app/fast-sandbox/page.tsx.
const SANDBOX_URL = "/fast-sandbox";

// ─── FastIframeHost ───────────────────────────────────────────────────
//
// Core building block — a configured iframe + message bus. Single
// instance for FocusedFastMount, one per tile for TileFastMount.

interface FastIframeHostProps {
  appSource: string | null;
  /** Mid-stream speculative draft — auto-closed partial JSX from
   *  `lib/studio-stream-draft.ts`, present only while the chat is
   *  streaming with "Stream response text" on. Compiled with
   *  `speculative: true` so failures are silent (the sandbox keeps the
   *  last good render); the final sealed fence lands via `appSource`
   *  through the normal loud compile path. */
  draftSource?: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  selectMode?: boolean;
  onSelect?: (selection: StudioSelection) => void;
  /** Called when the iframe agent clears the persistent selection ring
   *  (Escape inside the iframe). Canvas wires this to drop the
   *  right-panel selection chip in sync. */
  onClearSelection?: () => void;
  /** No longer fires on click (auto-exit was removed in the persistent-
   *  selection redesign). Kept on the prop interface for forward
   *  compatibility — future affordances may want to opt back into
   *  programmatic mode flips. */
  onSelectModeChange?: (next: boolean) => void;
  /** Wireframe / full toggle, posted to the iframe via
   *  `grade:set-fidelity`. Defaults to "wireframe" so a fresh iframe
   *  doesn't flash content before the parent's first push. */
  fidelity?: "wireframe" | "full";
  /** Global motion toggle, posted to the iframe via `grade:set-motion`.
   *  `false` stamps `data-motion="off"` inside the sandbox so ThreeScene
   *  surfaces pause + CSS animation stills (lib/motion). `undefined` = don't
   *  drive it, leaving the iframe to honour the viewer's OS reduced-motion
   *  preference on its own. Reduce-only by design. */
  motion?: boolean;
  /** Source-key → URL map for the "Fill images" flow. Posted into the
   *  iframe via `grade:set-media-urls` whenever it changes (or when the
   *  iframe finishes booting), where the sandbox agent stashes it on
   *  `window.__gradeMediaUrls` for MediaSurface to read. Lifted to the
   *  canvas level so every tile iframe in All view inherits the same
   *  map — the focused iframe and the All-mode tiles each have their
   *  own JS context, so without this they'd each need their own Fill
   *  click. */
  mediaUrls?: Record<string, string>;
  /** Per-instance MediaSurface prop overrides, keyed by sourceKey.
   *  Same protocol as `mediaUrls` — Studio's panel writes here when
   *  the user edits a prop on a selected slot; this prop drives the
   *  iframe-side `grade:set-media-overrides` push. Each MediaSurface
   *  inside the iframe applies its slot's overrides on top of the
   *  JSX prop values at render time. */
  mediaOverrides?: Record<string, Record<string, unknown>>;
  /** Open comment threads whose anchored elements should display
   *  positioned pins over the preview. Empty / undefined = no
   *  overlay rendered. Tile/All mode passes nothing. */
  commentThreads?: CommentThreadWithMessages[];
  /** Optional — id of the currently focused thread (Comments tab
   *  has it scrolled into view). The matching pin renders in its
   *  active treatment. */
  activeCommentThreadId?: string | null;
  /** Click handler for any pin. Wires to "scroll the matching
   *  thread into view + open the right panel if collapsed". */
  onCommentPinClick?: (threadId: string) => void;
  /** Resolve a userId → user record for the comment-pin overlay
   *  (powers the author Avatar inside each pin). Forwarded
   *  straight through; the overlay handles the lookup + tone
   *  hashing. */
  getCommentUser?: (id: string) => import("@/lib/studio-users").User | undefined;
  /** When false, comment pins fade out (share view uses this to hide
   *  them during a zoom transition). Defaults to visible. */
  commentsVisible?: boolean;
  /** Render comment pins INSIDE the iframe (runtime DOM only, never in
   *  the source) instead of the parent overlay — they then ride scroll
   *  and the parent's zoom transform natively. The share view uses this;
   *  studio keeps the parent overlay for now. */
  inlineComments?: boolean;
  /** Fires when the user clicks the FailurePanel's "try the slower
   *  renderer" small print inside the iframe
   *  (`grade:fast-try-sandpack`). The canvas flips the focused frame
   *  to the Sandpack parity mount. */
  onTrySandpack?: () => void;
  /** Reports the rendered page's content height (document scrollHeight,
   *  px). Same-origin iframe, so the parent polls contentDocument
   *  directly — the same mechanism CanvasCommentPinsOverlay uses for
   *  pin rects. Drives the responsive content-height artboard (see the
   *  whole-page Fit in FocusedFastMount). Only polled while the prop is
   *  set; only fires on change. */
  onContentHeight?: (h: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FastIframeHost({
  appSource,
  draftSource = null,
  theme,
  mode,
  selectMode = false,
  onSelect,
  onClearSelection,
  onSelectModeChange,
  fidelity,
  motion,
  mediaUrls,
  mediaOverrides,
  commentThreads,
  activeCommentThreadId,
  onCommentPinClick,
  getCommentUser,
  commentsVisible = true,
  inlineComments = false,
  onTrySandpack,
  onContentHeight,
  className,
  style,
}: FastIframeHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Stash the callbacks in refs so the message-listener effect's dep
  // array stays empty — new onSelect identities on every parent render
  // shouldn't tear down and reattach the listener.
  const onSelectRef = useRef(onSelect);
  const onClearSelectionRef = useRef(onClearSelection);
  const onSelectModeChangeRef = useRef(onSelectModeChange);
  const onCommentPinClickRef = useRef(onCommentPinClick);
  const onTrySandpackRef = useRef(onTrySandpack);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onClearSelectionRef.current = onClearSelection;
    onSelectModeChangeRef.current = onSelectModeChange;
    onCommentPinClickRef.current = onCommentPinClick;
    onTrySandpackRef.current = onTrySandpack;
  }, [onSelect, onClearSelection, onSelectModeChange, onCommentPinClick, onTrySandpack]);

  // Listen for sandbox → parent messages. Guard on source so multiple
  // Fast iframes (one focused + N tiles in All mode) don't cross-talk.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as
        | { type?: string; [key: string]: unknown }
        | null;
      if (!data || typeof data !== "object") return;
      switch (data.type) {
        case "grade:fast-ready":
          setReady(true);
          break;
        case "grade:selected": {
          const sel = data.selection as StudioSelection | undefined;
          if (sel) onSelectRef.current?.(sel);
          // **Don't** auto-exit select mode any more. The previous
          // "flip off after capture" behaviour killed the agent +
          // overlay the instant you clicked something — leaving the
          // right-panel chip orphaned and the user with no in-iframe
          // confirmation of what they'd picked. Now select mode stays
          // on across multiple clicks: click another element to switch
          // the selection, hit Escape to clear, or toggle the Select
          // pill off to exit the mode entirely.
          break;
        }
        case "grade:selection-cleared":
          // User pressed Escape inside the iframe. The agent already
          // hid its own ring; bubble the clear up so the canvas can
          // drop the right-panel chip in sync.
          onClearSelectionRef.current?.();
          break;
        case "grade:fast-try-sandpack":
          // FailurePanel small print — the user wants the parity
          // renderer for this screen. The canvas owns the flip.
          onTrySandpackRef.current?.();
          break;
        case "grade:comment-pin-click": {
          // Inline-comments mode — a pin rendered INSIDE the iframe was
          // clicked. The sandbox sends the thread id; bubble it up so
          // the share view can open its comment popover. (The element
          // rect also rides along on the message for future popover
          // anchoring, but the id is all the current handler needs.)
          const threadId =
            typeof data.threadId === "string" ? data.threadId : "";
          if (threadId) onCommentPinClickRef.current?.(threadId);
          break;
        }
        // grade:fast-error messages currently just log — the sandbox
        // already rendered its own failure panel inside the iframe, so
        // there's nothing more for the parent to paint.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Content-height reporting — poll the same-origin contentDocument's
  // scrollHeight (the pins overlay's proven pattern; reflows from
  // streaming source, font/image loads, and accordion-style interactions
  // have no direct observation hook). Callback rides a ref so prop
  // identity churn doesn't restart the interval; the effect is gated on
  // a boolean so polling only runs for consumers that asked.
  const onContentHeightRef = useRef(onContentHeight);
  useEffect(() => {
    onContentHeightRef.current = onContentHeight;
  }, [onContentHeight]);
  const wantContentHeight = Boolean(onContentHeight);
  useEffect(() => {
    if (!wantContentHeight) return;
    let last = 0;
    const read = () => {
      const iframe = iframeRef.current;
      let doc: Document | null = null;
      try {
        doc = iframe?.contentDocument ?? null;
      } catch {
        doc = null;
      }
      const h = doc?.documentElement?.scrollHeight ?? 0;
      if (h > 0 && h !== last) {
        last = h;
        onContentHeightRef.current?.(h);
      }
    };
    read();
    const id = window.setInterval(read, 300);
    return () => window.clearInterval(id);
  }, [wantContentHeight, ready]);

  // Post-to-sandbox helper. No-ops if the iframe isn't loaded yet —
  // the effects below only fire once `ready` flips true, so we're
  // guaranteed to have a contentWindow by then.
  const postToSandbox = (payload: unknown) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(payload, "*");
  };

  // Source updates. Run prepareAppSource here (parent side) so input
  // normalization matches the Sandpack path — duplicate @gradeui/ui
  // imports get merged, legacy local paths rewritten, etc. — before
  // the sandbox compile sees it.
  const preparedSource = useMemo(
    () => (appSource ? prepareAppSource(appSource) : null),
    [appSource]
  );
  useEffect(() => {
    if (!ready || !preparedSource) return;
    postToSandbox({ type: "grade:fast-compile", source: preparedSource });
    // postToSandbox is stable-ish; deliberately excluded from deps so
    // we don't re-send on iframe ref identity thrashes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, preparedSource]);

  // Speculative draft compiles — best-effort renders of the partial
  // source while the model streams. Declared AFTER the appSource effect
  // on purpose: in the commit where the stream settles (draft → null,
  // appSource → final) only the final compile fires, so a stale draft
  // can never paint over the sealed result.
  const preparedDraft = useMemo(() => {
    if (!draftSource) return null;
    try {
      return prepareAppSource(draftSource);
    } catch {
      return null; // mangled draft — skip this tick
    }
  }, [draftSource]);
  useEffect(() => {
    if (!ready || !preparedDraft) return;
    postToSandbox({
      type: "grade:fast-compile",
      source: preparedDraft,
      speculative: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, preparedDraft]);

  // Theme updates. Serialize the var map once and push it over.
  useEffect(() => {
    if (!ready) return;
    const vars = themeToCSSVars(theme, mode);
    postToSandbox({ type: "grade:fast-theme", vars, mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, theme, mode]);

  // Select-mode toggle.
  useEffect(() => {
    if (!ready) return;
    postToSandbox({ type: "grade:select-mode", enabled: selectMode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, selectMode]);

  // Fidelity (wireframe / full). Re-posted on every iframe boot so a
  // fresh tile inherits the canvas's current toggle without the user
  // having to re-flip it.
  useEffect(() => {
    if (!ready || !fidelity) return;
    postToSandbox({ type: "grade:set-fidelity", value: fidelity });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fidelity]);

  // Motion toggle. Posted on change + on boot so a fresh iframe inherits the
  // parent's current setting. Only fires when `motion` is defined — leaving
  // it undefined lets the iframe honour its own OS reduced-motion default
  // without the parent forcing anything.
  useEffect(() => {
    if (!ready || motion === undefined) return;
    postToSandbox({ type: "grade:set-motion", enabled: motion });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, motion]);

  // Media URL map — every time the canvas's resolved-URL state changes
  // (or this iframe finishes booting), push the current map in. The
  // sandbox agent merges it into `window.__gradeMediaUrls` and fires
  // `grade:media-urls-updated` so MediaSurface re-renders with the
  // resolved src. This is what makes the All-view tiles inherit Fill
  // results from a focused-frame click — each tile is its own iframe,
  // so each one has to be told.
  useEffect(() => {
    if (!ready || !mediaUrls) return;
    if (Object.keys(mediaUrls).length === 0) return;
    postToSandbox({ type: "grade:set-media-urls", urls: mediaUrls });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mediaUrls]);

  // Per-instance MediaSurface prop overrides — push on every change
  // (including empty). Empty case matters: when the user clears an
  // override the iframe needs the new state to drop the entry, not
  // keep stale values.
  useEffect(() => {
    if (!ready) return;
    postToSandbox({
      type: "grade:set-media-overrides",
      overrides: mediaOverrides ?? {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mediaOverrides]);

  // Inline comments — when enabled, serialize the open threads (with the
  // author's display name + avatar resolved on the parent side) and post
  // them into the sandbox, which renders pins directly in the live DOM.
  // The pins then ride scroll + the parent's zoom transform natively —
  // no parent overlay chasing rects. CRITICAL: this is runtime-only DOM
  // injected by the sandbox; it is NEVER written into appSource, so it
  // can't leak into stored source or the Code view. An undefined /
  // empty commentThreads posts an empty list, which clears the pins
  // (this is how the share's "hide comments" toggle drops them).
  // Stable signature of the threads we'd post — drives the effect below
  // off a primitive instead of the array's identity (which changes every
  // parent render and would re-post on each one).
  const commentSig = useMemo(
    () =>
      (commentThreads ?? [])
        .map((t) => `${t.thread.id}:${t.thread.anchorId}:${t.thread.createdBy}`)
        .join("|"),
    [commentThreads]
  );
  useEffect(() => {
    if (!ready || !inlineComments) return;
    const payload = (commentThreads ?? []).map((t) => {
      const u = getCommentUser?.(t.thread.createdBy);
      return {
        id: t.thread.id,
        anchorId: t.thread.anchorId,
        anchorKind: t.thread.anchorKind,
        authorName: u?.name,
        avatarUrl: u?.avatarUrl,
      };
    });
    postToSandbox({ type: "grade:set-comments", threads: payload });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, inlineComments, commentSig]);

  return (
    <>
      <iframe
        ref={iframeRef}
        src={SANDBOX_URL}
        title="Grade Studio preview"
        // sandbox attribute left off deliberately — the iframe is same-
        // origin (our own Next route) and we trust what we serve there.
        // Setting sandbox="allow-scripts ..." would block same-origin
        // access to iframe.contentDocument which we don't need here
        // (all interop is via postMessage) but would break debugging.
        className={cn("block w-full h-full bg-background", className)}
        style={{ border: 0, ...style }}
      />
      {/* Comment pins overlay — positioned fixed against viewport
          coords by querying the iframe's contentDocument for each
          thread's anchor element. Same-origin iframe makes the
          query trivial. Empty / undefined commentThreads ⇒ no
          pins rendered, no polling started. */}
      {!inlineComments && commentThreads && commentThreads.length > 0 && onCommentPinClick && (
        <CanvasCommentPinsOverlay
          iframeRef={iframeRef}
          threads={commentThreads}
          activeThreadId={activeCommentThreadId}
          onPinClick={onCommentPinClick}
          getUser={getCommentUser}
          visible={commentsVisible}
        />
      )}
    </>
  );
}

// ─── Focused mount ────────────────────────────────────────────────────

interface FocusedFastMountProps {
  appSource: string | null;
  /** Speculative mid-stream draft — see FastIframeHost.draftSource. */
  draftSource?: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  view: "preview" | "code";
  /** False while the chat hasn't produced a renderable snippet yet. */
  canRender: boolean;
  viewportWidth: ViewportWidth;
  /**
   * Replay counter — forwarded as a `key` to the iframe host so a
   * fresh integer remounts the iframe and replays every inView /
   * mount animation. Owned by studio-canvas (the toolbar control
   * lives there); FocusedFastMount is just a pass-through.
   */
  replayKey?: number;
  selectMode?: boolean;
  onSelect?: (selection: StudioSelection) => void;
  onClearSelection?: () => void;
  onSelectModeChange?: (next: boolean) => void;
  fidelity?: "wireframe" | "full";
  mediaUrls?: Record<string, string>;
  mediaOverrides?: Record<string, Record<string, unknown>>;
  /** Comment pin overlay. Forwarded to FastIframeHost.  */
  commentThreads?: CommentThreadWithMessages[];
  activeCommentThreadId?: string | null;
  onCommentPinClick?: (threadId: string) => void;
  /** Resolve a userId → user record so each pin can render its
   *  author Avatar. Forwarded straight through. */
  getCommentUser?: (id: string) => import("@/lib/studio-users").User | undefined;
  /** Edit-mode write-back for the Code view. Same signature as the
   *  canvas's `onSourceMutation` — debounced edits from the CodeMirror
   *  editor flow here, landing in undo history + persistence like a chat
   *  edit. When omitted, the Code view stays read-only. */
  onSourceEdit?: (next: string, label?: string) => void;
  /** Whether the Code view offers an "Edit" toggle. Defaults true; the
   *  hook for role/tier gating (some users view-only) — pass
   *  `user_can_edit_project` here once that's wired. */
  canEditSource?: boolean;
  /** The scale to apply to the artboard — `effectiveZoom` from
   *  useArtboardZoom, owned by StudioCanvas (the zoom dropdown lives in
   *  the toolbar there). Defaults to 1 (embed-style callers that don't
   *  wire zoom get the old behaviour). */
  zoom?: number;
  /** True while Fit mode drives `zoom` — purely presentational here
   *  (the canvas annotation reads "Fit" instead of a percentage). */
  fitMode?: boolean;
  /** True while a continuous zoom gesture (pinch / ctrl+wheel / slider
   *  drag) is in flight — from useArtboardZoom. Drops the deliberate-
   *  pick transform transition (which otherwise re-eases toward the
   *  transform origin on every tick — the sideways "swoop" on device
   *  artboards) and raises the interaction-blocking overlay so the
   *  live app can't be clicked/scrolled mid-gesture. */
  gesturing?: boolean;
  /** Canvas interaction mode. "interact" (default): the screen is
   *  live; hold Space (or middle-mouse drag) to pan. "design": the
   *  overlay stays up — plain drag pans, pinch zooms, the screen is
   *  a non-interactive artboard. Owned by the canvas toolbar. (Named
   *  interactionMode because studio-canvas already has a `canvasMode`
   *  — the select/comment picker.) */
  interactionMode?: "interact" | "design";
  /** Measurement ref from useArtboardZoom. Attached to the scrollable
   *  canvas area so Fit can compute its scale against the real column
   *  size. Optional for callers without zoom wiring. */
  zoomCanvasRef?: (el: HTMLElement | null) => void;
  /** The RESOLVED artboard from useArtboardZoom (`deviceSize` on the
   *  hook result) — device presets AND the responsive content-height
   *  artboard both arrive through here, so the mount renders whatever
   *  the fit math was computed against. Falls back to the static
   *  preset map when omitted. */
  artboardSize?: { w: number; h: number };
  /** Forwarded to FastIframeHost — see the prop there. The canvas
   *  passes it in responsive mode only. */
  onContentHeight?: (h: number) => void;
  /** Forwarded to FastIframeHost — FailurePanel's "try Sandpack". */
  onTrySandpack?: () => void;
  /** `useArtboardZoom.zoomBy` from the owning canvas. When present,
   *  this mount owns pinch / ctrl+wheel itself (both the parent-side
   *  wheel listener and the sandbox's `grade:zoom-gesture` forwarding)
   *  so it can ANCHOR the zoom at the pointer: the camera is counter-
   *  translated each tick to keep the artboard point under the cursor
   *  fixed — the Figma feel. Callers passing this must NOT also wire
   *  useZoomGestures for the same surface (double-zoom). */
  onZoomBy?: (factor: number) => void;
}

export function FocusedFastMount({
  appSource,
  draftSource = null,
  theme,
  mode,
  view,
  canRender,
  viewportWidth,
  replayKey = 0,
  selectMode = false,
  onSelect,
  onClearSelection,
  onSelectModeChange,
  fidelity,
  mediaUrls,
  mediaOverrides,
  commentThreads,
  activeCommentThreadId,
  onCommentPinClick,
  getCommentUser,
  onSourceEdit,
  canEditSource = true,
  zoom = 1,
  fitMode = false,
  gesturing = false,
  interactionMode = "interact",
  zoomCanvasRef,
  artboardSize,
  onContentHeight,
  onTrySandpack,
  onZoomBy,
}: FocusedFastMountProps) {
  // Resolved artboard — needed by the camera/anchored-zoom hooks below
  // as well as the preview render. Device presets and the responsive
  // content-height artboard both arrive via `artboardSize`; static
  // preset map is the fallback for callers without zoom wiring.
  // Responsive WITHOUT a content artboard = page fits the column →
  // plain fill, no camera.
  const isResponsive = viewportWidth === "responsive";
  const device =
    artboardSize ??
    (isResponsive ? undefined : ARTBOARD_DEVICE_SIZES[viewportWidth]);
  // Memoize the prepared source for the Code view so we don't re-run
  // prepareAppSource on every render purely to display the text.
  const preparedForCodeView = useMemo(
    () => (appSource ? prepareAppSource(appSource) : ""),
    [appSource]
  );

  // Code view sub-mode: read-only payload panel ("view") vs the live
  // CodeMirror editor ("edit"). Editing writes raw appSource back through
  // onSourceEdit. Forced to "view" when the user can't edit.
  const [sourceMode, setSourceMode] = useState<"view" | "edit">("view");
  const effectiveSourceMode =
    sourceMode === "edit" && canEditSource && onSourceEdit ? "edit" : "view";

  // ─── Camera (pan) + gesture overlay state ────────────────────────────
  // (Hooks live above the code-view early return — rules of hooks.)
  //
  // The artboard's position is a CAMERA: `translate(pan) · scale(zoom)`.
  // The first cut panned by writing the scroller's scrollLeft/Top, which
  // was dead on arrival twice over — Fit mode has no scroll range at
  // all, and a centred flex layout puts half the overflow past the
  // unreachable left/top edge. A translate-based camera has neither
  // problem, and it gives the canvas a real (bounded) coordinate
  // system: pan is clamped to the artboard overflow plus a fixed slack,
  // so it stays a finite canvas — you can nudge the artboard around,
  // not lose it in infinite space. Pan resets when Fit re-frames.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef<{
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [panning, setPanning] = useState(false);

  // Space-hold quick-pan (Interact mode only — Design pans on plain
  // drag). Window-level so it works regardless of focus position;
  // guarded against typing surfaces. Released on blur so cmd-tabbing
  // away never wedges the overlay on.
  const [spaceHeld, setSpaceHeld] = useState(false);
  useEffect(() => {
    if (interactionMode !== "interact" || view !== "preview") {
      setSpaceHeld(false);
      return;
    }
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        if (t.isContentEditable) return;
      }
      e.preventDefault(); // stop page-scroll-on-space
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [interactionMode, view]);

  // Pan is available whenever the overlay shows a hand. (overlayOn is
  // derived below the camera session — it also covers gesture flags.)
  const panEnabled = interactionMode === "design" || spaceHeld;

  // Clamp the camera with the Figma rule: the artboard can be pushed
  // almost entirely off-canvas, as long as at least PAN_KEEP_VISIBLE px
  // of it stays on screen on each axis — so you can park it in a
  // corner, but never lose it. (The earlier overflow+slack box was much
  // tighter, which is why pinching near the edges kept hitting the
  // wall.) Measured against the container the camera lives in (the
  // same element the fit math measures).
  const PAN_KEEP_VISIBLE = 48;
  const clampPan = useCallback(
    (p: { x: number; y: number }, zoomOverride?: number) => {
      const el = containerRef.current;
      const z = zoomOverride ?? zoom;
      const scaledW = (artboardSize?.w ?? 0) * z;
      const scaledH = (artboardSize?.h ?? 0) * z;
      const cw = el?.clientWidth ?? 0;
      const ch = el?.clientHeight ?? 0;
      // |pan| ≤ (artboard + canvas)/2 − keep-visible: at the limit the
      // artboard's trailing edge sits keep-visible px inside the
      // opposite canvas edge.
      const maxX = Math.max(0, (scaledW + cw) / 2 - PAN_KEEP_VISIBLE);
      const maxY = Math.max(0, (scaledH + ch) / 2 - PAN_KEEP_VISIBLE);
      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y)),
      };
    },
    [artboardSize?.w, artboardSize?.h, zoom],
  );

  // Fit re-frames the artboard — the camera comes home with it.
  useEffect(() => {
    if (fitMode) setPan({ x: 0, y: 0 });
  }, [fitMode]);
  // Re-clamp when zoom/artboard changes shrink the legal pan range
  // (zooming out with the artboard flung to a corner would otherwise
  // strand it past the new bounds). Returns the SAME reference when
  // already in bounds — without that bail this effect re-rendered the
  // whole canvas a second time on every zoom change (it reads
  // clientWidth too, forcing layout), which was a real chunk of the
  // pinch slowness.
  useEffect(() => {
    setPan((p) => {
      const c = clampPan(p);
      return c.x === p.x && c.y === p.y ? p : c;
    });
  }, [clampPan]);

  // ─── Imperative camera session (the perf-critical path) ─────────────
  //
  // Pinch and drag do NOT go through React per frame. The zoom state
  // lives at the top of StudioCanvas, so a setState per tick re-renders
  // the entire canvas tree (brutal in dev builds) and the wrapper's
  // width/height changes force layout — that's the "very slow pinch".
  //
  // Instead, a gesture opens a SESSION: we snapshot the camera (zoom,
  // pan, wrapper rect), then write `translate(...) scale(k)` straight
  // onto the wrapper element each frame — compositor-only work, no
  // React, no layout. The content rasters at its starting scale and
  // momentarily softens at high k (exactly what Figma does), then the
  // session COMMITS once on settle (pinch: 180ms idle; drag: pointer
  // up): one setPan + one zoomBy, one React render, crisp re-raster.
  //
  // Anchoring (zoom-to-cursor) falls out cleanly: with transform-origin
  // pinned to the wrapper's top-left, the visual origin is
  // O = rect0 + d, and keeping pointer P fixed under a factor f is
  //     d += (O − P)·(f − 1).
  //
  // All functions are latest-render closures stored in refs so the
  // once-attached listeners (wheel, message, timers) never go stale.
  const cameraRef = useRef<HTMLDivElement | null>(null);
  interface CameraSession {
    baseZoom: number;
    basePan: { x: number; y: number };
    /** Wrapper's viewport top-left at session start (pre-gesture). */
    rect0: { x: number; y: number };
    /** Accumulated extra scale on top of baseZoom. */
    k: number;
    /** Accumulated visual translation on top of basePan. */
    d: { x: number; y: number };
    el: HTMLElement;
    idleTimer: number | null;
  }
  const sessionRef = useRef<CameraSession | null>(null);
  const [imperativeGesturing, setImperativeGesturing] = useState(false);

  const applySession = (s: CameraSession) => {
    s.el.style.transition = "none";
    s.el.style.transformOrigin = "0 0";
    s.el.style.transform = `translate(${s.basePan.x + s.d.x}px, ${
      s.basePan.y + s.d.y
    }px) scale(${s.k})`;
  };

  const ensureSessionRef = useRef<() => CameraSession | null>(() => null);
  ensureSessionRef.current = () => {
    if (sessionRef.current) return sessionRef.current;
    const el = cameraRef.current;
    if (!el || !device) return null;
    const rect = el.getBoundingClientRect();
    sessionRef.current = {
      baseZoom: zoom,
      basePan: { ...pan },
      rect0: { x: rect.left, y: rect.top },
      k: 1,
      d: { x: 0, y: 0 },
      el,
      idleTimer: null,
    };
    setImperativeGesturing(true);
    return sessionRef.current;
  };

  // Session-space clamp. The clampPan bounds are defined on the
  // COMMITTED pan space (centred layout at the final zoom), which
  // differs from the session's `d` space by the centering shift
  // w·z0·(k−1)/2 (the layout origin moves as the wrapper resizes on
  // commit). Every in-session mutation clamps through this SAME
  // mapping the commit uses, so the commit's clamp is a guaranteed
  // no-op — the settle frame is pixel-identical to the last gesture
  // frame (this was the "slight adjustment on release" jank: pinch
  // didn't clamp at all, then the commit snapped the camera back into
  // bounds).
  const centeringShift = (s: CameraSession, k: number) => ({
    x: ((device?.w ?? 0) * s.baseZoom * (k - 1)) / 2,
    y: ((device?.h ?? 0) * s.baseZoom * (k - 1)) / 2,
  });
  const clampSessionD = (
    s: CameraSession,
    d: { x: number; y: number },
    k: number,
  ) => {
    const shift = centeringShift(s, k);
    const committed = clampPan(
      { x: s.basePan.x + d.x + shift.x, y: s.basePan.y + d.y + shift.y },
      s.baseZoom * k,
    );
    return {
      x: committed.x - shift.x - s.basePan.x,
      y: committed.y - shift.y - s.basePan.y,
    };
  };

  const commitSessionRef = useRef<() => void>(() => {});
  commitSessionRef.current = () => {
    const s = sessionRef.current;
    if (!s) return;
    sessionRef.current = null;
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    const z2 = s.baseZoom * s.k;
    // Same mapping as clampSessionD — in-session clamping guarantees
    // this clamp changes nothing; it stays only as a safety net. We
    // deliberately do NOT clear the inline styles — React's render
    // overwrites transform/transition in the same commit, so clearing
    // first would flash one unstyled frame.
    const shift = centeringShift(s, s.k);
    const finalPan = clampPan(
      {
        x: s.basePan.x + s.d.x + shift.x,
        y: s.basePan.y + s.d.y + shift.y,
      },
      z2,
    );
    setPan(finalPan);
    if (s.k !== 1 && onZoomBy) onZoomBy(s.k);
    setImperativeGesturing(false);
  };

  /** One pinch step inside the session. factor multiplies the current
   *  visual scale; anchor (when present) stays fixed under the cursor. */
  const pinchSessionRef = useRef<
    (factor: number, anchor: { kind: "client" | "iframe"; x: number; y: number } | null) => void
  >(() => {});
  pinchSessionRef.current = (factor, anchor) => {
    if (!onZoomBy) return;
    const s = ensureSessionRef.current();
    if (!s) {
      // No camera (responsive fill) — plain zoom, still one state
      // update per frame via the rAF queue.
      onZoomBy(factor);
      return;
    }
    const cur = s.baseZoom * s.k;
    const target = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, cur * factor));
    const f = target / cur;
    if (f !== 1 && anchor) {
      const O = { x: s.rect0.x + s.d.x, y: s.rect0.y + s.d.y };
      // Iframe-forwarded anchors are iframe-local CSS px; the iframe's
      // visual scale is the session's CURRENT scale.
      const P =
        anchor.kind === "client"
          ? { x: anchor.x, y: anchor.y }
          : { x: O.x + anchor.x * cur, y: O.y + anchor.y * cur };
      s.d = {
        x: s.d.x + (O.x - P.x) * (f - 1),
        y: s.d.y + (O.y - P.y) * (f - 1),
      };
    }
    s.k *= f;
    // Clamp IN-SESSION through the same mapping the commit uses — the
    // live gesture hits exactly the wall the commit would enforce, so
    // releasing at the bounds never snaps (the "jank near the edges").
    s.d = clampSessionD(s, s.d, s.k);
    applySession(s);
    // Settle heuristic — wheel pinches have no end event.
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    s.idleTimer = window.setTimeout(() => commitSessionRef.current(), 180);
  };

  // Wheel-pan goes through the session too (no React per tick).
  const panSessionByRef = useRef<(dx: number, dy: number) => void>(() => {});
  panSessionByRef.current = (dx, dy) => {
    const s = ensureSessionRef.current();
    if (!s) return;
    s.d = clampSessionD(s, { x: s.d.x + dx, y: s.d.y + dy }, s.k);
    applySession(s);
    if (s.idleTimer !== null) window.clearTimeout(s.idleTimer);
    s.idleTimer = window.setTimeout(() => commitSessionRef.current(), 180);
  };

  // Re-assert the session's inline transform after ANY React render —
  // unrelated state changes (panning cursor, fill chips, streaming)
  // re-apply the style prop and would otherwise snap the wrapper back
  // to the stale React camera mid-gesture.
  useEffect(() => {
    const s = sessionRef.current;
    if (s) applySession(s);
  });
  useEffect(
    () => () => {
      const s = sessionRef.current;
      if (s?.idleTimer != null) window.clearTimeout(s.idleTimer);
      sessionRef.current = null;
    },
    [],
  );

  // Drag-pan — same session, explicit lifecycle (pointer up commits).
  const beginPan = (e: React.PointerEvent<HTMLElement>) => {
    const s = ensureSessionRef.current();
    if (!s) return;
    if (s.idleTimer !== null) {
      window.clearTimeout(s.idleTimer);
      s.idleTimer = null;
    }
    panRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      startX: s.d.x,
      startY: s.d.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanning(true);
  };
  const movePan = (e: React.PointerEvent<HTMLElement>) => {
    const p = panRef.current;
    const s = sessionRef.current;
    if (!p || !s || e.pointerId !== p.id) return;
    s.d = clampSessionD(
      s,
      {
        x: p.startX + (e.clientX - p.x),
        y: p.startY + (e.clientY - p.y),
      },
      s.k,
    );
    applySession(s);
  };
  const endPan = (e: React.PointerEvent<HTMLElement>) => {
    if (panRef.current?.id !== e.pointerId) return;
    panRef.current = null;
    setPanning(false);
    commitSessionRef.current();
  };

  // The overlay shows for hand-pan modes AND while any gesture (React
  // `gesturing` flag or an open imperative session) is in flight, so a
  // pinch never clicks/hovers the live app.
  const overlayOn = panEnabled || gesturing || imperativeGesturing;

  // Gesture coalescing — trackpads emit wheel at 120Hz+, and applying
  // every tick means a forced layout (getBoundingClientRect) plus a
  // whole-canvas React re-render PER EVENT, which is what makes pinch
  // feel treacly. Instead: multiply the factors together, keep the
  // freshest anchor, and apply ONCE per animation frame. Zoom factors
  // compose multiplicatively so this is lossless — the result after a
  // frame's worth of ticks is identical, just computed once.
  const gestureAccRef = useRef<{
    factor: number;
    anchor: { kind: "client" | "iframe"; x: number; y: number } | null;
    raf: number | null;
  }>({ factor: 1, anchor: null, raf: null });
  const queueGesture = useCallback(
    (
      factor: number,
      anchor: { kind: "client" | "iframe"; x: number; y: number } | null,
    ) => {
      const acc = gestureAccRef.current;
      acc.factor *= factor;
      if (anchor) acc.anchor = anchor;
      if (acc.raf !== null) return;
      acc.raf = requestAnimationFrame(() => {
        const f = acc.factor;
        const a = acc.anchor;
        acc.factor = 1;
        acc.anchor = null;
        acc.raf = null;
        if (f !== 1) pinchSessionRef.current(f, a);
      });
    },
    [],
  );
  useEffect(
    () => () => {
      if (gestureAccRef.current.raf !== null)
        cancelAnimationFrame(gestureAccRef.current.raf);
    },
    [],
  );

  // Parent-side pinch / ctrl+wheel — anywhere over the canvas area
  // (padding, dot grid, the artboard frame). Non-passive so
  // preventDefault can stop the browser's own page zoom.
  //
  // MUST be attached to the OUTER wrapper (the overlay's ancestor),
  // not the inner container. The gesture overlay mounts as the inner
  // container's SIBLING the moment a gesture starts — with the
  // listener on the inner container, every wheel event after the
  // first tick hit the overlay, bubbled PAST the container, and died
  // at the page-level pinch guard. Net effect: roughly one zoom tick
  // per settle window — the "very slow zoom" bug. The element arrives
  // via state (not a plain ref) so this effect re-runs when the
  // preview tree actually mounts.
  const [outerEl, setOuterEl] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!onZoomBy || view !== "preview" || !outerEl) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      queueGesture(Math.exp(-e.deltaY * 0.01), {
        kind: "client",
        x: e.clientX,
        y: e.clientY,
      });
    };
    outerEl.addEventListener("wheel", onWheel, { passive: false });
    return () => outerEl.removeEventListener("wheel", onWheel);
  }, [onZoomBy, view, queueGesture, outerEl]);

  // Iframe-side pinch — the sandbox agent forwards ctrl+wheel as
  // `grade:zoom-gesture` with the pointer's iframe-local coords. Only
  // the FOCUSED frame's gestures count (grid tiles run the same
  // agent); source-check against this mount's iframe.
  useEffect(() => {
    if (!onZoomBy || view !== "preview") return;
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        deltaY?: number;
        clientX?: number;
        clientY?: number;
      } | null;
      if (!data || data.type !== "grade:zoom-gesture") return;
      if (typeof data.deltaY !== "number") return;
      const container = document.querySelector<HTMLElement>(
        "[data-grade-focused-frame]",
      );
      const win = container?.querySelector("iframe")?.contentWindow;
      if (!win || e.source !== win) return;
      const anchor =
        typeof data.clientX === "number" && typeof data.clientY === "number"
          ? { kind: "iframe" as const, x: data.clientX, y: data.clientY }
          : null;
      queueGesture(Math.exp(-data.deltaY * 0.01), anchor);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onZoomBy, view, queueGesture]);

  if (view === "code") {
    // GradePayloadPanel wraps the Code view with a JSX|JSON segmented
    // control + a single action button that flips between "Copy JSX"
    // and "Send to Figma" based on the active tab. JSON is the Grade
    // payload — paste into the code-to-figma plugin to build the same
    // composition as linked component instances.
    //
    // The existing CodeView (prism-react-renderer) keeps doing what it
    // did before; we hand it to GradePayloadPanel as its `renderCode`
    // slot so the walker package stays portable (no Prism dep there).
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        {/* Source toolbar — View | Edit. Edit shows only when permitted;
            the Figma intro banner is intentionally gone from source mode. */}
        <div className="flex shrink-0 items-center border-b border-border px-3 py-1.5">
          <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSourceMode("view")}
              className={cn(
                "rounded-sm px-2 py-0.5 transition",
                effectiveSourceMode === "view"
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              View
            </button>
            {canEditSource && onSourceEdit && (
              <button
                type="button"
                onClick={() => setSourceMode("edit")}
                className={cn(
                  "rounded-sm px-2 py-0.5 transition",
                  effectiveSourceMode === "edit"
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {effectiveSourceMode === "edit" ? (
            <SourceEditor
              value={appSource ?? ""}
              mode={mode}
              onSourceEdit={onSourceEdit}
            />
          ) : (
          <GradePayloadPanel
            source={preparedForCodeView}
            // Permissive: don't warn the user about every PascalCase tag
            // the model emits that isn't pre-registered. The Send-to-Figma
            // flow is best-effort; missing-component issues surface in the
            // plugin itself with a clearer "no component named X in this
            // file" diagnostic than the walker can give.
            //
            // excludeProps strips host-app implementation noise before
            // it lands in the Walked JSX or the JSON payload. Two cases:
            //   - data-gds-source-id is the Studio selection agent's
            //     injection (see injectSourceIds in chat-sandpack.ts).
            //     Pure runtime artifact; meaningless to Figma.
            //   - className is Tailwind utility soup. Figma variants
            //     drive their own visual state — className is implementation
            //     noise on the Figma side too.
            // If a Studio-side data-* attr ever needs to round-trip, narrow
            // this rather than dropping it from here.
            walkerOptions={{
              permissive: true,
              excludeProps: ["data-gds-source-id", "className"],
              // Collapses every lucide-react icon into a single Figma
              // `Icon` component with a kebab-case `name` variant. See
              // lib/studio-walker-register.ts for the rule source +
              // why this isn't done via excludeTypes.
              rewriteTypes: STUDIO_REWRITE_RULES,
              // Unwrap React-only typography wrappers (CardTitle,
              // CardDescription). Children land inline in the parent.
              unwrapTypes: STUDIO_UNWRAP_TYPES,
            }}
            renderCode={({ code, language }) => (
              <CodeView code={code} language={language === "json" ? "json" : "tsx"} />
            )}
            onToast={(message) => toast(message)}
            onSendToFigma={() => {
              // Hook point for telemetry — see PRD §Metrics. Left bare
              // for v1: the click-count + retention signal lives at this
              // call site whenever the docs site grows a real events pipe.
            }}
          />
          )}
        </div>
      </div>
    );
  }

  // Preview view — the same artboard treatment as the share view
  // (shared-screen.tsx): "responsive" fills the column and zoom scales
  // it from the centre; device presets frame a real w×h artboard on a
  // dot-grid canvas, scaled by `zoom` (Fit by default, so nothing ever
  // overflows a laptop / iPad column). Fit math lives in
  // useArtboardZoom up in StudioCanvas; this component just applies
  // the scale. (`device` itself is computed up in the hooks section —
  // the anchored-zoom handler needs it.)

  // Overshoot-and-settle transition on DELIBERATE zoom picks only
  // (same curve as the share view; snapping back to 100% gets a
  // subtler one). In Fit mode the scale is recomputed continuously
  // while the browser resizes — animating those recalcs makes the
  // artboard spring-chase the window ("bouncing"), so Fit tracks
  // instantly instead. Same rule during a continuous GESTURE
  // (pinch / slider drag): each tick is a new transform target, and
  // easing toward a moving target from a corner/edge transform origin
  // reads as a sideways "swoop" — gestures track raw, the overshoot
  // is reserved for single deliberate picks.
  const zoomTransition =
    fitMode || gesturing
      ? "box-shadow 220ms ease"
      : `transform 340ms ${
          zoom === 1
            ? "cubic-bezier(0.33, 1.08, 0.68, 1)"
            : "cubic-bezier(0.33, 1.25, 0.68, 1)"
        }, box-shadow 220ms ease`;

  const host = canRender ? (
    <FastIframeHost
      key={replayKey}
      appSource={appSource}
      draftSource={draftSource}
      theme={theme}
      mode={mode}
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
      onContentHeight={onContentHeight}
      onTrySandpack={onTrySandpack}
      className={cn(
        "block",
        // Edge treatment when framed as a device, or sitting "in
        // space" (zoomed out). Radius + shadow come from the
        // --gds-artboard-* tokens (globals.css) — the standard
        // artboard look, tweakable in one place.
        device || zoom < 1 ? "ring-1 ring-border/40" : undefined,
        !device && "h-full w-full",
      )}
      style={
        device
          ? {
              width: device.w,
              height: device.h,
              // Origin top-left so the sized wrapper below exactly
              // bounds the visual — no phantom scroll area from
              // unscaled layout space.
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              transition: zoomTransition,
              borderRadius: "var(--gds-artboard-radius)",
              boxShadow: "var(--gds-artboard-shadow)",
            }
          : {
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: zoomTransition,
              borderRadius: zoom < 1 ? "var(--gds-artboard-radius)" : undefined,
              boxShadow: zoom < 1 ? "var(--gds-artboard-shadow)" : undefined,
            }
      }
    />
  ) : null;

  return (
    <div
      // Measured by useArtboardZoom (Fit needs the live column size).
      // MUST be the stable outer wrapper, NOT the overflow:auto
      // scroller below — measuring the scroller couples fit to
      // scrollbar appearance and oscillates (see the matching note in
      // use-artboard-zoom.ts). Also the pinch listener's home (via
      // setOuterEl) — it must sit ABOVE the gesture overlay in the
      // tree; see the wheel-listener effect.
      ref={(el) => {
        setOuterEl(el);
        zoomCanvasRef?.(el);
      }}
      className="relative h-full w-full overflow-hidden"
    >
    <div
      ref={containerRef}
      data-lenis-prevent
      className="h-full w-full"
      onWheel={(e) => {
        // Wheel = camera pan whenever an artboard is framed. ctrl/meta
        // wheel is the pinch path (handled by the session listeners);
        // non-framed responsive fill has no camera — the app inside the
        // iframe owns scrolling there. Goes through the imperative
        // session: DOM-direct, no React per tick.
        if (!device) return;
        if (e.ctrlKey || e.metaKey) return;
        panSessionByRef.current(-e.deltaX, -e.deltaY);
      }}
      style={{
        // The artboard is positioned by the translate camera, not by
        // scrolling — overflow stays hidden whenever a device artboard
        // is framed (no scrollbars, no unreachable centred overflow;
        // the old scroll-based pan couldn't reach the left/top half).
        // Non-framed responsive fill keeps the legacy behaviour.
        overflow: device || fitMode ? "hidden" : "auto",
        scrollbarGutter: device || fitMode ? undefined : "stable both-edges",
        overscrollBehavior: "contain",
        // Canvas treatment whenever an artboard is framed — device
        // preset OR the responsive content-height artboard.
        backgroundColor: device ? "var(--gds-artboard-canvas-bg)" : undefined,
        backgroundImage:
          !device && zoom === 1
            ? undefined
            : "radial-gradient(circle, var(--gds-artboard-canvas-dot) 1px, transparent 1.6px)",
        backgroundSize: "16px 16px",
      }}
    >
      {/* Annotation — appears on zoom-out, labelling the scale the
          artboard is sitting at (share-view parity). */}
      {zoom < 1 && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-2.5 py-0.5 text-[11px] tabular-nums text-muted-foreground shadow-sm backdrop-blur-md">
            {fitMode ? "Fit" : `${Math.round(zoom * 100)}%`}
          </span>
        </div>
      )}

      {device ? (
        // Centred on BOTH axes — the camera's home (pan 0,0) is the
        // true centre of the canvas. The old top-aligned layout existed
        // for native scrolling, which the translate camera replaced;
        // h-full (not min-h-full) keeps the flex box pinned to the
        // canvas so an oversized artboard overflows symmetrically —
        // the same maths as justify-center on x, which is what lets
        // centeringShift treat both axes uniformly.
        <div
          className="flex h-full w-full items-center justify-center p-8"
          // Middle-mouse drag pans even in Interact mode without the
          // overlay — it only works while the pointer is over canvas
          // chrome (the iframe swallows it elsewhere), but it's free.
          onPointerDown={(e) => {
            if (e.button !== 1) return;
            e.preventDefault();
            beginPan(e);
          }}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {/* Sized to the SCALED artboard. transform doesn't affect
              layout, so without this the layout box would stay at the
              unscaled w×h and leave phantom scroll space below a
              fitted artboard. */}
          <div
            ref={cameraRef}
            className="relative shrink-0"
            style={{
              width: device.w * zoom,
              height: device.h * zoom,
              // The CAMERA — drag/wheel pan moves this translate;
              // (0,0) is the flex-centred home position, bounds come
              // from clampPan. Lives on the sized wrapper so the
              // iframe's own scale transform stays untouched.
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              // Match the transform's animation exactly — a wrapper
              // easing differently from the iframe's scale reads as
              // wobble. None in Fit mode (instant tracking), during a
              // zoom gesture, or while panning (1:1 drag tracking);
              // the same duration/curve as zoomTransition otherwise.
              transition:
                fitMode || gesturing || panning
                  ? undefined
                  : "width 340ms ease, height 340ms ease, transform 340ms ease",
            }}
          >
            {host}
            {/* Pixel grid removed (2026-06-04) while pinch perf is
                being tuned — it was a per-frame repaint suspect and
                wasn't visible enough to earn its keep. Reintroduce as
                a session-aware overlay (sized once per commit, not per
                gesture frame) if pixel inspection comes back. */}
          </div>
        </div>
      ) : (
        <div className="relative flex h-full w-full">{host}</div>
      )}
    </div>

    {/* Gesture / pan overlay — sits over the scroller (and therefore
        the live iframe). Three reasons to be up:
          1. Design mode      → hand cursor, plain drag pans.
          2. Space held       → same, temporarily (Interact quick-pan).
          3. Zoom gesture     → transparent pointer shield only, so a
             pinch never clicks/hovers/scrolls the app mid-zoom. It
             drops ~180ms after the last tick and the screen is live
             again.
        While up, ctrl/meta+wheel bubbles to the OUTER wrapper where
        the session's pinch listener lives (the overlay is its
        descendant, so no events are lost — see the wheel-listener
        effect), and plain wheel feeds the camera pan. */}
    {view === "preview" && overlayOn && (
      <div
        data-gds-part="canvas-gesture-overlay"
        className="absolute inset-0 z-30"
        style={{
          cursor: panEnabled ? (panning ? "grabbing" : "grab") : undefined,
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          if (!panEnabled) return;
          if (e.button !== 0 && e.button !== 1) return;
          e.preventDefault();
          beginPan(e);
        }}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) return; // pinch — handled upstream
          if (!device) return; // no camera without a framed artboard
          panSessionByRef.current(-e.deltaX, -e.deltaY);
        }}
      />
    )}
    </div>
  );
}

// ─── Tile mount ───────────────────────────────────────────────────────

interface TileFastMountProps {
  appSource: string | null;
  theme: GeneratedTheme;
  mode: "light" | "dark";
  fidelity?: "wireframe" | "full";
  mediaUrls?: Record<string, string>;
  mediaOverrides?: Record<string, Record<string, unknown>>;
}

/**
 * Fast-mode counterpart of TileSandpackMount. Caller wraps this in a
 * pointer-events-none scaled div so the iframe renders at virtual
 * viewport size and CSS-scales down into the tile. Select mode is
 * not forwarded — tiles are read-only previews in All mode.
 *
 * `fidelity` + `mediaUrls` ARE forwarded so the All-view tiles look
 * identical to the focused frame — a Fill click on the focused frame
 * (which lifts mediaUrls into canvas state) flows down to every tile,
 * and the wireframe toggle applies to all tiles at once.
 */
export function TileFastMount({
  appSource,
  theme,
  mode,
  fidelity,
  mediaUrls,
  mediaOverrides,
}: TileFastMountProps) {
  if (!appSource) return null;
  return (
    <FastIframeHost
      appSource={appSource}
      theme={theme}
      mode={mode}
      fidelity={fidelity}
      mediaUrls={mediaUrls}
      mediaOverrides={mediaOverrides}
      // A grid tile is a poster, not a player. motion=off stills every
      // animation to its settled frame (scripted demos → final state,
      // ScreenAnimator → starter shot, ThreeScene paused) — so a wall of
      // tiles doesn't run a wall of loops. Animation resumes when you open
      // the screen (the focused frame mounts without this).
      motion={false}
    />
  );
}
