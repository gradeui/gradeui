/**
 * Control schema — the canonical, UI-agnostic descriptor for a shader's
 * (or effect layer's) tweakable parameters. Shared by base demos AND the
 * universal post stack, so a single `<ShaderControls schema={...} />`
 * renders any of them.
 *
 * Ported from the three-lab experiments (the proven shape) and extended
 * with two controls from the Paper reference — `segmented` and
 * `colorList` (Paper's colorCount) — plus an optional palette-slot
 * binding on `color` (the "Line colour → accent" affordance).
 *
 * Kept free of three.js / React imports so post-stack.ts and any other
 * renderer can depend on it without a circular import.
 */

/** Global palette slots a colour control can bind to. */
export type PaletteSlot = "primary" | "secondary" | "accent" | "background";

export type NumberControl = {
  type: "slider";
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Display unit appended in the readout (e.g. "px", "°", "%"). */
  unit?: string;
};

export type ColorControl = {
  type: "color";
  key: string;
  label: string;
  default: string;
  /** When set, the control FOLLOWS this palette slot (re-tints with the
   *  theme, shows a "→ accent" affordance) until the user overrides it. */
  slot?: PaletteSlot;
};

/** A variable-length list of colours — Paper's colorCount + swatches. */
export type ColorListControl = {
  type: "colorList";
  key: string;
  label: string;
  default: string[];
  /** Min / max swatches the user can add. */
  min?: number;
  max?: number;
};

export type ToggleControl = {
  type: "toggle";
  key: string;
  label: string;
  default: boolean;
};

export type SelectControl = {
  type: "select";
  key: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  default: string;
};

/** Same data as a select, rendered as a segmented toggle (≤4 options). */
export type SegmentedControl = {
  type: "segmented";
  key: string;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  default: string;
};

export type DividerControl = {
  type: "divider";
  key: string;
  /** Optional section heading above the divider line. */
  label?: string;
};

export type ControlSpec =
  | NumberControl
  | ColorControl
  | ColorListControl
  | ToggleControl
  | SelectControl
  | SegmentedControl
  | DividerControl;

/** A flat bag of current values, keyed by ControlSpec.key. */
export type DemoState = Record<string, number | string | boolean | string[]>;

/** Build the default state object from a control schema. */
export function defaultsOf(controls: readonly ControlSpec[]): DemoState {
  const out: DemoState = {};
  for (const c of controls) {
    if (c.type === "divider") continue;
    out[c.key] = c.default;
  }
  return out;
}

// Typed getters with fallbacks. Renderer code reads state via these.
export function getNum(s: DemoState, k: string, d: number): number {
  const v = s[k];
  return typeof v === "number" ? v : d;
}
export function getStr(s: DemoState, k: string, d: string): string {
  const v = s[k];
  return typeof v === "string" ? v : d;
}
export function getBool(s: DemoState, k: string, d: boolean): boolean {
  const v = s[k];
  return typeof v === "boolean" ? v : d;
}
export function getColors(s: DemoState, k: string, d: string[]): string[] {
  const v = s[k];
  return Array.isArray(v) ? v : d;
}
