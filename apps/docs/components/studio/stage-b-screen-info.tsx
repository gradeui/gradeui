"use client";

/**
 * StageBScreenInfo — metadata view for the right column's Stage B.
 *
 * Replaces the old `StageBInspector` component-list as the DEFAULT
 * surface when a design has content but nothing is selected. The
 * inventory wasn't bad data, just wrong tone for the default: the
 * panel read as a developer / data-engineering view rather than
 * "details about this screen". This file owns the new top-of-panel
 * experience; the inventory is still reachable inside the
 * "Component inventory" accordion below the metadata.
 *
 * Surfaced metadata:
 *   - Name        — Design.name
 *   - Status      — editable select, draft / in_progress /
 *                   in_review / done; persists on Design.status
 *   - Project     — read-only label, project the screen belongs to
 *   - Revisions   — undo-history snapshot count
 *   - Created     — Design.createdAt (absolute date)
 *   - Updated     — Design.updatedAt (relative, "5 minutes ago")
 *
 * Everything is token-driven (CSS variables on muted-foreground /
 * border / etc); no hard-coded greys.
 */

import * as React from "react";
import { formatDistanceToNow } from "date-fns";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  DESIGN_STATUSES,
  designStatusLabel,
  type DesignStatus,
} from "@/lib/studio-designs";

import { ComponentInventory } from "./stage-b-inspector";

export interface StageBScreenInfoProps {
  /** Active design's JSX source — passed straight to the inventory
   *  accordion. */
  appSource: string | null;
  /** Display name for the screen. */
  designName: string;
  /** Creation timestamp in epoch ms. Optional for legacy designs
   *  pre-dating the field. */
  createdAt?: number;
  /** Last mutation timestamp in epoch ms. Optional for legacy
   *  designs. */
  updatedAt?: number;
  /** Current lifecycle status — undefined normalises to "draft". */
  status?: DesignStatus;
  /** Snapshot count from the undo history hook. */
  revisions: number;
  /** Owning project's display name. Read-only on this surface;
   *  project metadata lives in the project settings sheet. */
  projectName: string;
  /** Patch status on the active design. Empty / no-op handler is
   *  fine — the select stays controlled either way. */
  onStatusChange: (status: DesignStatus) => void;
  className?: string;
}

/** Locale-aware, SSR-safe absolute date. Format is fixed (avoids
 *  relying on the runtime's default locale) so the rendered string
 *  matches on first paint and after hydration. */
function formatCreated(epoch: number): string {
  // 27 May 2026, 14:32
  return new Date(epoch).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative time, e.g. "5 minutes ago". date-fns is already pulled
 *  in via the date-picker; no extra dep. Wrapped in a try/catch
 *  because formatDistanceToNow throws on invalid dates and we'd
 *  rather render "—" than crash the panel. */
function formatRelative(epoch: number): string {
  try {
    return formatDistanceToNow(new Date(epoch), { addSuffix: true });
  } catch {
    return "—";
  }
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

/** One key/value row in the metadata list. Grid layout so labels
 *  align across rows; label column width is a CSS var so a future
 *  theme tweak can widen it without touching the markup. */
function Row({ label, children }: RowProps) {
  return (
    <div
      className="grid items-center gap-3 py-2"
      style={{ gridTemplateColumns: "var(--gds-meta-label-col, 96px) 1fr" }}
    >
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-xs text-foreground min-w-0 truncate">{children}</dd>
    </div>
  );
}

export function StageBScreenInfo({
  appSource,
  designName,
  createdAt,
  updatedAt,
  status,
  revisions,
  projectName,
  onStatusChange,
  className,
}: StageBScreenInfoProps) {
  const effectiveStatus: DesignStatus = status ?? "draft";

  // Tick the "updated X ago" string every minute so the panel
  // stays fresh while the user lingers. Cheap — one setInterval
  // bumping a render counter.
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = window.setInterval(() => force(), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header strip — screen name + status pill. Mirrors the
          "page properties" pattern: identity on the left, state on
          the right. Border-b ties it to the divider rhythm the
          tab shell already establishes. */}
      <header className="px-3 pt-3 pb-2 shrink-0 border-b border-border">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
          Screen
        </p>
        <h2 className="text-sm font-semibold text-foreground truncate">
          {designName}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <dl className="divide-y divide-border">
          <Row label="Status">
            <Select
              value={effectiveStatus}
              onValueChange={(v) => onStatusChange(v as DesignStatus)}
            >
              <SelectTrigger
                className={cn(
                  "h-7 text-xs w-auto min-w-[120px]",
                  // Tone the trigger to feel like a chip rather than
                  // a full input — borderless until hovered.
                  "border-transparent bg-transparent hover:bg-muted",
                  "focus:bg-muted",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {designStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>

          <Row label="Project">
            <Badge
              variant="outline"
              className="text-[11px] font-normal max-w-full"
            >
              <span className="truncate">{projectName}</span>
            </Badge>
          </Row>

          <Row label="Revisions">
            <span className="font-mono text-xs">{revisions}</span>
          </Row>

          <Row label="Created">
            <span
              className="text-xs text-foreground/80"
              title={createdAt ? new Date(createdAt).toString() : undefined}
            >
              {createdAt ? formatCreated(createdAt) : "—"}
            </span>
          </Row>

          <Row label="Updated">
            <span
              className="text-xs text-foreground/80"
              title={updatedAt ? new Date(updatedAt).toString() : undefined}
            >
              {updatedAt ? formatRelative(updatedAt) : "—"}
            </span>
          </Row>
        </dl>

        {/* Advanced disclosure — keeps the inventory reachable
            without dragging it into the default view. Collapsed
            by default. Border-t separates it from the metadata
            block above. */}
        <div className="pt-3 mt-2 border-t border-border">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="inventory" className="border-b-0">
              <AccordionTrigger
                className={cn(
                  "py-2 text-xs font-medium text-muted-foreground hover:no-underline",
                  "hover:text-foreground",
                )}
              >
                Component inventory
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-1">
                <ComponentInventory appSource={appSource} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}

