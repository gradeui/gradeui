"use client";

/**
 * External-DS renderer hosts — the /external-sandbox counterpart of
 * fast-frame.tsx, split the same way:
 *
 *   - `ExternalIframeHost` — the KERNEL. Just the iframe + the ext:*
 *     postMessage protocol (source push with source-id injection,
 *     select-mode arming/replay, selection + zoom-gesture + content-
 *     height routing). No chrome, no layout opinion — the share view
 *     and the embed mount this directly, exactly like FastIframeHost.
 *   - `ExternalDsMount` — the FOCUSED-FRAME mount. Wraps the host in
 *     the artboard camera (device presets × zoom), the code view
 *     (View/Edit), the error strip, and the comment-pins overlay.
 *
 * Protocol: waits for `ext:ready`, then pushes `ext:source` on every
 * appSource / mode change. Compile and render failures surface via
 * `onError` (the mount renders them as a strip) rather than a dead
 * iframe.
 */

import * as React from "react";
import { CanvasCommentPinsOverlay } from "@/components/studio/canvas-comment-pins-overlay";
import { CodeView } from "@/components/studio/code-view";
import { SourceEditor } from "@/components/studio/source-editor";
import { injectSourceIds } from "@/lib/chat-sandpack";
import { useActiveRegistry } from "@/lib/use-active-registry";
import type { CommentThreadWithMessages } from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";
import { cn } from "@/lib/utils";

// ─── Kernel: the iframe + protocol ─────────────────────────────────────

export interface ExternalIframeHostProps {
  appSource: string | null;
  mode: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
  /** Select-tool state — arms the in-iframe studio selection agent. */
  selectMode?: boolean;
  /** SelectionPayload from the shared selection agent. */
  onSelect?: (sel: unknown) => void;
  /** Escape inside the iframe (mirrors grade:selection-cleared). */
  onClearSelection?: () => void;
  /** Pinch / ctrl+wheel over the screen (ext:zoom-gesture). */
  onZoomBy?: (factor: number) => void;
  /** Compile/render failure message; null = cleared (fresh paint). */
  onError?: (message: string | null) => void;
  /** First successful paint (ext:rendered) — small preview surfaces use
   *  it to drop their boot shimmer. */
  onRendered?: () => void;
  /** Rendered content height (ext:content-height) — feeds the share
   *  view's responsive content-height artboard, like the fast host's
   *  onContentHeight. */
  onContentHeight?: (height: number) => void;
  /** Exposed iframe ref so wrapping chrome (the comment-pins overlay)
   *  can reach contentDocument. */
  iframeRef?: React.MutableRefObject<HTMLIFrameElement | null>;
  /** Explicit registry id for surfaces that resolve it themselves (the
   *  share view resolves the PROJECT's registry server-side). Absent =
   *  the active registry (per-project override in Studio). */
  registryId?: string;
}

