"use client";

/**
 * DesignBreadcrumb — screen-state breadcrumb with inline rename.
 *
 *   ‹ All screens   /   <focused name (click-to-rename)>
 *
 * Renders inside the canvas's top row in screen-state. The parent
 * row provides layout + the right-aligned action cluster
 * (Preview/Code, viewport picker, Select, overflow menu); this
 * component just owns the breadcrumb itself and the rename UX.
 *
 * Mental model: All mode is the grid, Fit mode is the focused screen.
 * Switching between screens always goes through the grid — no in-Fit
 * tab strip. Click "All screens" to go back; click a tile to enter.
 *
 * Future: the "All screens" label becomes the project name when the
 * project layer lands ("Acme website / Pricing page").
 */

import * as React from "react";
import { useEffect, useRef, useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import type { Design } from "@/lib/studio-designs";

export interface DesignBreadcrumbProps {
  focused: Design;
  onBack: () => void;
  onRename: (id: string, name: string) => void;
  /** Label for the parent surface — defaults to "All screens" until
   *  the project layer lands and consumers want the project name. */
  parentLabel?: string;
  className?: string;
}

export function DesignBreadcrumb({
  focused,
  onBack,
  onRename,
  parentLabel = "All screens",
  className,
}: DesignBreadcrumbProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(focused.name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reset draft when the focused screen changes — otherwise typing
  // halfway through a rename then flipping to a different design
  // would leak the half-typed name onto the next screen.
  useEffect(() => {
    setDraft(focused.name);
    setEditing(false);
  }, [focused.id, focused.name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== focused.name) onRename(focused.id, trimmed);
    else setDraft(focused.name);
    setEditing(false);
  };

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={onBack}>{parentLabel}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setDraft(focused.name);
                  setEditing(false);
                }
              }}
              className={cn(
                "bg-transparent border-b border-primary outline-none",
                "min-w-0 w-[180px] text-xs font-medium text-foreground",
              )}
            />
          ) : (
            <BreadcrumbPage
              onClick={() => {
                setDraft(focused.name);
                setEditing(true);
              }}
              title={breadcrumbTooltip(focused)}
              className="cursor-text hover:bg-muted/60 rounded-md px-1.5 py-0.5"
            >
              {focused.name}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Tooltip body for the breadcrumb's design label. Shows "Click to
 * rename" plus the last-edited stamp when available. The stamp is
 * rendered as a relative phrase ("3m ago", "yesterday") for the most
 * common cases and falls back to a locale date for older entries.
 * Tooltips are plain strings (no JSX), so this is a single
 * newline-joined string.
 */
function breadcrumbTooltip(d: Design): string {
  const lines = ["Click to rename"];
  if (d.updatedAt) lines.push(`Last edited ${relativeTime(d.updatedAt)}`);
  if (d.createdAt && d.updatedAt && d.createdAt !== d.updatedAt) {
    lines.push(`Created ${relativeTime(d.createdAt)}`);
  } else if (d.createdAt) {
    lines.push(`Created ${relativeTime(d.createdAt)}`);
  }
  return lines.join("\n");
}

/**
 * Cheap relative-time formatter — "Just now" / "Nm ago" / "Nh ago" /
 * "Nd ago", falling back to a locale date string past a week. No
 * `Intl.RelativeTimeFormat` because that needs a locale (and would
 * trip the SSR-locale memory note); a plain string is fine for a
 * tooltip.
 */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  // Past a week — drop to ISO date (locale-independent, no hydration
  // surprises).
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
