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
import { cn } from "@/lib/utils";

interface ExternalDsMountProps {
  appSource: string | null;
  mode: "light" | "dark";
  view: "preview" | "code";
  canRender: boolean;
  onSourceEdit?: (next: string, label?: string) => void;
  /** Select-tool state + callback — ScreenSelection-shaped payloads. */
  selectMode?: boolean;
  onSelect?: (sel: unknown) => void;
}

export function ExternalDsMount({
  appSource,
  mode,
  view,
  canRender,
  onSourceEdit,
  selectMode = false,
  onSelect,
}: ExternalDsMountProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const readyRef = React.useRef(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sourceMode, setSourceMode] = React.useState<"view" | "edit">("view");
  const effectiveSourceMode =
    sourceMode === "edit" && onSourceEdit ? "edit" : "view";

  const push = React.useCallback(() => {
    if (!readyRef.current || !appSource) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ext:source", source: appSource, mode },
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
      } else if (d?.type === "ext:rendered") {
        setError(null);
      } else if (d?.type === "ext:error") {
        setError(d.message ?? "render failed");
      } else if (d?.type === "ext:select") {
        onSelect?.((e.data as { selection?: unknown }).selection);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push, onSelect]);

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

  return (
    <div className="relative h-full w-full">
      {/* Preview iframe stays mounted across view flips so the esm.sh
          module cache and React root survive. */}
      <iframe
        ref={iframeRef}
        src="/external-sandbox"
        title="External design system preview"
        className={cn(
          "h-full w-full border-0 bg-white",
          view === "preview" && canRender ? "block" : "hidden",
        )}
      />
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
