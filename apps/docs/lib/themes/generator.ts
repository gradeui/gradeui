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
  deriveAlertPair,
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
  type TypeScale,
  type TypeScalePreset,
  type ModularScaleId,
} from "./types";
import {
  GDS_MODULAR_SCALES,
  GDS_TYPE_SIZE_NAMES,
  modularTypeSizes,
  type TypeSizeName,
} from "@gradeui/core";

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

    // `-soft` / `-deep` derivatives are computed per mode from the base
    // status triplet. The "alert mode" only distinguishes light vs. dark;
    // superLight and superDark collapse onto the same pair as their
    // neighbour because the tinted alert surface doesn't need more than two
    // contrast-calibrated variants.
    ...(() => {
      const alertMode: "light" | "dark" = isLightBg ? "light" : "dark";
      const d = deriveAlertPair(fixed.destructive, alertMode);
      const s = deriveAlertPair(fixed.success, alertMode);
      const w = deriveAlertPair(fixed.warning, alertMode);
      const i = deriveAlertPair(fixed.info, alertMode);
      const hi = deriveAlertPair(fixed.highlight, alertMode);
      return {
        destructiveSoft: d.soft,
        destructiveDeep: d.deep,
        successSoft: s.soft,
        successDeep: s.deep,
        warningSoft: w.soft,
        warningDeep: w.deep,
        infoSoft: i.soft,
        infoDeep: i.deep,
        highlightSoft: hi.soft,
        highlightDeep: hi.deep,
      };
    })(),
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

/** Ratio lookup for the modular scales (mirrors GDS_MODULAR_SCALES). */
const MODULAR_RATIOS = Object.fromEntries(
  GDS_MODULAR_SCALES.map((s) => [s.id, s.ratio])
) as Record<ModularScaleId, number>;

/* ── Phase B guards (THEME-MIGRATION.md B5) ──────────────────────────
   Floors and clamps so no ratio/density input can produce unreadable
   text or collapsed spacing. The style-panel sliders should mirror
   these bounds. */
/** Smallest font size any generated step may resolve to (10px). */
const MIN_TEXT_REM = 0.625;
/** Modular ratios clamped to sane musical-interval territory. */
const MODULAR_RATIO_MIN = 1.02;
const MODULAR_RATIO_MAX = 1.8;

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/**
 * Per-step line-height curve for the generated named ladder — tighter as
 * size grows. Values mirror the ratios of Tailwind v4's default ladder
 * (and our --text-2xs token), so a generated scale keeps the same
 * vertical rhythm character as the static one it replaces.
 */
const TYPE_LINE_HEIGHT_CURVE: Record<TypeSizeName, number> = {
  "2xs": 1.455, // 1rem / 0.6875rem — the static token's ratio
  xs: 1.333,
  sm: 1.429,
  base: 1.5,
  lg: 1.556,
  xl: 1.4,
  "2xl": 1.333,
  "3xl": 1.2,
  "4xl": 1.111,
  "5xl": 1,
  "6xl": 1,
  "7xl": 1,
};

/**
 * Resolve the semantic ladder for a TypeScale.
 *
 * Presets keep the legacy behaviour: a flat multiplier over the
 * hand-tuned BASE_SCALE (zero visual change for existing themes).
 *
 * Modular ids generate MIDDLE-OUT (the Utopia model — utopia.fyi):
 * body anchors step 0 of the named ladder (2xs…7xl, base mid-ladder),
 * headings climb by the ratio, small text descends by the reciprocal
 * with a floor. Semantic slots then map onto named steps: h5=lg, h4=xl,
 * h3=2xl, h2=3xl, h1=4xl, display=6xl — so a ratio swap re-pitches the
 * whole hierarchy in one move.
 */
function typeLadder(scale: TypeScale): Record<keyof typeof BASE_SCALE, number> {
  if (scale in SCALE_MULTIPLIER) {
    const mult = SCALE_MULTIPLIER[scale as TypeScalePreset];
    return Object.fromEntries(
      Object.entries(BASE_SCALE).map(([k, v]) => [k, v * mult])
    ) as Record<keyof typeof BASE_SCALE, number>;
  }
  const sizes = modularNamedSizes(scale as ModularScaleId);
  return {
    display: sizes["6xl"],
    h1: sizes["4xl"],
    h2: sizes["3xl"],
    h3: sizes["2xl"],
    h4: sizes.xl,
    h5: sizes.lg,
    h6: sizes.base,
    body: sizes.base,
    bodySm: sizes.sm,
  };
}

