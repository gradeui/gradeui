/**
 * Theme generator — the one true source for producing themes.
 *
 * Takes a compact ThemeInput (hues + a handful of presets) and returns a
 * fully resolved GeneratedTheme with three OKLCH color ramps, semantic
 * tokens for all four brightness modes, and concrete values for typography,
 * radius, spacing, and effects.
 *
 * Every theme in the system — built-in or user-built — flows through here.
 * Built-ins are just curated ThemeInputs; user themes live in localStorage
 * as ThemeInputs and get re-generated on load.
 */

import {
  FIXED_SEMANTIC,
  hueToRamp,
  neutralRamp,
  PURE_BLACK,
  PURE_WHITE,
  type ModeName,
  type OKLCHTriplet,
  type Ramp,
  type RampKey,
} from "./oklch";
import {
  FONTS,
  type ChartPalette,
  type ColorIntensity,
  type FontKey,
  type GeneratedColorsMode,
  type GeneratedEffects,
  type GeneratedRadius,
  type GeneratedSpacing,
  type GeneratedTheme,
  type GeneratedTypography,
  type RadiusStyle,
  type ShadowIntensity,
  type SpacingDensity,
  type ThemeInput,
  type TypeScalePreset,
} from "./types";

const ALL_MODES: ModeName[] = ["superLight", "light", "dark", "superDark"];

/** Global chroma multipliers — applied on top of per-ramp chroma scales. */
const INTENSITY_MULTIPLIER: Record<ColorIntensity, number> = {
  muted: 0.6,
  default: 1,
  vibrant: 1.3,
};

/**
 * Build the 5-stop chart palette derived from theme hues. The 5 stops are
 * tuned to be visually distinct but tonally cohesive — they reuse the
 * theme's primary, accent, and neutral, then fill the remaining slots with
 * hue-rotated variants of the primary so the series stay in the theme's
 * family. Lightness lands around 0.55 so colors read well in both light
 * and dark mode without needing a dark variant (charts rarely swap per
 * mode in practice).
 */
function buildChartPalette(
  hues: { neutral: number; primary: number; accent: number },
  chroma: { primary: number; accent: number },
  intensity: number
): ChartPalette {
  const pC = chroma.primary * intensity;
  const aC = chroma.accent * intensity;
  // Baseline chroma for the derived slots — sits between primary + accent.
  const dC = ((pC + aC) / 2) * 0.8;
  const norm = (h: number) => ((h % 360) + 360) % 360;
  // Order matters: chart-1 is the hero (primary), then two hue-rotated
  // variants for maximum visual distinction, then neutral, and accent
  // ends the series. Keeps adjacent series colors from blending —
  // accent next to primary can look nearly identical when hues are close.
  return {
    1: `0.600 ${(0.17 * pC).toFixed(4)} ${hues.primary.toFixed(2)}`,
    2: `0.640 ${(0.17 * dC).toFixed(4)} ${norm(hues.primary + 140).toFixed(2)}`,
    3: `0.580 ${(0.17 * dC).toFixed(4)} ${norm(hues.primary + 220).toFixed(2)}`,
    4: `0.510 0.0250 ${hues.neutral.toFixed(2)}`,
    5: `0.620 ${(0.17 * aC).toFixed(4)} ${hues.accent.toFixed(2)}`,
  };
}

/**
 * Per-mode mapping from semantic token → ramp step.
 * "neutral" picks from the neutral ramp, "primary" from primary, "accent"
 * from accent. Special values PURE_WHITE / PURE_BLACK bypass the ramps.
 */
type TokenRef =
  | { source: "neutral" | "primary" | "accent"; step: RampKey }
  | { source: "pure"; value: OKLCHTriplet };

const n = (step: RampKey): TokenRef => ({ source: "neutral", step });
const p = (step: RampKey): TokenRef => ({ source: "primary", step });
const a = (step: RampKey): TokenRef => ({ source: "accent", step });
const PURE = (value: OKLCHTriplet): TokenRef => ({ source: "pure", value });

