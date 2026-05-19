"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

/**
 * Resizable — drag-to-adjust panel groups.
 *
 * Thin wrapper over `react-resizable-panels` so consumers can compose
 * persistently-sized splits (e.g. nav + main, list + detail, three-pane
 * with adjustable middle column) without owning the layout primitives.
 *
 * Use this when you want USER-adjustable column widths. For static layouts
 * with a fixed-width middle column, prefer `<AppShell nav="three-pane">`
 * — that's a plain CSS grid with no JS.
 *
 * Layout-shape parity:
 *   - `direction="horizontal"` → ResizableHandle is vertical (the divider
 *     between two columns)
 *   - `direction="vertical"`   → ResizableHandle is horizontal (the divider
 *     between two rows)
 *
 * Persisting layout: pass `id` to ResizablePanelGroup and `id` to each
 * ResizablePanel; react-resizable-panels writes layout to localStorage
 * under that id so the user's preferred sizes survive reloads.
 *
 * Example:
 *
 *   <ResizablePanelGroup direction="horizontal" id="inbox-shell">
 *     <ResizablePanel defaultSize={20} minSize={15} id="nav">
 *       <Sidebar />
 *     </ResizablePanel>
 *     <ResizableHandle withHandle />
 *     <ResizablePanel defaultSize={30} minSize={20} id="list">
 *       <ThreadList />
 *     </ResizablePanel>
 *     <ResizableHandle />
 *     <ResizablePanel defaultSize={50} id="detail">
 *       <ThreadDetail />
 *     </ResizablePanel>
 *   </ResizablePanelGroup>
 */
const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    data-gds-part="resizable-panel-group"
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  /** When true, render a visible grip handle in the middle of the divider
   *  for affordance. Without this, the handle is just a 1px hit area —
   *  fine for power-user tools, harder to discover for everyone else. */
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    data-gds-part="resizable-handle"
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
