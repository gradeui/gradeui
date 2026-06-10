"use client";

/**
 * ProjectVariablesPanel — the variables viewer INSIDE a project.
 *
 * Where /variables shows the locked core defaults, this shows the
 * project's EFFECTIVE palette: the generated theme's primary / accent /
 * neutral ramps (live — re-renders as the style panel edits, because it
 * reads the ambient ThemeBuilderProvider's `generated`), with the core
 * primitives below for reference.
 *
 * Provider-inheriting like StylePanel: requires Studio's page-level
 * ThemeBuilderProvider (renders a quiet fallback without one, so it's
 * safe in any host). Read-only v1; override editing (per project, then
 * per screen) writes through the same contract the style panel uses —
 * see STUDIO-BYODS.md "Component contracts" for the ladder.
 */

import * as React from "react";
import { useMaybeThemeBuilder } from "@/components/theme-builder";
import type { Ramp } from "@/lib/themes";
import {
  VariablesViewer,
  type ViewerGroup,
  type ViewerSwatch,
} from "@/components/variables/variables-viewer";
import { buildCoreGroups } from "@/components/variables/core-groups";
import { cn } from "@/lib/utils";

/** Generated ramps carry OKLCH triplets ("0.61 0.15 160"); wrap for CSS. */
function rampSwatches(role: string, ramp: Ramp): ViewerSwatch[] {
  return Object.entries(ramp).map(([step, triplet]) => ({
    name: `${role}-${step}`,
    css: `oklch(${triplet})`,
    variable: `--gds-ramp-${role}-${step}`,
    primary: Number(step) === 500,
  }));
}

export interface ProjectVariablesPanelProps {
  className?: string;
}

export function ProjectVariablesPanel({ className }: ProjectVariablesPanelProps) {
  const builder = useMaybeThemeBuilder();

  const groups = React.useMemo<ViewerGroup[]>(() => {
    const core = buildCoreGroups();
    if (!builder) return core;
    const { ramps } = builder.generated;
    const themeGroups: ViewerGroup[] = [
      {
        id: "theme-primary",
        label: "Theme · Primary",
        subtitle: "Generated from the project theme — edits in the style panel update these live.",
        kind: "swatches",
        swatches: rampSwatches("primary", ramps.primary),
      },
      {
        id: "theme-accent",
        label: "Theme · Accent",
        kind: "swatches",
        swatches: rampSwatches("accent", ramps.accent),
      },
      {
        id: "theme-neutral",
        label: "Theme · Neutral",
        kind: "swatches",
        swatches: rampSwatches("neutral", ramps.neutral),
      },
    ];
    return [...themeGroups, ...core];
  }, [builder, builder?.generated]);

  if (!builder) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        No project theme in scope — open this panel inside Studio to see the
        project's effective variables.
      </p>
    );
  }

  return <VariablesViewer groups={groups} collectionLabel="Project" compact className={className} />;
}