interface TokenMap {
  background: TokenRef;
  foreground: TokenRef;
  card: TokenRef;
  cardForeground: TokenRef;
  popover: TokenRef;
  popoverForeground: TokenRef;
  primary: TokenRef;
  primaryForeground: TokenRef;
  secondary: TokenRef;
  secondaryForeground: TokenRef;
  muted: TokenRef;
  mutedForeground: TokenRef;
  accent: TokenRef;
  accentForeground: TokenRef;
  border: TokenRef;
  input: TokenRef;
  ring: TokenRef;
}

/**
 * The mapping that makes each mode feel like itself. This is the heart of
 * the 4-mode system — tune these if a mode ends up too dim / too bright.
 */
const MODE_TOKENS: Record<ModeName, TokenMap> = {
  superLight: {
    // Airy: low contrast foreground, off-white surfaces, richer primary to stand out.
    background: n(50),
    foreground: n(800),
    card: PURE(PURE_WHITE),
    cardForeground: n(800),
    popover: PURE(PURE_WHITE),
    popoverForeground: n(800),
    primary: p(600),
    primaryForeground: p(50),
    secondary: n(100),
    secondaryForeground: n(700),
    muted: n(100),
    mutedForeground: n(500),
    accent: a(600),
    accentForeground: a(50),
    border: n(200),
    input: n(200),
    ring: p(500),
  },
  light: {
    // Standard light.
    background: n(50),
    foreground: n(950),
    card: PURE(PURE_WHITE),
    cardForeground: n(950),
    popover: PURE(PURE_WHITE),
    popoverForeground: n(950),
    primary: p(500),
    primaryForeground: p(50),
    secondary: n(100),
    secondaryForeground: n(700),
    muted: n(100),
    mutedForeground: n(500),
    accent: a(500),
    accentForeground: a(50),
    border: n(200),
    input: n(200),
    ring: p(500),
  },
  dark: {
    // Standard dark.
    background: n(950),
    foreground: n(50),
    card: n(900),
    cardForeground: n(50),
    popover: n(900),
    popoverForeground: n(50),
    primary: p(400),
    primaryForeground: p(950),
    secondary: n(800),
    secondaryForeground: n(200),
    muted: n(800),
    mutedForeground: n(400),
    accent: a(400),
    accentForeground: a(950),
    border: n(800),
    input: n(800),
    ring: p(400),
  },
  superDark: {
    // OLED-deep: pure black surface, brighter primary, tighter borders.
    background: PURE(PURE_BLACK),
    foreground: n(100),
    card: n(950),
    cardForeground: n(100),
    popover: n(950),
    popoverForeground: n(100),
    primary: p(300),
    primaryForeground: p(950),
    secondary: n(900),
    secondaryForeground: n(300),
    muted: n(900),
    mutedForeground: n(500),
    accent: a(300),
    accentForeground: a(950),
    border: n(900),
    input: n(900),
    ring: p(300),
  },
};

function resolveToken(
  ref: TokenRef,
  ramps: { neutral: Ramp; primary: Ramp; accent: Ramp }
): OKLCHTriplet {
  if (ref.source === "pure") return ref.value;
  return ramps[ref.source][ref.step];
}

function deriveColorsForMode(
  ramps: { neutral: Ramp; primary: Ramp; accent: Ramp },
  mode: ModeName
): GeneratedColorsMode {
  const map = MODE_TOKENS[mode];
  // Fixed semantic colors don't change with the brand hue — they use the
  // light/dark set because the 4 modes split cleanly into "has light bg"
  // and "has dark bg" for contrast purposes.
  const isLightBg = mode === "superLight" || mode === "light";
  const fixed = isLightBg ? FIXED_SEMANTIC.light : FIXED_SEMANTIC.dark;

  return {
    background: resolveToken(map.background, ramps),
    foreground: resolveToken(map.foreground, ramps),
    card: resolveToken(map.card, ramps),
    cardForeground: resolveToken(map.cardForeground, ramps),
    popover: resolveToken(map.popover, ramps),
    popoverForeground: resolveToken(map.popoverForeground, ramps),
    primary: resolveToken(map.primary, ramps),
    primaryForeground: resolveToken(map.primaryForeground, ramps),
    secondary: resolveToken(map.secondary, ramps),
    secondaryForeground: resolveToken(map.secondaryForeground, ramps),
    muted: resolveToken(map.muted, ramps),
    mutedForeground: resolveToken(map.mutedForeground, ramps),
    accent: resolveToken(map.accent, ramps),
    accentForeground: resolveToken(map.accentForeground, ramps),
    border: resolveToken(map.border, ramps),
    input: resolveToken(map.input, ramps),
    ring: resolveToken(map.ring, ramps),
    destructive: fixed.destructive,
    destructiveForeground: fixed.destructiveFg,
    success: fixed.success,
    warning: fixed.warning,
    info: fixed.info,
    highlight: fixed.highlight,
  };
}

