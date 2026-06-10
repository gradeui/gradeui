/**
 * generate-tokens.mjs — parse styles/tokens.css into src/tokens.generated.ts.
 *
 * Same authored-file → generated-TS pattern as the studio sidecars: the CSS
 * is the single authored source of truth for primitive values; this script
 * derives the typed data module that the Studio theme picker, the variable
 * viewer, and any other tooling consume. Never edit tokens.generated.ts by
 * hand — edit tokens.css and re-run `pnpm -F @gradeui/core generate`
 * (also runs on prebuild).
 *
 * Parsing notes:
 *   - Ramps are detected as `--gds-<name>-<step>` where <step> is numeric;
 *     `--gds-<name>` (no step) is the ramp's base alias.
 *   - The "primary step" of a ramp is the declaration carrying a trailing
 *     `/* Primary … *​/` comment in the CSS.
 *   - Semantic aliases are `--gds-<alias>: var(--gds-<ramp>-<step>)`.
 *   - gray + black/white are collected as neutrals, not a brand ramp.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "styles/tokens.css"), "utf8");

const DECL_RE = /(--[\w-]+)\s*:\s*([^;]+);([^\n]*)/g;

const ramps = {}; // name -> { base, primaryStep, steps: { step: hex } }
const neutrals = { gray: {} };
const semanticAliases = {};
const spacing = {};
const radius = {};
const fontFamilies = {};
const typeScale = {};

const rampStep = /^--gds-([a-z]+)-(\d+)$/;
const rampBase = /^--gds-([a-z]+)$/;
const aliasVal = /^var\(--gds-([a-z]+)-(\d+)\)$/;

for (const m of css.matchAll(DECL_RE)) {
  const [, name, rawValue, trail] = m;
  const value = rawValue.trim();
  const comment = (trail.match(/\/\*\s*(.*?)\s*\*\//) || [])[1];

  let mm;
  if ((mm = name.match(/^--gds-space-(\d+)$/))) {
    spacing[mm[1]] = value;
  } else if ((mm = name.match(/^--gds-radius-([a-z0-9]+)$/))) {
    radius[mm[1]] = value;
  } else if ((mm = name.match(/^--font-([a-z]+)$/))) {
    fontFamilies[mm[1]] = value;
  } else if ((mm = name.match(/^--text-([\w-]+)$/))) {
    typeScale[mm[1]] = value;
  } else if ((mm = name.match(rampStep))) {
    const [, ramp, step] = mm;
    if (ramp === "gray") {
      neutrals.gray[step] = value;
    } else {
      ramps[ramp] ??= { steps: {} };
      ramps[ramp].steps[step] = value;
      if (comment && /primary/i.test(comment)) {
        ramps[ramp].primaryStep = Number(step);
        ramps[ramp].note = comment;
      }
    }
  } else if (name === "--gds-black") {
    neutrals.black = value;
  } else if (name === "--gds-white") {
    neutrals.white = value;
  } else if ((mm = name.match(/^--gds-([\w-]+)$/))) {
    // Disambiguate by VALUE, not name shape: `--gds-success` and
    // `--gds-green` are both single-token names, but aliases point at a
    // ramp step via var(); ramp bases carry a literal color.
    const target = value.match(aliasVal);
    if (target) {
      semanticAliases[mm[1]] = { ramp: target[1], step: Number(target[2]) };
    } else if (name.match(rampBase)) {
      const ramp = mm[1];
      ramps[ramp] ??= { steps: {} };
      ramps[ramp].base = value;
    }
  }
}

// Stable key order: ramps/aliases in CSS authoring order is already
// preserved by insertion; sort steps numerically inside each ramp.
const sortedSteps = (steps) =>
  Object.fromEntries(
    Object.entries(steps).sort(([a], [b]) => Number(a) - Number(b)),
  );
for (const r of Object.values(ramps)) r.steps = sortedSteps(r.steps);
neutrals.gray = sortedSteps(neutrals.gray);

const banner = `/**
 * GENERATED FILE — do not edit.
 *
 * Derived from styles/tokens.css by scripts/generate-tokens.mjs.
 * Edit the CSS (the authored source of truth), then run
 * \`pnpm -F @gradeui/core generate\`.
 */

/* eslint-disable */
`;

const lit = (v) => JSON.stringify(v, null, 2);

const out = `${banner}
import type { ColorRamp, SemanticAlias } from "./types";

/** Brand color ramps (--gds-<name>-<step>), keyed by ramp name. */
export const GDS_COLOR_RAMPS = ${lit(ramps)} as const satisfies Record<string, ColorRamp>;

/** Neutral scale: black / white poles + the gray ramp. */
export const GDS_NEUTRALS = ${lit(neutrals)} as const;

/** Semantic aliases (--gds-success …) pointing into the ramps. */
export const GDS_SEMANTIC_ALIASES = ${lit(semanticAliases)} as const satisfies Record<string, SemanticAlias>;

/** Spacing scale (--gds-space-<n>). */
export const GDS_SPACING = ${lit(spacing)} as const;

/** Border radii (--gds-radius-<k>). */
export const GDS_RADIUS = ${lit(radius)} as const;

/** Font stacks (--font-<k>). */
export const GDS_FONT_FAMILIES = ${lit(fontFamilies)} as const;

/** Type scale (--text-<k>), raw values incl. -line / -tracking entries. */
export const GDS_TYPE_SCALE = ${lit(typeScale)} as const;

/** Ramp names in authored order. */
export const GDS_RAMP_NAMES = ${lit(Object.keys(ramps))} as const;
`;

writeFileSync(join(root, "src/tokens.generated.ts"), out);
console.log(
  `[core] tokens.generated.ts: ${Object.keys(ramps).length} ramps, ` +
    `${Object.keys(semanticAliases).length} aliases, ` +
    `${Object.keys(spacing).length} spacing, ${Object.keys(radius).length} radii, ` +
    `${Object.keys(typeScale).length} type-scale entries`,
);
