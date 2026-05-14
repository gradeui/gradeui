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
              title="Click to rename"
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
