"use client";

/**
 * ThemeBuilderFooter — save + export action strip. Reads save/export
 * handlers off the provider so the same footer works in any bind mode.
 *
 * The footer intentionally stays thin on semantics: it's a "Save theme"
 * button (primary) plus an "Export" button (secondary). If a host wants
 * different wording, icons, or extra actions, it can render its own
 * footer with raw hooks — nothing here is required.
 */

import * as React from "react";
import { Save, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeBuilder } from "./theme-builder-provider";

export interface ThemeBuilderFooterProps {
  className?: string;
  /** Override the save-button label. Default: "Save theme". In
   *  bindTo="site" mode this persists + activates the theme site-wide; in
   *  other modes it fires the provider's `onSave` callback. */
  saveLabel?: string;
  /** Override the export-button label. Default: "Export". */
  exportLabel?: string;
  /** Hide the export button (some embeds don't need it). */
  hideExport?: boolean;
  /** Extra nodes rendered after the two default buttons — handy for a
   *  "Copy link" or "Share" action that only makes sense in certain
   *  hosts. */
  children?: React.ReactNode;
}

export function ThemeBuilderFooter({
  className,
  saveLabel = "Save theme",
  exportLabel = "Export",
  hideExport = false,
  children,
}: ThemeBuilderFooterProps) {
  const { save, exportMarkdown, isDirty } = useThemeBuilder();

  return (
    <div
      className={cn(
        "border-t border-border p-2.5 bg-card shrink-0 flex items-center gap-2",
        className
      )}
    >
      <button
        type="button"
        onClick={save}
        disabled={!isDirty}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          isDirty
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        title={isDirty ? "Save as a new theme" : "No edits to save"}
      >
        <Save className="h-3.5 w-3.5" />
        {saveLabel}
      </button>
      {!hideExport && (
        <button
          type="button"
          onClick={exportMarkdown}
          className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          title="Export as markdown"
        >
          <Download className="h-3.5 w-3.5" />
          {exportLabel}
        </button>
      )}
      {children}
    </div>
  );
}