/* ─────────────────────────── Typography ─────────────────────────── */

/** Base type ladder (the "default" scale). Other scales multiply these. */
const BASE_SCALE = {
  display: 3.75, // rem
  h1: 2.5,
  h2: 2,
  h3: 1.5,
  h4: 1.25,
  h5: 1.125,
  h6: 1,
  body: 1,
  bodySm: 0.875,
};

const SCALE_MULTIPLIER: Record<TypeScalePreset, number> = {
  compact: 0.85,
  default: 1,
  spacious: 1.18,
};

function resolveTypography(
  input: ThemeInput["typography"]
): GeneratedTypography {
  const mult = SCALE_MULTIPLIER[input.scale];
  const rem = (n: number) => `${(n * mult).toFixed(3)}rem`;
  return {
    fontSans: FONTS[input.body],
    fontMono: FONTS[input.mono],
    fontDisplay: FONTS[input.display],
    headingWeight: input.headingWeight ?? 600,
    bodyWeight: input.bodyWeight ?? 400,
    headingTracking: input.headingTracking ?? "-0.01em",
    scale: {
      display: rem(BASE_SCALE.display),
      h1: rem(BASE_SCALE.h1),
      h2: rem(BASE_SCALE.h2),
      h3: rem(BASE_SCALE.h3),
      h4: rem(BASE_SCALE.h4),
      h5: rem(BASE_SCALE.h5),
      h6: rem(BASE_SCALE.h6),
      body: rem(BASE_SCALE.body),
      bodySm: rem(BASE_SCALE.bodySm),
    },
  };
}

/* ─────────────────────────── Radius ─────────────────────────── */

/**
 * Each preset defines the "base" radius (what --radius resolves to). The
 * sm/md/lg/xl/2xl derive from it. "pill" snaps the base reasonably low
 * (components like buttons override to full-pill via data-button-shape).
 */
const RADIUS_BASE: Record<RadiusStyle, number> = {
  sharp: 0,
  subtle: 0.25, // rem
  soft: 0.5,
  round: 0.875,
  pill: 1.25, // components override as needed
};

function resolveRadius(input: ThemeInput["radius"]): GeneratedRadius {
  const base = RADIUS_BASE[input.style];
  const r = (n: number) => `${n.toFixed(3)}rem`;
  return {
    base: r(base),
    sm: r(Math.max(0, base - 0.25)),
    md: r(base),
    lg: r(base + 0.25),
    xl: r(base + 0.5),
    "2xl": r(base + 1),
    full: "9999px",
  };
}

/* ─────────────────────────── Spacing ─────────────────────────── */

const DENSITY_FACTOR: Record<SpacingDensity, number> = {
  tight: 0.85,
  default: 1,
  roomy: 1.2,
};

function resolveSpacing(input: ThemeInput["spacing"]): GeneratedSpacing {
  return {
    baseUnit: "1rem",
    densityFactor: DENSITY_FACTOR[input.density],
  };
}

/* ─────────────────────────── Effects ─────────────────────────── */

