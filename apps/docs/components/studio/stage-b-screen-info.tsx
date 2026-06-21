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
import { PropertyList } from "@/components/ui/property-list";
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
    <div className={cn("flex h-full flex-col", className)}>
      {/* Screen identity — quiet eyebrow + name, on the same section
          rhythm (border-/60) as the Display section above it. */}
      <section className="shrink-0 border-b border-border/60 px-3 pt-2.5 pb-2.5">
        <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
          Screen
        </p>
        <h2 className="truncate text-sm font-semibold text-foreground">
          {designName}
        </h2>
      </section>

      <div className="flex-1 overflow-y-auto">
        {/* Metadata — the shared PropertyList primitive (read-only
            label/value), so it matches every other detail surface and
            drops the per-row dividers that made this read busy. */}
        <section className="px-3 py-3">
          <PropertyList density="compact" labelWidth="6rem">
            <PropertyList.Row label="Status">
              <Select
                value={effectiveStatus}
                onValueChange={(v) => onStatusChange(v as DesignStatus)}
              >
                <SelectTrigger
                  size="xs"
                  className="w-auto min-w-[120px] border-transparent bg-transparent hover:bg-muted focus:bg-muted"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent size="xs" position="item-aligned">
                  {DESIGN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {designStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PropertyList.Row>

            <PropertyList.Row label="Project">
              <Badge variant="outline" className="max-w-full font-normal">
                <span className="truncate">{projectName}</span>
              </Badge>
            </PropertyList.Row>

            <PropertyList.Row label="Revisions" value={revisions} />

            <PropertyList.Row
              label="Created"
              value={createdAt ? formatCreated(createdAt) : "—"}
            />

            <PropertyList.Row
              label="Updated"
              value={updatedAt ? formatRelative(updatedAt) : "—"}
            />
          </PropertyList>
        </section>

        {/* Component inventory — collapsible, on the section divider
            rhythm so it reads as one more block, not a tacked-on extra. */}
        <section className="border-t border-border/60 px-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="inventory" className="border-b-0">
              <AccordionTrigger className="py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                Component inventory
              </AccordionTrigger>
              <AccordionContent className="pb-2 pt-1">
                <ComponentInventory appSource={appSource} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}