export function ExternalIframeHost({
  appSource,
  mode,
  className,
  style,
  selectMode = false,
  onSelect,
  onClearSelection,
  onZoomBy,
  onError,
  onRendered,
  onContentHeight,
  iframeRef: externalIframeRef,
  registryId: registryIdProp,
}: ExternalIframeHostProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const readyRef = React.useRef(false);
  // Ref mirror so the ext:ready handler can replay the CURRENT select
  // state without stale-closure risk — if select mode was enabled before
  // the iframe finished booting, the change-driven effect below fired
  // into a void and the iframe would never install its hover overlay.
  const selectModeRef = React.useRef(selectMode);
  selectModeRef.current = selectMode;

  const setIframe = React.useCallback(
    (el: HTMLIFrameElement | null) => {
      iframeRef.current = el;
      if (externalIframeRef) externalIframeRef.current = el;
    },
    [externalIframeRef],
  );

  const push = React.useCallback(() => {
    if (!readyRef.current || !appSource) return;
    // Source-id injection at the push boundary — the external mirror of
    // prepareAppSource's finalise step. `injectSourceIds` is
    // deterministic + idempotent, and the source mutators re-run it
    // over the durable appSource, so the ids the selection agent reads
    // off the DOM (BL components spread ...props to their roots, the
    // same path that lands dataHook as data-hook) line up with the ids
    // the mutator finds in source. The durable appSource stays clean —
    // ids exist only in the renderer input.
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ext:source", source: injectSourceIds(appSource), mode },
      window.location.origin,
    );
  }, [appSource, mode]);

  React.useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data as { type?: string; message?: string } | null;
      if (d?.type === "ext:ready") {
        readyRef.current = true;
        onError?.(null);
        push();
        // Replay select-mode state — the iframe may have (re)booted
        // after the parent last broadcast it.
        if (selectModeRef.current) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "ext:select-mode", on: true },
            window.location.origin,
          );
        }
      } else if (d?.type === "ext:rendered") {
        onError?.(null);
        onRendered?.();
      } else if (d?.type === "ext:error") {
        onError?.(d.message ?? "render failed");
      } else if (d?.type === "ext:select") {
        onSelect?.((e.data as { selection?: unknown }).selection);
      } else if (d?.type === "ext:selection-cleared") {
        onClearSelection?.();
      } else if (d?.type === "ext:zoom-gesture") {
        const factor = (e.data as { factor?: number }).factor;
        if (typeof factor === "number") onZoomBy?.(factor);
      } else if (d?.type === "ext:content-height") {
        const height = (e.data as { height?: number }).height;
        if (typeof height === "number" && height > 0) onContentHeight?.(height);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push, onSelect, onClearSelection, onZoomBy, onError, onRendered, onContentHeight]);

  // Mirror select-mode into the iframe whenever it flips.
  React.useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ext:select-mode", on: selectMode },
      window.location.origin,
    );
  }, [selectMode]);

  React.useEffect(() => {
    push();
  }, [push]);

  // Per-project registries: the sandbox is a separate module instance
  // and can't see the parent's override, so the id rides the iframe
  // URL. A registry change remounts the iframe (new src) — correct,
  // the DS bundle itself must change. Explicit prop wins (share view
  // resolves the project registry server-side). Hook called
  // unconditionally — rules of hooks.
  const activeRegistryId = useActiveRegistry().id;
  const registryId = registryIdProp ?? activeRegistryId;
  return (
    <iframe
      ref={setIframe}
      src={`/external-sandbox?registry=${encodeURIComponent(registryId)}`}
      title="External design system preview"
      className={cn("block h-full w-full border-0 bg-white", className)}
      style={{ border: 0, colorScheme: mode, ...style }}
    />
  );
}

// ─── Focused-frame mount ───────────────────────────────────────────────

interface ExternalDsMountProps {
  appSource: string | null;
  mode: "light" | "dark";
  view: "preview" | "code";
  canRender: boolean;
  onSourceEdit?: (next: string, label?: string) => void;
  /** Select-tool state + callback — SelectionPayload from the shared
   *  studio selection agent (same shape Fast Frame reports). */
  selectMode?: boolean;
  onSelect?: (sel: unknown) => void;
  /** User hit Escape inside the iframe — drop the right-panel chip in
   *  lock-step with the ring vanishing (mirrors grade:selection-cleared). */
  onClearSelection?: () => void;
  /** Fixed artboard from the viewport preset (resolveArtboardSize in
   *  studio-canvas — mobile 390×844, tablet 768×1024, desktop 1440×900).
   *  Undefined = responsive: the iframe plain-fills the column. */
  artboardSize?: { w: number; h: number };
  /** Effective scale from useArtboardZoom (Fit included). Applied as a
   *  CSS transform on the artboard, same as the fast mount. */
  zoom?: number;
  /** useArtboardZoom.canvasRef — attach to the STABLE (non-scrolling)
   *  preview wrapper so the Fit math can measure the canvas. */
  zoomCanvasRef?: (el: HTMLElement | null) => void;
  /** useArtboardZoom.zoomBy — pinch / ctrl+wheel inside the iframe is
   *  forwarded out as ext:zoom-gesture and fed here. */
  onZoomBy?: (factor: number) => void;
  /** Comment pins — same host-side overlay the fast mount uses (the
   *  /external-sandbox iframe is same-origin, so contentDocument
   *  anchor lookups work identically). Threads anchor by
   *  data-gds-source-id, which the push boundary injects. */
  commentThreads?: CommentThreadWithMessages[];
  activeCommentThreadId?: string | null;
  onCommentPinClick?: (threadId: string) => void;
  getCommentUser?: (id: string) => User | undefined;
}

