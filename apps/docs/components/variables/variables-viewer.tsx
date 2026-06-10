"use client";

/**
 * VariablesViewer — the shared variables table.
 *
 * Pure presentation: collections/groups rail + swatch-card grids + value
 * tables, fed entirely by a `ViewerGroup[]` data model. Two hosts build
 * that model differently:
 *
 *   - /variables (public docs): the LOCKED core defaults from
 *     @gradeui/core's GDS_* data — what Grade ships.
 *   - the project variables panel (Studio): the project's EFFECTIVE
 *     values — the generated theme's primary/accent/neutral ramps (live
 *     as the style panel edits) layered over the core primitives. This
 *     is where override editing lands.
 *
 * Click-to-copy on every swatch; `compact` drops the rail for narrow
 * hosts (settings sheet, popovers) and renders a group select instead.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ViewerSwatch {
  name: string;
  /** Any valid CSS color — hex from core data, `oklch(…)` from a theme. */
  css: string;
  /** The variable copied on click, e.g. "--gds-green-500". */
  variable: string;
  /** Mark the ramp's brand-strength step. */
  primary?: boolean;
  /** Small annotation (e.g. "→ green-600" on an alias). */
  note?: string;
}

export interface ViewerRow {
  name: string;
  variable: string;
  value: string;
}

export interface ViewerGroup {
  id: string;
  label: string;
  subtitle?: string;
  kind: "swatches" | "table";
  swatches?: ViewerSwatch[];
  rows?: ViewerRow[];
}

export interface VariablesViewerProps {
  groups: ViewerGroup[];
  /** Label for the rail's collection chip. */
  collectionLabel?: string;
  /** Compact mode: no rail, a select instead. For sheets/popovers. */
  compact?: boolean;
  className?: string;
}

function SwatchCard({ swatch }: { swatch: ViewerSwatch }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(`var(${swatch.variable})`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Click to copy var(${swatch.variable})`}
      className="group text-left rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="h-14 w-full border-b" style={{ background: swatch.css }} />
      <div className="p-2.5 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium truncate">{swatch.name}</span>
          {copied ? (
            <Check className="h-3 w-3 text-primary shrink-0" />
          ) : swatch.primary ? (
            <span className="text-[10px] leading-4 bg-primary/10 text-primary px-1 rounded shrink-0">
              Primary
            </span>
          ) : null}
        </div>
        <div className="text-[10px] text-muted-foreground font-mono truncate uppercase">
          {swatch.note ?? swatch.css}
        </div>
      </div>
    </button>
  );
}

export function VariablesViewer({
  groups,
  collectionLabel = "Core",
  compact,
  className,
}: VariablesViewerProps) {
  const [active, setActive] = React.useState<string>("all");
  const visible = active === "all" ? groups : groups.filter((g) => g.id === active);

  const content = (
    <div className="flex-1 min-w-0 space-y-8">
      {visible.map((g) => (
        <section key={g.id} className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{g.label}</h3>
            {g.subtitle ? (
              <p className="text-xs text-muted-foreground">{g.subtitle}</p>
            ) : null}
          </div>
          {g.kind === "swatches" ? (
            <div
              className={cn(
                "grid gap-2.5",
                compact
                  ? "grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
              )}
            >
              {g.swatches?.map((s) => (
                <SwatchCard key={s.variable} swatch={s} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card divide-y">
              {g.rows?.map((r) => (
                <div
                  key={r.variable}
                  className="flex items-center gap-3 px-3 py-2 text-xs"
                >
                  <span className="w-28 shrink-0 font-medium">{r.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground flex-1 truncate">
                    {r.variable}
                  </span>
                  <span className="font-mono text-[11px]">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className={cn("space-y-4", className)} data-lenis-prevent>
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
        >
          <option value="all">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        {content}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-8 items-start", className)}>
      <aside className="hidden md:block w-52 shrink-0 sticky top-20 space-y-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Collections
          </div>
          <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium flex items-center justify-between">
            {collectionLabel}
            <span className="text-xs text-muted-foreground">{groups.length}</span>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
            Groups
          </div>
          <nav className="space-y-0.5">
            {["all", ...groups.map((g) => g.id)].map((id) => {
              const label =
                id === "all" ? "All" : groups.find((g) => g.id === id)?.label ?? id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  className={cn(
                    "w-full text-left rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active === id
                      ? "bg-muted font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
      {content}
    </div>
  );
}
