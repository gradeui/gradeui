"use client";

/**
 * ExternalDsMount — focused-frame mount for EXTERNAL design systems.
 *
 * Hosts the /external-sandbox iframe (esm.sh-fed fast renderer — see the
 * page header for the architecture) and mirrors the fast mount's code
 * view (View = read-only CodeView, Edit = SourceEditor → onSourceEdit).
 *
 * Protocol: waits for `ext:ready`, then pushes `ext:source` on every
 * appSource / mode change. Compile and render failures surface in an
 * error strip rather than a dead iframe.
 */

import * as React from "react";
import { CodeView } from "@/components/studio/code-view";
import { SourceEditor } from "@/components/studio/source-editor";
import { injectSourceIds } from "@/lib/chat-sandpack";
import { cn } from "@/lib/utils";

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
}: ExternalDsMountProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const readyRef = React.useRef(false);
  // Ref mirror so the ext:ready handler can replay the CURRENT select
  // state without stale-closure risk — if select mode was enabled before
  // the iframe finished booting, the change-driven effect below fired
  // into a void and the iframe would never install its hover overlay.
  const selectModeRef = React.useRef(selectMode);
  selectModeRef.current = selectMode;
  const [error, setError] = React.useState<string | null>(null);
  const [sourceMode, setSourceMode] = React.useState<"view" | "edit">("view");
  const effectiveSourceMode =
    sourceMode === "edit" && onSourceEdit ? "edit" : "view";

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
        setError(null);
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
        setError(null);
      } else if (d?.type === "ext:error") {
        setError(d.message ?? "render failed");
      } else if (d?.type === "ext:select") {
        onSelect?.((e.data as { selection?: unknown }).selection);
      } else if (d?.type === "ext:selection-cleared") {
        onClearSelection?.();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push, onSelect, onClearSelection]);

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
              <iframe
                ref={iframeRef}
                src="/external-sandbox"
                title="External design system preview"
                className="block h-full w-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      </div>
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
