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
import { useEffect, useMemo, useRef, useState } from "react";
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

// URL of the sandbox Next route. Route is defined at
// apps/docs/app/fast-sandbox/page.tsx.
const SANDBOX_URL = "/fast-sandbox";

// ─── FastIframeHost ───────────────────────────────────────────────────
//
// Core building block — a configured iframe + message bus. Single
// instance for FocusedFastMount, one per tile for TileFastMount.

interface FastIframeHostProps {
  appSource: string | null;
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
  className?: string;
  style?: React.CSSProperties;
}

export function FastIframeHost({
  appSource,
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
  useEffect(() => {
    onSelectRef.current = onSelect;
    onClearSelectionRef.current = onClearSelection;
    onSelectModeChangeRef.current = onSelectModeChange;
    onCommentPinClickRef.current = onCommentPinClick;
  }, [onSelect, onClearSelection, onSelectModeChange, onCommentPinClick]);

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
}

// Pixel widths for the viewport artboard. Duplicated from sandpack-frame
// — small enough that duplication beats threading a shared map.
const FAST_VIEWPORT_WIDTHS: Record<
  Exclude<ViewportWidth, "responsive">,
  number
> = {
  mobile: 390,
  tablet: 768,
  desktop: 1024,
};

export function FocusedFastMount({
  appSource,
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
}: FocusedFastMountProps) {
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

  // Preview view — scope by viewport-width artboard to match Sandpack's
  // behaviour: "responsive" fills the column; presets float a width-
  // constrained frame on a dot-grid backdrop so the preview reads like
  // a device sitting on a design surface.
  const isResponsive = viewportWidth === "responsive";
  const maxWidthPx = isResponsive
    ? undefined
    : FAST_VIEWPORT_WIDTHS[viewportWidth];

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        justifyContent: "center",
        alignItems: "stretch",
        backgroundColor: isResponsive ? undefined : "var(--muted)",
        backgroundImage: isResponsive
          ? undefined
          : "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: isResponsive ? undefined : "16px 16px",
        color: isResponsive
          ? undefined
          : "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
        padding: isResponsive ? 0 : "1rem",
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          border: isResponsive ? 0 : "1px solid var(--border)",
          borderRadius: isResponsive ? 0 : "0.5rem",
          overflow: isResponsive ? undefined : "hidden",
          boxShadow: isResponsive
            ? undefined
            : "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
          background: "var(--background)",
          maxWidth: maxWidthPx,
        }}
      >
        {canRender ? (
          <FastIframeHost
            key={replayKey}
            appSource={appSource}
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
          />
        ) : null}
      </div>
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
    />
  );
}
