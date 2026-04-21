"use client";

/**
 * ThemeBuilderHeader — title strip with undo/redo/reset controls.
 *
 * Defaults to showing the current theme's name and a dirty dot when the
 * working input differs from the last rebase point. Hosts can replace
 * the title slot entirely via `title` — e.g. a "Close" button in a modal
 * or a segmented "light/dark" preview toggle pinned up-top.
 */

import * as React from "react";
import { Undo2, Redo2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeBuilder } from "./theme-builder-provider";
import { IconButton } from "./theme-builder-primitives";

export interface ThemeBuilderHeaderProps {
  /** Override the left-hand title. Defaults to `Theme: <name>` plus a
   *  dirty indicator. */
  title?: React.ReactNode;
  /** Slot inserted between the title and the icon cluster. Handy for
   *  custom actions that should visually live inside the header bar. */
  actions?: React.ReactNode;
  /** Hide the undo / redo / reset cluster. Useful in "headless" hosts
   *  that render their own controls elsewhere. */
  hideHistoryControls?: boolean;
  className?: string;
}

export function ThemeBuilderHeader({
  title,
  actions,
  hideHistoryControls = false,
  className,
}: ThemeBuilderHeaderProps) {
  const { input, isDirty, canUndo, canRedo, undo, redo, reset } =
    useThemeBuilder();

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {title ?? (
          <>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Theme
            </span>
            <span className="text-xs font-semibold text-foreground truncate">
              {input.name}
            </span>
            {isDirty && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
                title="Unsaved changes"
                aria-label="Unsaved changes"
              />
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        {!hideHistoryControls && (
          <div className="flex items-center gap-0.5">
            <IconButton
              onClick={undo}
              disabled={!canUndo}
              title="Undo"
              label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              onClick={redo}
              disabled={!canRedo}
              title="Redo"
              label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              onClick={reset}
              disabled={!isDirty}
              title="Reset to original"
              label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