const SHADOW_PRESETS: Record<ShadowIntensity, GeneratedEffects["shadows"]> = {
  none: {
    sm: "none",
    md: "none",
    lg: "none",
    xl: "none",
    "2xl": "none",
    inner: "none",
  },
  subtle: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.03)",
    md: "0 2px 4px -1px rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.03)",
    lg: "0 6px 14px -2px rgb(0 0 0 / 0.05)",
    xl: "0 12px 24px -4px rgb(0 0 0 / 0.06)",
    "2xl": "0 24px 48px -12px rgb(0 0 0 / 0.12)",
    inner: "inset 0 1px 2px 0 rgb(0 0 0 / 0.03)",
  },
  default: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },
  dramatic: {
    sm: "0 2px 4px 0 rgb(0 0 0 / 0.12)",
    md: "0 8px 16px -2px rgb(0 0 0 / 0.18), 0 4px 8px -4px rgb(0 0 0 / 0.12)",
    lg: "0 20px 32px -4px rgb(0 0 0 / 0.22), 0 8px 16px -8px rgb(0 0 0 / 0.18)",
    xl: "0 32px 48px -6px rgb(0 0 0 / 0.28), 0 12px 24px -10px rgb(0 0 0 / 0.22)",
    "2xl": "0 48px 80px -16px rgb(0 0 0 / 0.45)",
    inner: "inset 0 4px 8px 0 rgb(0 0 0 / 0.1)",
  },
};

function resolveEffects(input: ThemeInput["effects"]): GeneratedEffects {
  const preset = input?.shadows ?? "default";
  const intensity = input?.motionIntensity ?? 1;
  const scale = (ms: number) => `${Math.round(ms * intensity)}ms`;
  return {
    shadows: SHADOW_PRESETS[preset],
    motion: {
      fast: scale(150),
      base: scale(200),
      slow: scale(300),
      slower: scale(500),
    },
    borderWidth: input?.borderWidth ?? "1px",
  };
}

/* ─────────────────────────── Main generator ─────────────────────────── */

/**
 * Turn a compact ThemeInput into a fully resolved GeneratedTheme.
 * Pure function — safe to run on the client, server, or at build time.
 */
export function generateTheme(input: ThemeInput): GeneratedTheme {
  // 0. Global intensity multiplier — flips everything muted/default/vibrant.
  const intensity = INTENSITY_MULTIPLIER[input.intensity ?? "default"];

  // 1. Build the three base ramps — per-ramp chroma scales multiply by the
  // global intensity so muted/vibrant affect everything cohesively.
  const pureGray = input.neutralPureGray ?? false;
  const neutralChroma = (input.chroma?.neutral ?? 0.08) * intensity;
  const primaryChroma = (input.chroma?.primary ?? 1) * intensity;
  const accentChroma = (input.chroma?.accent ?? 1) * intensity;

  const neutral = pureGray
    ? neutralRamp()
    : hueToRamp({ hue: input.hues.neutral, chromaScale: neutralChroma });
  const primary = hueToRamp({ hue: input.hues.primary, chromaScale: primaryChroma });
  const accent = hueToRamp({ hue: input.hues.accent, chromaScale: accentChroma });

  const ramps = { neutral, primary, accent };

  const chart = buildChartPalette(
    input.hues,
    { primary: primaryChroma, accent: accentChroma },
    intensity
  );

  // 2. Derive semantic tokens for all four modes
  const colors = Object.fromEntries(
    ALL_MODES.map((mode) => [mode, deriveColorsForMode(ramps, mode)])
  ) as Record<ModeName, GeneratedColorsMode>;

  // 3. Resolve non-color config into concrete CSS values
  const typography = resolveTypography(input.typography);
  const radius = resolveRadius(input.radius);
  const spacing = resolveSpacing(input.spacing);
  const effects = resolveEffects(input.effects);

  // 4. Apply component defaults
  const components: GeneratedTheme["components"] = {
    buttonShape: input.components?.buttonShape ?? "default",
    inputStyle: input.components?.inputStyle ?? "outlined",
    cardStyle: input.components?.cardStyle ?? "flat",
  };

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    tagline: input.tagline,
    input,
    ramps,
    colors,
    chart,
    typography,
    radius,
    spacing,
    effects,
    components,
  };
}
