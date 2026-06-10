/**
 * core-groups — build the ViewerGroup[] model for the LOCKED core
 * primitives from @gradeui/core's GDS_* data. Shared by the public
 * /variables page and the project variables panel (which prepends the
 * project's generated theme ramps in front of these).
 */

import {
  GDS_COLOR_RAMPS,
  GDS_NEUTRALS,
  GDS_SEMANTIC_ALIASES,
  GDS_SPACING,
  GDS_RADIUS,
  GDS_FONT_FAMILIES,
  GDS_TYPE_SCALE,
  GDS_RAMP_NAMES,
} from "@gradeui/core";
import type { ViewerGroup, ViewerSwatch } from "./variables-viewer";

type RampData = {
  base?: string;
  primaryStep?: number;
  note?: string;
  steps: Record<string, string>;
};

const ramps = GDS_COLOR_RAMPS as Record<string, RampData>;
const aliases = GDS_SEMANTIC_ALIASES as Record<string, { ramp: string; step: number }>;
const grays = GDS_NEUTRALS.gray as Record<string, string>;

/** Resolve an alias target to a displayable color — ramps first, then the
 *  gray scale (the `neutral` palette role points at gray-500). */
function resolveAlias(target: { ramp: string; step: number }): string {
  if (target.ramp === "gray") return grays[String(target.step)] ?? "transparent";
  return ramps[target.ramp]?.steps[String(target.step)] ?? "transparent";
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildCoreGroups(): ViewerGroup[] {
  const groups: ViewerGroup[] = [];

  for (const name of GDS_RAMP_NAMES as readonly string[]) {
    const data = ramps[name];
    groups.push({
      id: name,
      label: cap(name),
      subtitle: `--gds-${name}-${Object.keys(data.steps)[0]} … ${Object.keys(data.steps).slice(-1)[0]}`,
      kind: "swatches",
      swatches: Object.entries(data.steps).map(([step, hex]): ViewerSwatch => ({
        name: `${name}-${step}`,
        css: hex,
        variable: `--gds-${name}-${step}`,
        primary: data.primaryStep === Number(step),
      })),
    });
  }

  groups.push({
    id: "neutrals",
    label: "Neutrals",
    subtitle: "Black and white poles plus the gray ramp.",
    kind: "swatches",
    swatches: [
      { name: "black", css: GDS_NEUTRALS.black, variable: "--gds-black" },
      ...Object.entries(grays).map(([step, hex]): ViewerSwatch => ({
        name: `gray-${step}`,
        css: hex,
        variable: `--gds-gray-${step}`,
      })),
      { name: "white", css: GDS_NEUTRALS.white, variable: "--gds-white" },
    ],
  });

  // EVERY role points at a WHOLE RAMP — primary IS the green family,
  // success IS a green family too (status displays many ways: soft
  // badge bg at 100, solid fill at 600, readable text at 800). The bare
  // --gds-<role> var holds the lead step; per-step role families
  // (--gds-success-100) arrive generated with the @theme migration.
  // Rendered as ramp strips, lead step in the note.
  const rampStrip = (rampName: string): string => {
    const steps =
      rampName === "gray" ? Object.values(grays) : Object.values(ramps[rampName]?.steps ?? {});
    return `linear-gradient(to right, ${steps.join(", ")})`;
  };

  groups.push({
    id: "semantic",
    label: "Semantic aliases",
    subtitle:
      "Roles pointing at WHOLE ramps — palette roles (primary / secondary / neutral) and status roles alike. The bare variable holds the lead step; re-point a role and everything referencing it follows.",
    kind: "swatches",
    swatches: Object.entries(aliases).map(([alias, target]): ViewerSwatch => ({
      name: alias,
      css: rampStrip(target.ramp),
      variable: `--gds-${alias}`,
      note: `→ ${target.ramp} ramp · lead ${target.step}`,
    })),
  });

  groups.push({
    id: "spacing",
    label: "Spacing",
    subtitle: "The --gds-space-* scale.",
    kind: "table",
    rows: Object.entries(GDS_SPACING as Record<string, string>).map(([k, v]) => ({
      name: `space-${k}`,
      variable: `--gds-space-${k}`,
      value: v,
    })),
  });

  groups.push({
    id: "radius",
    label: "Radius",
    subtitle: "The --gds-radius-* scale.",
    kind: "table",
    rows: Object.entries(GDS_RADIUS as Record<string, string>).map(([k, v]) => ({
      name: `radius-${k}`,
      variable: `--gds-radius-${k}`,
      value: v,
    })),
  });

  groups.push({
    id: "typography",
    label: "Typography",
    subtitle: "Font stacks, semantic slots, and the type scale.",
    kind: "table",
    rows: [
      ...Object.entries(GDS_FONT_FAMILIES as Record<string, string>).map(([k, v]) => ({
        name: `font-${k}`,
        variable: `--font-${k}`,
        value: v,
      })),
      ...Object.entries(GDS_TYPE_SCALE as Record<string, string>).map(([k, v]) => ({
        name: `text-${k}`,
        variable: `--text-${k}`,
        value: v,
      })),
    ],
  });

  return groups;
}
