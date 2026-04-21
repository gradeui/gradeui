"use client";

/**
 * ThemeBuilderPanel — convenience "batteries-included" shell that renders
 * the full header + scrollable controls + footer stack inside a rounded
 * bordered card. Ninety percent of use cases are this layout; the
 * primitives are there for the other ten.
 *
 *   <ThemeBuilderProvider initial={input} bindTo="site">
 *     <ThemeBuilderPanel className="h-full" />
 *   </ThemeBuilderProvider>
 *
 * If you need a different layout — e.g. header+controls only, or a
 * custom footer — compose the pieces yourself using the named exports
 * instead of this panel.
 */

import { cn } from "@/lib/utils";
import { ThemeBuilderHeader } from "./theme-builder-header";
import { ThemeBuilderControls } from "./theme-builder-controls";
import { ThemeBuilderFooter } from "./theme-builder-footer";

export interface ThemeBuilderPanelProps {
  className?: string;
  /** Hide the Mode section inside the controls. Most hosts that already
   *  show a mode toggle in their chrome pass true here. */
  hideMode?: boolean;
}

export function ThemeBuilderPanel({
  className,
  hideMode,
}: ThemeBuilderPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden",
        className
      )}
    >
      <ThemeBuilderHeader />
      <ThemeBuilderControls hideMode={hideMode} />
      <ThemeBuilderFooter />
    </div>
  );
}