export function ExternalDsMount({
  appSource,
  mode,
  view,
  canRender,
  onSourceEdit,
  selectMode = false,
  onSelect,
  onClearSelection,
  artboardSize,
  zoom = 1,
  zoomCanvasRef,
  onZoomBy,
  commentThreads,
  activeCommentThreadId,
  onCommentPinClick,
  getCommentUser,
}: ExternalDsMountProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sourceMode, setSourceMode] = React.useState<"view" | "edit">("view");
  const effectiveSourceMode =
    sourceMode === "edit" && onSourceEdit ? "edit" : "view";

  const framed = Boolean(artboardSize);
  return (
    <div className="relative h-full w-full">
      {/* Preview stays MOUNTED across view flips and artboard↔fill
          flips (sizing is style-driven, never structural) so the
          esm.sh module cache and React root survive. Structure mirrors
          the fast mount's camera-less core: stable wrapper (Fit
          measurement) → scroller → sizer (reserves the SCALED
          footprint so overflow scrolls instead of clipping past an
          unreachable edge) → artboard (device size × zoom transform). */}
      <div
        ref={zoomCanvasRef}
        className={cn(
          "absolute inset-0",
          view === "preview" && canRender ? "block" : "hidden",
        )}
      >
        <div className="flex h-full w-full overflow-auto">
          <div
            className="m-auto"
            style={
              framed
                ? {
                    width: artboardSize!.w * zoom,
                    height: artboardSize!.h * zoom,
                    flex: "none",
                  }
                : { width: "100%", height: "100%" }
            }
          >
            <div
              className={cn(
                "h-full w-full",
                framed &&
                  "overflow-hidden rounded-lg shadow-lg ring-1 ring-border",
              )}
              style={
                framed
                  ? {
                      width: artboardSize!.w,
                      height: artboardSize!.h,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }
                  : undefined
              }
            >
              <ExternalIframeHost
                appSource={appSource}
                mode={mode}
                selectMode={selectMode}
                onSelect={onSelect}
                onClearSelection={onClearSelection}
                onZoomBy={onZoomBy}
                onError={setError}
                iframeRef={iframeRef}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Comment pins — host overlay, live anchor lookups against the
          same-origin iframe's contentDocument (see the fast mount). */}
      {view === "preview" &&
        canRender &&
        commentThreads &&
        commentThreads.length > 0 &&
        onCommentPinClick && (
          <CanvasCommentPinsOverlay
            iframeRef={iframeRef}
            threads={commentThreads}
            activeThreadId={activeCommentThreadId}
            onPinClick={onCommentPinClick}
            getUser={getCommentUser}
          />
        )}
      {error && view === "preview" && (
        <div className="absolute inset-x-3 top-3 z-20 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
      {view === "code" && canRender && (
        <div className="flex h-full w-full flex-col">
          {onSourceEdit && (
            <div className="flex shrink-0 items-center border-b border-border px-3 py-1.5">
              <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSourceMode("view")}
                  className={cn(
                    "rounded-sm px-2 py-0.5 transition",
                    effectiveSourceMode === "view"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode("edit")}
                  className={cn(
                    "rounded-sm px-2 py-0.5 transition",
                    effectiveSourceMode === "edit"
                      ? "bg-foreground/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Edit
                </button>
              </div>
            </div>
          )}
          <div className="min-h-0 flex-1">
            {effectiveSourceMode === "edit" && onSourceEdit ? (
              <SourceEditor value={appSource ?? ""} mode={mode} onSourceEdit={onSourceEdit} />
            ) : (
              <CodeView code={appSource ?? ""} language="tsx" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
