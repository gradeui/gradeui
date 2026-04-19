/**
 * OKLCH ramp generation.
 *
 * OKLCH (Oklab in cylindrical coords) is a perceptually uniform color space —
 * the same `L` value looks equally light across all hues, which HSL does not
 * give you. That makes it ideal for generating color ramps programmatically:
 * pin the L curve, vary the hue, and every ramp looks like a sibling.
 *
 * We output space-separated `"L C H"` triplets (not `oklch(L C H)` strings),
 * because the CSS variables are consumed via Tailwind as
 *   `oklch(var(--primary) / <alpha-value>)`
 * which needs the bare components inside the function call to get the
 * `/alpha` shortcut (`bg-primary/50`) working.
 */

/** One of four brightness modes the theme system supports. */
export type ModeName = "superLight" | "light" | "dark" | "superDark";

/** A bare OKLCH triplet — "L C H" space-separated. Consumed inside oklch(). */
export type OKLCHTriplet = string;

/** A full 11-stop color ramp, Tailwind-style. */
export interface Ramp {
  50: OKLCHTriplet;
  100: OKLCHTriplet;
  200: OKLCHTriplet;
  300: OKLCHTriplet;
  400: OKLCHTriplet;
  500: OKLCHTriplet;
  600: OKLCHTriplet;
  700: OKLCHTriplet;
  800: OKLCHTriplet;
  900: OKLCHTriplet;
  950: OKLCHTriplet;
}

export type RampKey = keyof Ramp;

export const RAMP_KEYS: RampKey[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/**
 * Lightness curve across the 11-stop ramp. Index matches RAMP_KEYS order
 * (0 → L for stop 50, 10 → L for stop 950). Chosen so that:
 *   - Adjacent steps are perceptually distinct
 *   - Step 500 lands around the "canonical" brand-base lightness (0.60)
 *   - Step 50 is near-white without being pure white (keeps a hint of hue)
 *   - Step 950 is near-black without being pure black (same)
 *
 * These values are mode-agnostic — the same ramp is used in every mode.
 * What changes per mode is which stop maps to which semantic token (see
 * generator.ts / MODE_TOKEN_MAP).
 */
const LIGHTNESS_CURVE: readonly number[] = [
  0.985, // 50
  0.955, // 100
  0.895, // 200
  0.820, // 300
  0.720, // 400
  0.610, // 500 — base
  0.510, // 600
  0.415, // 700
  0.325, // 800
  0.245, // 900
  0.170, // 950
];

/**
 * Chroma curve. Peaks in the middle of the ramp (around 500-600, where
 * sRGB gamut allows the most saturation) and tapers at the extremes.
 * Multiplied by the `chromaScale` at call time so we can dial neutrals
 * down to near-gray without changing the shape.
 */
const CHROMA_CURVE: readonly number[] = [
  0.015, // 50
  0.040, // 100
  0.075, // 200
  0.110, // 300
  0.140, // 400
  0.170, // 500 — peak
  0.170, // 600 — peak
  0.150, // 700
  0.120, // 800
  0.080, // 900
  0.040, // 950
];

/** Arguments to hueToRamp. */
export interface HueToRampOptions {
  /** Hue in degrees, 0–360. */
  hue: number;
  /**
   * Multiplier on the default chroma curve. Defaults to 1.
   *   - Neutrals: ~0.06–0.12 (subtle tint toward the hue)
   *   - Standard brand: 1.0
   *   - Muted / desaturated: 0.5–0.7
   *   - Vibrant: 1.1–1.3 (may fall outside sRGB at high L, but browsers clip)
   */
  chromaScale?: number;
}

/**
 * Generate an 11-stop ramp from a single hue.
 *
 * The output is mode-agnostic: each stop gets the same lightness and chroma
 * regardless of which mode the theme ends up being applied in. The mode
 * selects which stops are used for semantic tokens (see generator).
 */
export function hueToRamp({ hue, chromaScale = 1 }: HueToRampOptions): Ramp {
  const normalizedHue = ((hue % 360) + 360) % 360; // clamp to 0–360
  const ramp = {} as Ramp;
  for (let i = 0; i < RAMP_KEYS.length; i++) {
    const L = LIGHTNESS_CURVE[i];
    const C = CHROMA_CURVE[i] * chromaScale;
    ramp[RAMP_KEYS[i]] = `${L.toFixed(4)} ${C.toFixed(4)} ${normalizedHue.toFixed(2)}`;
  }
  return ramp;
}

/**
 * Build a fully neutral (achromatic) ramp — chroma forced to zero.
 * Used when the user picks "pure gray" for the neutral axis.
 */
export function neutralRamp(): Ramp {
  const ramp = {} as Ramp;
  for (let i = 0; i < RAMP_KEYS.length; i++) {
    const L = LIGHTNESS_CURVE[i];
    ramp[RAMP_KEYS[i]] = `${L.toFixed(4)} 0 0`;
  }
  return ramp;
}

/**
 * Fixed OKLCH triplets for semantic colors that should NOT vary with the
 * brand hue (for accessibility and convention). Tuned to look equally
 * balanced on light and dark backgrounds.
 */
export const FIXED_SEMANTIC: Record<"light" | "dark", {
  destructive: OKLCHTriplet;
  destructiveFg: OKLCHTriplet;
  success: OKLCHTriplet;
  warning: OKLCHTriplet;
  info: OKLCHTriplet;
  highlight: OKLCHTriplet;
}> = {
  light: {
    destructive: "0.560 0.220 27.0", // red
    destructiveFg: "0.990 0.005 27.0",
    success: "0.610 0.180 145.0", // green
    warning: "0.720 0.180 60.0", // orange
    info: "0.580 0.200 240.0", // blue
    highlight: "0.860 0.180 95.0", // yellow
  },
  dark: {
    destructive: "0.680 0.220 27.0",
    destructiveFg: "0.990 0.005 27.0",
    success: "0.720 0.180 145.0",
    warning: "0.800 0.180 60.0",
    info: "0.700 0.200 240.0",
    highlight: "0.880 0.180 95.0",
  },
};

/** Absolute-white/black OKLCH triplets, used for card/popover surfaces. */
export const PURE_WHITE: OKLCHTriplet = "1 0 0";
export const PURE_BLACK: OKLCHTriplet = "0 0 0";
