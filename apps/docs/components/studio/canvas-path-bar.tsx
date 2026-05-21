"use client";

/**
 * CanvasPathBar — horizontal ancestor breadcrumb between the toolbar
 * and the canvas. Read-only path display + one navigation primitive:
 * clicking any segment selects that ancestor in the canvas (steps
 * the selection up the tree).
 *
 * The dropdown-column "where can I go from here?" paradigm was tried
 * and pulled — it didn't fit the mental model of a path bar (too
 * much, too deep, conflated nav with browsing). What the bar should
 * do is *one* thing: show where you are, let you go back up. Finding
 * sibling / child nodes is a separate problem we'll solve with a
 * different surface if it turns out to be needed.
 *
 * Data flow:
 *   - Selection chain comes from `selection.chain` (the agent captures
 *     it at click time and on programmatic re-selects).
 *   - Clicking a segment posts `grade:select-by-source-id` to the
 *     iframe; the agent runs its resolve heuristics and emits a fresh
 *     selection back through the usual reportSelected pipe.
 */

import * as React from "react";
import { useCallback } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@gradeui/ui";
import { cn } from "@/lib/utils";
import type {
  SelectionChainSegment,
  StudioSelection,
} from "@/lib/chat-sandpack";

interface CanvasPathBarProps {
  selection: StudioSelection | null;
  className?: string;
}

export function CanvasPathBar({ selection, className }: CanvasPathBarProps) {
  // Find the focused iframe — same `data-grade-focused-frame`
  // anchor the canvas uses for its own postToFocusedIframe helper.
  // Doesn't need to be exposed to callers; just here so the bar
  // can post without prop-drilling.
  const postToFrame = useCallback((payload: Record<string, unknown>) => {
    const container = document.querySelector<HTMLElement>(
      "[data-grade-focused-frame]",
    );
    const iframe = container?.querySelector("iframe");
    const win = iframe?.contentWindow;
    if (!win) return false;
    try {
      win.postMessage(payload, "*");
      return true;
    } catch {
      return false;
    }
  }, []);

  // Tell the iframe to select a node by its source id. The agent in
  // the iframe runs its standard resolve heuristics (finds the DOM
  // node carrying `data-gds-source-id="<id>"`, applies the same
  // never-direct-select / text-host rules) and emits a selection
  // back, which causes our `selection` prop to update.
  const selectSourceId = useCallback(
    (sourceId: string) => {
      postToFrame({ type: "grade:select-by-source-id", id: sourceId });
    },
    [postToFrame],
  );

  // No selection → no path to show. The chrome-height-stays-stable
  // argument doesn't win here: an empty bar with placeholder copy
  // is more visual noise than help. The user clicks in the canvas
  // to start; the bar reappears once a selection exists.
  if (!selection?.chain || selection.chain.length === 0) return null;

  const segments: SelectionChainSegment[] = selection.chain;

  return (
    <div
      data-gds-part="canvas-path-bar"
      className={cn(
        "flex items-center px-3 h-9 border-b border-border bg-card/40",
        "shrink-0 overflow-x-auto",
        className,
      )}
    >
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const label = labelForSegment(seg);
            return (
              <React.Fragment key={`${seg.sourceId}::${i}`}>
                <BreadcrumbItem>
                  {isLast ? (
                    // Current selection — non-interactive Page node.
                    // BreadcrumbPage already renders with aria-current
                    // and a heavier foreground colour so the user can
                    // see where they are at a glance.
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  ) : (
                    // Ancestor — clickable button (BreadcrumbLink with
                    // no `href` renders a button under the hood). Click
                    // posts `grade:select-by-source-id` so the iframe
                    // re-runs its resolve heuristic and emits a fresh
                    // selection chain ending at this ancestor.
                    <BreadcrumbLink
                      onClick={() => selectSourceId(seg.sourceId)}
                      title={`Select ${label}`}
                    >
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

/**
 * Label for a chain segment. User-supplied `data-gds-name` wins (so
 * a rename in the inspector shows up here immediately), then DS
 * componentName, then the raw HTML tag. Source id is intentionally
 * NOT included — the bar should read like a path, not a debug trace.
 */
function labelForSegment(seg: SelectionChainSegment): string {
  if (seg.name) return seg.name;
  if (seg.componentName) return seg.componentName;
  return seg.tag || "node";
}