/** The full named ladder for a modular id — ratio clamped, sizes floored. */
function modularNamedSizes(id: ModularScaleId): Record<TypeSizeName, number> {
  const ratio = clamp(MODULAR_RATIOS[id], MODULAR_RATIO_MIN, MODULAR_RATIO_MAX);
  return modularTypeSizes(1, ratio, MIN_TEXT_REM);
}

function resolveTypography(
  input: ThemeInput["typography"]
): GeneratedTypography {
  const ladder = typeLadder(input.scale);
  const rem = (n: number) => `${n.toFixed(3)}rem`;

  // Phase B (THEME-MIGRATION.md B2): a modular scale doesn't just move the
  // semantic h1…body slots — it re-pitches Tailwind's whole named ladder.
  // Emitting 2xs…7xl as --text-* lets every `text-xl`-style utility in
  // every screen ever generated re-scale when the ratio changes. Presets
  // deliberately emit NO named ladder (today's static values stay).
  let namedScale: GeneratedTypography["namedScale"];
  if (!(input.scale in SCALE_MULTIPLIER)) {
    const sizes = modularNamedSizes(input.scale as ModularScaleId);
    namedScale = Object.fromEntries(
      GDS_TYPE_SIZE_NAMES.map((name) => [
        name,
        {
          size: rem(sizes[name]),
          lineHeight: String(TYPE_LINE_HEIGHT_CURVE[name]),
        },
      ])
    );
  }

  return {
    fontSans: FONTS[input.body],
    fontMono: FONTS[input.mono],
    fontDisplay: FONTS[input.display],
    headingWeight: input.headingWeight ?? 600,
    bodyWeight: input.bodyWeight ?? 400,
    headingTracking: input.headingTracking ?? "-0.01em",
    scale: {
      display: rem(ladder.display),
      h1: rem(ladder.h1),
      h2: rem(ladder.h2),
      h3: rem(ladder.h3),
      h4: rem(ladder.h4),
      h5: rem(ladder.h5),
      h6: rem(ladder.h6),
      body: rem(ladder.body),
      bodySm: rem(ladder.bodySm),
    },
    namedScale,
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

/** Tailwind v4's default `--spacing` base. Every padding/gap/margin/size
 *  utility is calc(var(--spacing) * N), so re-pitching this one variable
 *  re-scales spacing across every screen ever generated (Phase B1 — the
 *  retroactive magic). */
const SPACING_BASE_REM = 0.25;
/** Guard (B5): never let the base collapse below half the default. */
const MIN_SPACING_UNIT_REM = 0.125;

function resolveSpacing(input: ThemeInput["spacing"]): GeneratedSpacing {
  const factor = clamp(DENSITY_FACTOR[input.density], 0.6, 1.6);
  const unitRem = Math.max(
    MIN_SPACING_UNIT_REM,
    Math.round(SPACING_BASE_REM * factor * 10000) / 10000
  );
  return {
    baseUnit: "1rem",
    densityFactor: DENSITY_FACTOR[input.density],
    unit: `${unitRem}rem`,
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

  // 2b. Role ramp families (THEME-MIGRATION.md B4, June 10 decision):
  // EVERY semantic alias points at a whole ramp — status displays many
  // ways (soft 100 bg, solid 600 fill, 800 text), so `--gds-success` is a
  // family, not a single value. Status ramps are seeded from the FIXED
  // status hues (the light set is canonical; ramps are mode-agnostic by
  // construction — the lightness curve is pinned). primary/accent/neutral
  // families reuse the base ramps and are emitted alongside these in
  // themeToCSSVars.
  const statusHue = (t: OKLCHTriplet) =>
    parseFloat(t.trim().split(/\s+/)[2] ?? "0");
  const fixedLight = FIXED_SEMANTIC.light;
  const roleRamps: GeneratedTheme["roleRamps"] = {
    success: hueToRamp({ hue: statusHue(fixedLight.success) }),
    warning: hueToRamp({ hue: statusHue(fixedLight.warning) }),
    info: hueToRamp({ hue: statusHue(fixedLight.info) }),
    highlight: hueToRamp({ hue: statusHue(fixedLight.highlight) }),
    destructive: hueToRamp({ hue: statusHue(fixedLight.destructive) }),
  };

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
    roleRamps,
    colors,
    chart,
    typography,
    radius,
    spacing,
    effects,
    components,
  };
}
