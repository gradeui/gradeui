"use client";

/**
 * LayoutStartersPanel — Stage A of the stage-aware right panel.
 *
 * Surfaces every entry in @gradeui/studio/playbook's REFERENCE_LAYOUTS
 * registry as a clickable card. Clicking a card seeds the active
 * design's `appSource` with the layout's scaffold via the same
 * `handleSourceMutation` path the chat already uses — no LLM
 * round-trip, instant render.
 *
 * Visible when `resolveRightPanelStage()` returns "A" (blank or
 * trivial design). The Stage-router (`StudioRightPanel`) decides when
 * to mount this; we just render.
 *
 * Visual language matches the previous right-column panel — same
 * bordered rounded card shell, same header strip, scrollable body. So
 * users transitioning off the theme builder don't see a jarring
 * structural change, only different content.
 */

import * as React from "react";

import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook";
import { useActiveRegistry } from "@/lib/use-active-registry";
import { cn } from "@/lib/utils";

export interface LayoutStartersPanelProps {
  className?: string;
  /** Fired when the user picks a starter. Receives the scaffold JSX
   *  ready to drop into `appSource`. */
  onPick: (scaffold: string, layoutId: string) => void;
}

export function LayoutStartersPanel({
  className,
  onPick,
}: LayoutStartersPanelProps) {
  // Per-project registry: REFERENCE_LAYOUTS are gradeui JSX — on an
  // external project, offer the registry's SOURCE templates instead
  // (same pick contract: scaffold JSX → appSource).
  const registry = useActiveRegistry();
  const external = registry.id !== "gradeui";
  const starters = external
    ? (registry.templates ?? [])
        .filter((t) => t.source)
        .map((t) => ({
          id: t.id,
          label: t.label,
          description: t.description,
          scaffold: t.source as string,
          tags: [] as string[],
        }))
    : REFERENCE_LAYOUTS;
  return (
    <div
      className={cn(
        // Bare wrapper — the parent TabsContent inside
        // StudioRightTabs provides the bordered card chrome. We
        // just lay out our header strip + scrollable body.
        "flex flex-col h-full",
        className,
      )}
    >
      {/* No internal "Layout" header — the tab trigger already carries
          the section name + icon. A single muted hint line at the top
          of the scroll area explains what clicking a card does; that's
          a unique instruction, not a duplicated heading. */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        data-lenis-prevent
      >
        <p className="px-1 pb-1 text-[11px] text-muted-foreground/70">
          Pick a starter to seed this screen.
        </p>
        {starters.map((layout) => (
          <button
            key={layout.id}
            type="button"
            onClick={() => onPick(layout.scaffold, layout.id)}
            className={cn(
              "w-full text-left rounded-md border border-border bg-background p-2.5",
              "hover:bg-muted hover:border-primary/40 transition-colors",
              "focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary",
            )}
          >
            <div className="text-xs font-medium text-foreground mb-0.5">
              {layout.label}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
              {layout.description}
            </p>
            {/* Tag chips — show just the first few. Tags are the
                retrieval-pass tokens; surfacing them here doubles as a
                hint to the user about what each layout is good for. */}
            {layout.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {layout.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
