/**
 * @gradeui/core — Grade Design System foundations.
 *
 * Layers 1–2 of the token model (STUDIO-BYODS.md "Tokens: the layering
 * rule"): primitive color ramps, neutral grays, semantic aliases, spacing,
 * radii, font stacks, and the type scale — as both CSS and typed data.
 *
 *   - CSS: `@import "@gradeui/core/tokens.css"` (the authored source of
 *     truth; @gradeui/ui's globals.css and apps/docs both import it).
 *   - Data: the GDS_* exports below, generated from the CSS by
 *     scripts/generate-tokens.mjs. Feeds the Studio theme picker
 *     (primary / secondary / neutral palette choice), the variable
 *     viewer, and the BYODS registry's theme field.
 *
 * Component tokens (--gds-carousel-* …) intentionally do NOT live here —
 * they are part of each component's contract and ship with @gradeui/ui.
 *
 * Still to migrate (per the original scaffold plan): the theme engine
 * (lib/themes/* from @gradeui/ui) and `cn`.
 */

export type { ColorRamp, SemanticAlias } from "./types";
export type { ModularScale, TypeSizeName } from "./modular-scales";
export {
  GDS_MODULAR_SCALES,
  GDS_TYPE_SIZE_NAMES,
  GDS_TYPE_SIZE_STEPS,
  modularRamp,
  modularStep,
  modularTypeSizes,
} from "./modular-scales";
export {
  GDS_COLOR_RAMPS,
  GDS_NEUTRALS,
  GDS_SEMANTIC_ALIASES,
  GDS_SPACING,
  GDS_RADIUS,
  GDS_FONT_FAMILIES,
  GDS_TYPE_SCALE,
  GDS_RAMP_NAMES,
} from "./tokens.generated";
