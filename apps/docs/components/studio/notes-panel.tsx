"use client";

/**
 * NotesPanel — free-form per-design notes.
 *
 * One of the three right-column tabs. State is owned by the parent
 * (`notesByDesign: Record<designId, string>` in `app/studio/page.tsx`)
 * and threaded down as a controlled `value` + `onChange` pair. That
 * keeps the panel pure (no localStorage of its own) and means design-
 * switching the tabs swaps the notes with the rest of the per-design
 * state.
 *
 * v1 is a single textarea. Future shape options if we grow this:
 *
 *   - Per-selection notes anchored to a `data-gds-part` (the "comment
 *     on a component" direction from the Studio lock/notes memory).
 *   - Markdown rendering when not focused.
 *   - Export-to-design-doc (the notes become the design.md companion
 *     to the page composer pipeline).
 *
 * The tab trigger above already says "Notes" with a sticky-note icon,
 * so the panel renders with no in-content header — just the textarea
 * filling the column.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

export interface NotesPanelProps {
  /** Notes text for the active design. */
  value: string;
  /** Fired on every keystroke. Parent persists into `notesByDesign[activeId]`. */
  onChange: (next: string) => void;
  /** Human-readable design name for the placeholder hint. */
  designName?: string;
  className?: string;
}

export function NotesPanel({
  value,
  onChange,
  designName,
  className,
}: NotesPanelProps) {
  return (
    <div
      className={cn(
        // Bare wrapper — chrome is owned by the parent TabsContent.
        "flex flex-col h-full p-2",
        className,
      )}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          designName
            ? `Notes for ${designName}…`
            : "What is this screen trying to do? Open questions? Design refs?"
        }
        className={cn(
          "flex-1 min-h-0 w-full resize-none rounded-md border border-input bg-background",
          "px-2.5 py-2 text-xs leading-relaxed text-foreground",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
        )}
        spellCheck
      />
    </div>
  );
}
