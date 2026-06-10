/**
 * Primitive-token types for @gradeui/core.
 *
 * The data itself lives in tokens.generated.ts (derived from
 * styles/tokens.css). These types describe its shape for consumers:
 * the Studio theme picker (choose a primary / secondary / neutral
 * palette), the variable viewer (table of ramps with per-step override),
 * and the BYODS registry's theme field.
 */

/** A brand color ramp: 50→950 steps plus an unsuffixed base alias. */
export interface ColorRamp {
  /** Value of the unsuffixed `--gds-<name>` variable (the hero shade). */
  base?: string;
  /** Step the brand considers "the" color (the `/* Primary … *​/`-commented
   *  declaration in tokens.css). Picker swatches lead with this. */
  primaryStep?: number;
  /** The comment text carried by the primary step, e.g. "Primary brand green". */
  note?: string;
  /** step → hex, sorted ascending (50…950). Not every ramp spans the full
   *  range — yellow/orange/red/navy/blue stop at 900. */
  steps: Readonly<Record<string, string>>;
}

/** A semantic alias (--gds-success → green/600): points INTO a ramp rather
 *  than carrying its own value, so overriding a ramp step re-skins every
 *  alias that references it. */
export interface SemanticAlias {
  ramp: string;
  step: number;
}
