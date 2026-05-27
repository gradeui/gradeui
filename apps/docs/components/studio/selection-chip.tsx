"use client";

/**
 * SelectionChip — the single canonical way to display the
 * currently-selected canvas element.
 *
 * Before this existed, Studio had three different selection
 * displays in three different surfaces:
 *
 *   - Canvas toolbar:   `◎ Editing <Row>`        primary pill, Crosshair icon
 *   - Chat composer:    `◎ <Row> #21 ×`          studio-accent pill, pointer icon
 *   - (path bar):       `AppShellMain / Stack / Row` breadcrumb
 *
 * All three were communicating the same fact — "this element is
 * selected" — with different chrome. This component is the
 * canonical pill; both the canvas toolbar and the chat composer
 * now render `<SelectionChip>` so the look is consistent across
 * surfaces. The breadcrumb-style path bar stays as-is because it
 * communicates ancestor *hierarchy*, not just identity, and reads
 * naturally as a separate affordance.
 *
 * Visual: rounded-full chip with a Crosshair glyph, the picked
 * component in mono font (`<Row>`), the sourceId / instanceId
 * subscript if present (`#21`), and an optional dismiss X. Primary
 * theme color so it reads as "the active selection" without
 * fighting whatever screen theme the canvas is showing.
 *
 * No new DS atoms — composed from Tailwind utilities. Could
 * eventually graduate into `@gradeui/ui` as a generic "tag with
 * dismiss" primitive if we find similar uses elsewhere.
 */

import * as React from "react";
import { Crosshair, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StudioSelection } from "@/lib/chat-sandpack";

interface SelectionChipProps {
  selection: StudioSelection;
  /** Optional dismiss handler. When wired, renders an X button on
   *  the trailing edge of the chip. */
  onDismiss?: () => void;
  /** Optional click handler on the chip body. When wired, the
   *  chip becomes a button (useful for "click to focus this
   *  element in the canvas" from sidebars / chat history). */
  onClick?: () => void;
  /** Optional prefix shown before the component name — e.g.
   *  "Editing" in the canvas toolbar to convey "this is what
   *  edits target". Default: no prefix. */
  prefix?: React.ReactNode;
  /** Tooltip override. Defaults to a sensible "Selected <X>" string. */
  title?: string;
  className?: string;
}

export function SelectionChip({
  selection,
  onDismiss,
  onClick,
  prefix,
  title,
  className,
}: SelectionChipProps) {
  const label = selection.componentName ?? selection.tag ?? "element";
  // Subscript identifier — prefer the JSX source id (stable across
  // re-renders) because that's what the rest of Studio uses to
  // address an element. instanceId is the per-iteration counterpart
  // used by data-array mutations; we surface it only when sourceId
  // isn't present.
  const subscript =
    selection.sourceId ?? selection.instanceId ?? undefined;
  const tooltip =
    title ??
    `Selected <${label}>${
      selection.part ? ` (data-gds-part="${selection.part}")` : ""
    }`;

  const inner = (
    <>
      <Crosshair
        className="h-3 w-3 shrink-0 text-primary"
        aria-hidden
      />
      {prefix && (
        <span className="shrink-0 text-foreground/80">{prefix}</span>
      )}
      <span className="shrink-0 font-mono font-medium text-primary">
        &lt;{label}&gt;
      </span>
      {subscript !== undefined && (
        <span
          className="shrink-0 font-mono text-[10px] text-muted-foreground"
          title={
            selection.sourceId !== undefined
              ? `Source id: ${selection.sourceId}`
              : `Instance id: ${selection.instanceId}`
          }
        >
          #{subscript}
        </span>
      )}
      {selection.text && !selection.componentName && (
        <span
          className="truncate min-w-0 text-foreground/80 italic"
          title={selection.text}
        >
          &ldquo;{selection.text}&rdquo;
        </span>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10",
        "px-2 py-0.5 text-[11px] max-w-full",
        className,
      )}
      title={tooltip}
    >
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1.5 min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {inner}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 min-w-0">
          {inner}
        </span>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Clear selection: <${label}>`}
          className="ml-0.5 rounded-full p-0.5 text-primary/70 hover:text-primary hover:bg-primary/20 transition-colors shrink-0 [&_svg]:size-3"
        >
          <X />
        </button>
      )}
    </div>
  );
}
