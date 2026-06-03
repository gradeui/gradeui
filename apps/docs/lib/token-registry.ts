/**
 * token-registry — scoped design tokens for the inspector's TokenField
 * controls.
 *
 * Each property AREA (radius, shadow, opacity, fill, spacing…) exposes
 * the set of tokens that may be bound there — the Figma "variables
 * scoped to corner radius" model. TokenField consumers render these
 * lists; nothing else in the inspector hand-rolls token options.
 *
 * Tailwind-first: today every token maps 1:1 to a Tailwind class /
 * theme value, because Tailwind classes are Studio's output format.
 * The shape is deliberately backend-agnostic though — `value` is a
 * canonical key and `label` / `hint` / `swatchClass` are presentation —
 * so a future DTCG / theme-token backend (see STUDIO-FILLS.md's token
 * picker plan) can replace the internals of `getAreaTokens` without any
 * consumer changing.
 */

import {
  RADIUS_SCALE,
  SHADOW_SCALE,
  OPACITY_SCALE,
  GAP_SCALE,
  PADDING_SCALE,
  MARGIN_SCALE,
  FILL_COLOR_TOKENS,
  FONT_SIZE_SCALE,
} from "@/lib/tailwind-classes";

export type TokenArea =
  | "radius"
  | "shadow"
  | "opacity"
  | "fill"
  | "gap"
  | "padding"
  | "margin"
  | "fontSize";

export interface RegistryToken {
  /** Canonical token key ("" = the scale's unsuffixed default token). */
  value: string;
  /** Display label — today, the Tailwind class name. */
  label: string;
  /** Resolved-value readout shown right-aligned in pickers ("6px", "50%"). */
  hint?: string;
  /** Tailwind bg-* class for colour swatches (fill area only). */
  swatchClass?: string;
}

/** Resolved readout for the radius keyword scale — px-suffixed: this
 *  panel is for designers, and "6px" reads as a real measurement where
 *  a bare "6" reads as a mystery step. (sm/md/lg are theme-driven via
 *  --radius at runtime; these are the defaults shown as orientation.) */
export const RADIUS_PX: Record<string, string> = {
  none: "0px",
  sm: "2px",
  "": "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  // Tailwind's pill radius — a huge literal, but the truthful readout
  // (every menu row carries its resolved value; a blank one reads broken).
  full: "9999px",
};

/** Resolved readout for the font-size keyword scale — px-suffixed,
 *  same designer-first convention as RADIUS_PX. */
export const FONT_SIZE_PX: Record<string, string> = {
  "2xs": "11px",
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
  "5xl": "48px",
};

/** Theme colour swatch classes for the fill area. Literal strings so
 *  Tailwind's scanner keeps them in the build. */
const FILL_SWATCH_CLASS: Record<string, string> = {
  background: "bg-background",
  card: "bg-card",
  muted: "bg-muted",
  secondary: "bg-secondary",
  accent: "bg-accent",
  primary: "bg-primary",
  destructive: "bg-destructive",
  transparent: "bg-transparent",
};

/**
 * The scoped token list for a property area. The single seam where a
 * different token backend would plug in.
 */
export function getAreaTokens(area: TokenArea): RegistryToken[] {
  switch (area) {
    case "radius":
      return RADIUS_SCALE.map((r) => ({
        value: r,
        label: r === "" ? "rounded" : `rounded-${r}`,
        hint: RADIUS_PX[r],
      }));
    case "shadow":
      return SHADOW_SCALE.map((s) => ({
        value: s,
        label: s === "none" ? "shadow-none" : s === "" ? "shadow" : `shadow-${s}`,
      }));
    case "opacity":
      return OPACITY_SCALE.map((n) => ({
        value: String(n),
        label: `opacity-${n}`,
        hint: `${n}%`,
      }));
    case "fill":
      return FILL_COLOR_TOKENS.map((t) => ({
        value: t,
        label: t,
        swatchClass: FILL_SWATCH_CLASS[t],
      }));
    case "gap":
      return GAP_SCALE.map((n) => ({
        value: String(n),
        label: `gap-${n}`,
        hint: `${n * 4}px`,
      }));
    case "padding":
      return PADDING_SCALE.map((n) => ({
        value: String(n),
        label: `p-${n}`,
        hint: `${n * 4}px`,
      }));
    case "margin":
      return MARGIN_SCALE.map((n) => ({
        value: String(n),
        label: `m-${n}`,
        hint: `${n * 4}px`,
      }));
    case "fontSize":
      return FONT_SIZE_SCALE.map((s) => ({
        value: s,
        label: `text-${s}`,
        hint: FONT_SIZE_PX[s],
      }));
  }
}
