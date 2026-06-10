/**
 * Modular scales — the musical-interval ratios used to GENERATE type and
 * size ramps from a base value, instead of hand-picking every step.
 *
 * The idea (classic typographic practice, popularised by Tim Brown's
 * "More Meaningful Typography" and tools like type-scale.com): pick a
 * base size and a ratio; each step up multiplies by the ratio. The
 * ratios carry musical interval names because they're literally the
 * frequency ratios of those intervals.
 *
 * Hand-authored data (not generated from tokens.css — today's type scale
 * in tokens.css is a hand-tuned ladder, roughly a major-third feel). The
 * theme generator's current "compact | default | spacious" flat
 * multiplier is the consumer to upgrade: `typography.scale` grows a
 * ratio-based variant so a theme can say "perfect fourth from 1rem" and
 * get the whole --text-* ladder derived. Same mechanism applies to a
 * future SIZE ramp (spacing/control sizing) — one base, one ratio.
 */

export interface ModularScale {
  /** Musical interval name (canonical id). */
  id: string;
  /** Display label. */
  label: string;
  /** Step multiplier. */
  ratio: number;
  /** One-line feel description for pickers. */
  feel: string;
}

export const GDS_MODULAR_SCALES = [
  { id: "minor-second", label: "Minor second", ratio: 1.067, feel: "Barely-there steps; dense data UIs" },
  { id: "major-second", label: "Major second", ratio: 1.125, feel: "Quiet, compact; documentation" },
  { id: "minor-third", label: "Minor third", ratio: 1.2, feel: "Comfortable default; product UI" },
  { id: "major-third", label: "Major third", ratio: 1.25, feel: "Clear hierarchy; close to the current Grade ladder" },
  { id: "perfect-fourth", label: "Perfect fourth", ratio: 1.333, feel: "Editorial confidence; content sites" },
  { id: "augmented-fourth", label: "Augmented fourth", ratio: 1.414, feel: "Dramatic; bold marketing" },
  { id: "perfect-fifth", label: "Perfect fifth", ratio: 1.5, feel: "Big swings; hero-led landing pages" },
  { id: "golden-ratio", label: "Golden ratio", ratio: 1.618, feel: "Maximum drama; display typography" },
] as const satisfies readonly ModularScale[];

/** Derive an n-step ascending ramp from a base value (rem) and a ratio.
 *  Steps are rounded to 3 decimals — stable enough for CSS, readable in
 *  a variables viewer. Step 0 is the base. */
export function modularRamp(baseRem: number, ratio: number, steps: number): number[] {
  return Array.from({ length: steps }, (_, i) =>
    Math.round(baseRem * Math.pow(ratio, i) * 1000) / 1000,
  );
}

/**
 * Middle-out ladder (the Utopia model — utopia.fyi/type/calculator):
 * start at the BODY size in the middle, multiply UP by the ratio for
 * headings, multiply DOWN by the reciprocal for small text, and floor
 * descending steps at `minRem` so captions never become unreadable.
 *
 * `step(k)` for any integer k: positive = up the ladder, negative = down
 * (floored). Utopia's other half — fluidly interpolating between a small-
 * viewport scale and a large-viewport scale via clamp() — layers on top
 * of this: build two ladders and clamp between them per step.
 */
export function modularStep(
  baseRem: number,
  ratio: number,
  k: number,
  minRem = 0.75,
): number {
  const raw = baseRem * Math.pow(ratio, k);
  const floored = k < 0 ? Math.max(minRem, raw) : raw;
  return Math.round(floored * 1000) / 1000;
}

/**
 * The named type-size ladder — Tailwind's size vocabulary with `base`
 * sitting MID-ladder (step 0), not at the bottom. Descending names step
 * down by the reciprocal (floored), ascending names step up by the ratio.
 * This is the vocabulary a generated scale populates: Tailwind v4's
 * font-size utilities read `--text-<name>` theme variables, so emitting
 * these from a ratio re-scales every text utility in one move.
 */
export const GDS_TYPE_SIZE_NAMES = [
  "2xs", "xs", "sm", "base", "lg", "xl",
  "2xl", "3xl", "4xl", "5xl", "6xl", "7xl",
] as const;

export type TypeSizeName = (typeof GDS_TYPE_SIZE_NAMES)[number];

/** Ladder offsets relative to `base` (step 0). */
export const GDS_TYPE_SIZE_STEPS: Record<TypeSizeName, number> = {
  "2xs": -3, xs: -2, sm: -1, base: 0, lg: 1, xl: 2,
  "2xl": 3, "3xl": 4, "4xl": 5, "5xl": 6, "6xl": 7, "7xl": 8,
};

/** Generate the full named ladder from a base size and ratio (rem values,
 *  descending steps floored at `minRem`). */
export function modularTypeSizes(
  baseRem: number,
  ratio: number,
  minRem = 0.625,
): Record<TypeSizeName, number> {
  return Object.fromEntries(
    GDS_TYPE_SIZE_NAMES.map((name) => [
      name,
      modularStep(baseRem, ratio, GDS_TYPE_SIZE_STEPS[name], minRem),
    ]),
  ) as Record<TypeSizeName, number>;
}
