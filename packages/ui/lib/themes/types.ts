/**
 * RampTheme — a single object capturing every skinnable dimension of the
 * design system. A theme is a complete "skin": colors, typography, radius,
 * spacing feel, effects, and optional experimental (shader/WebGL) hooks.
 *
 * Themes are applied at runtime by the RampThemeProvider, which writes the
 * resolved values to CSS custom properties on :root. Components already read
 * from those variables (via the shadcn semantic layer + RDS tokens), so no
 * component code has to change per theme.
 *
 * HSL strings use the space-separated shadcn format: "175 84% 32%".
 * They are wrapped in hsl() at the call site (e.g. oklch(var(--primary))).
 */

export type HSL = string;

export interface ThemeColorsMode {
  // Core shadcn semantic tokens
  background: HSL;
  foreground: HSL;
  card: HSL;
  cardForeground: HSL;
  popover: HSL;
  popoverForeground: HSL;
  primary: HSL;
  primaryForeground: HSL;
  secondary: HSL;
  secondaryForeground: HSL;
  muted: HSL;
  mutedForeground: HSL;
  accent: HSL;
  accentForeground: HSL;
  destructive: HSL;
  destructiveForeground: HSL;
  border: HSL;
  input: HSL;
  ring: HSL;

  // Ramp semantic extras
  success: HSL;
  warning: HSL;
  info: HSL;
  energy: HSL;
}

export interface ThemeTypography {
  /** CSS font-family string for the default sans. Can reference a CSS var. */
  fontSans: string;
  /** CSS font-family string for monospace. */
  fontMono: string;
  /** Optional distinct font for display/hero headings. Defaults to fontSans. */
  fontDisplay?: string;
  /** Optional weight used for headings. Defaults: 600. */
  headingWeight?: number;
  /** Optional weight used for body. Defaults: 400. */
  bodyWeight?: number;
  /** Letter-spacing applied to headings. */
  headingTracking?: string;
  /** Optional scale overrides — any subset. Falls back to RDS defaults. */
  scale?: Partial<{
    display: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    body: string;
    bodySm: string;
  }>;
}

export interface ThemeRadius {
  /** The shadcn --radius base value. Button/input radius derive from this. */
  base: string;
  /** Optional full-scale overrides. */
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  "2xl"?: string;
  full?: string;
  /** Shorthand feel: sharp = 0, soft = default, pill = full. */
  style?: "sharp" | "soft" | "rounded" | "pill";
}

export interface ThemeSpacing {
  /** Base unit for the spacing scale. Default "1rem" (16px). */
  baseUnit?: string;
  /** Density preset: tight = 0.75x, default = 1x, roomy = 1.25x. */
  density?: "tight" | "default" | "roomy";
}

export interface ThemeEffects {
  shadows?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
    inner?: string;
  };
  motion?: {
    fast?: string;
    base?: string;
    slow?: string;
    slower?: string;
    easeIn?: string;
    easeOut?: string;
    easeInOut?: string;
    /** Global motion intensity multiplier — 0 = instant, 1 = default, >1 = slower. */
    intensity?: number;
  };
  borders?: {
    width?: string;
    style?: "solid" | "dashed" | "dotted";
  };
}

export interface ThemeComponents {
  /** Shape of button corners. Mapped to a data attribute components can key off. */
  buttonShape?: "default" | "pill" | "square" | "sharp";
  /** Input rendering style. */
  inputStyle?: "outlined" | "filled" | "underline";
  /** Card rendering style. */
  cardStyle?: "flat" | "elevated" | "outlined" | "glass";
}

export interface ThemeExperimental {
  /** Named shader references; resolved by <ThemeCanvas> / <ShaderSurface>. */
  shaders?: {
    background?: string;
    buttonGlow?: string;
    cardEffect?: string;
  };
  effects?: {
    noise?: boolean;
    grain?: boolean;
    scanlines?: boolean;
    bloom?: boolean;
  };
}

export interface RampTheme {
  id: string;
  name: string;
  description: string;
  /** Optional tagline for the switcher UI. */
  tagline?: string;

  colors: {
    light: ThemeColorsMode;
    dark: ThemeColorsMode;
  };
  typography: ThemeTypography;
  radius: ThemeRadius;
  spacing: ThemeSpacing;
  effects?: ThemeEffects;
  components?: ThemeComponents;
  experimental?: ThemeExperimental;
}

/** Convenience: a theme registry entry. */
export interface ThemeRegistryEntry {
  id: string;
  theme: RampTheme;
}

/* ═════════════════════════════════════════════════════════════════════════
   GENERATOR-FIRST TYPES (Phase 1 of the OKLCH theme builder)
   ═════════════════════════════════════════════════════════════════════════

   Everything below drives the new generator-based theme system. A theme is
   now defined primarily by a compact ThemeInput (hues + a handful of
   config knobs) and generated into a full GeneratedTheme via generator.ts.

   The existing RampTheme / ThemeColorsMode types above still work for the
   legacy Ramp + Paper themes. Phase 2 replaces them with GeneratedTheme.
   ───────────────────────────────────────────────────────────────────────── */

import type { ModeName, OKLCHTriplet, Ramp } from "./oklch";
export type { ModeName, OKLCHTriplet, Ramp } from "./oklch";

/**
 * The CSS font-family string for each available font. Keys match the CSS
 * variables set by app/layout.tsx's font loaders. Adding a new font means
 * loading it in the root layout AND registering it here.
 *
 * Geist is the recommended default sans (replaces Satoshi). Jetbrains Mono
 * is the default mono. Serif and alternative options round out the list for
 * the theme builder's font picker — expected to grow as we allow dynamic
 * Google Font loading later.
 */
export const FONTS = {
  // Sans
  geist: "var(--font-geist), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
  manrope: "var(--font-manrope), system-ui, sans-serif",
  figtree: "var(--font-figtree), system-ui, sans-serif",
  dmSans: "var(--font-dm-sans), system-ui, sans-serif",
  lexend: "var(--font-lexend), system-ui, sans-serif",
  outfit: "var(--font-outfit), system-ui, sans-serif",
  plusJakarta: "var(--font-plus-jakarta), system-ui, sans-serif",
  spaceGrotesk: "var(--font-space-grotesk), system-ui, sans-serif",
  // Serif
  fraunces: "var(--font-fraunces), Georgia, serif",
  instrumentSerif: "var(--font-instrument-serif), Georgia, serif",
  sourceSerif: "var(--font-source-serif), Georgia, serif",
  // Mono
  jetbrainsMono: "var(--font-jetbrains-mono), ui-monospace, monospace",
  geistMono: "var(--font-geist-mono), ui-monospace, monospace",
  ibmPlexMono: "var(--font-ibm-plex-mono), ui-monospace, monospace",
  // System fallbacks
  system: "system-ui, -apple-system, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, Menlo, monospace",
} as const;

export type FontKey = keyof typeof FONTS;

/** Human-readable labels for the font picker. */
export const FONT_LABELS: Record<FontKey, string> = {
  geist: "Geist",
  inter: "Inter",
  manrope: "Manrope",
  figtree: "Figtree",
  dmSans: "DM Sans",
  lexend: "Lexend",
  outfit: "Outfit",
  plusJakarta: "Plus Jakarta Sans",
  spaceGrotesk: "Space Grotesk",
  fraunces: "Fraunces",
  instrumentSerif: "Instrument Serif",
  sourceSerif: "Source Serif 4",
  jetbrainsMono: "JetBrains Mono",
  geistMono: "Geist Mono",
  ibmPlexMono: "IBM Plex Mono",
  system: "System sans",
  serif: "System serif",
  mono: "System mono",
};

/** Categorization used to filter the picker (serif/sans/mono). */
export const FONT_CATEGORY: Record<FontKey, "sans" | "serif" | "mono"> = {
  geist: "sans",
  inter: "sans",
  manrope: "sans",
  figtree: "sans",
  dmSans: "sans",
  lexend: "sans",
  outfit: "sans",
  plusJakarta: "sans",
  spaceGrotesk: "sans",
  fraunces: "serif",
  instrumentSerif: "serif",
  sourceSerif: "serif",
  jetbrainsMono: "mono",
  geistMono: "mono",
  ibmPlexMono: "mono",
  system: "sans",
  serif: "serif",
  mono: "mono",
};

/** Type scale preset — controls how generous the size ladder is. */
export type TypeScalePreset = "compact" | "default" | "spacious";

/** Density preset — controls spacing tightness. */
export type SpacingDensity = "tight" | "default" | "roomy";

/** Radius preset — controls how rounded corners are across the system. */
export type RadiusStyle = "sharp" | "subtle" | "soft" | "round" | "pill";

/** Shadow intensity preset. */
export type ShadowIntensity = "none" | "subtle" | "default" | "dramatic";

/**
 * Chroma intensity — applied globally on top of per-ramp chroma multipliers.
 * "muted" dials all ramps down (pastel / editorial feel).
 * "vibrant" pushes them past the defaults (popping / marketing feel).
 */
export type ColorIntensity = "muted" | "default" | "vibrant";

/** Button rendering shape (orthogonal to radius). */
export type ButtonShape = "default" | "pill" | "square";

/** Input rendering style. */
export type InputStyle = "outlined" | "filled" | "underline";

/** Card rendering style. */
export type CardStyle = "flat" | "outlined" | "elevated" | "glass";

/**
 * The user-facing theme definition. This is what gets saved to
 * localStorage, exported as JSON, and shared via URL. The generator
 * consumes this and produces a full GeneratedTheme.
 */
export interface ThemeInput {
  /** Stable id. For user themes: "user:<uuid>"; for built-ins: short slug. */
  id: string;
  /** Display name. */
  name: string;
  /** Optional one-line description for the switcher. */
  description?: string;
  /** Optional tagline (category tag). */
  tagline?: string;

  /** The three hues that drive the entire color system. */
  hues: {
    /** 0–360. The gray ramp's tint. Low chroma, subtle. */
    neutral: number;
    /** 0–360. The brand primary. */
    primary: number;
    /** 0–360. The secondary brand accent. Often primary ± 30–180°. */
    accent: number;
  };

  /**
   * Optional chroma overrides. Defaults tuned to produce pleasant ramps:
   * neutrals get a subtle tint (0.1× peak), primary/accent get full chroma.
   * Raise above 1.0 for vibrant; lower for muted.
   */
  chroma?: {
    neutral?: number; // default 0.08
    primary?: number; // default 1.0
    accent?: number; // default 1.0
  };

  /** If true, the neutral ramp is pure gray regardless of neutral hue. */
  neutralPureGray?: boolean;

  /**
   * Global chroma intensity. Multiplies every ramp's chroma — a quick way to
   * flip the whole theme between muted / default / vibrant without touching
   * the per-ramp chroma values.
   */
  intensity?: ColorIntensity;

  typography: {
    display: FontKey;
    body: FontKey;
    mono: FontKey;
    scale: TypeScalePreset;
    /** Override heading weight. Defaults to 600 for sans, 500 for serif. */
    headingWeight?: number;
    /** Override body weight. Defaults to 400. */
    bodyWeight?: number;
    /** Letter-spacing applied to headings. Default "-0.01em". */
    headingTracking?: string;
  };

  spacing: {
    density: SpacingDensity;
  };

  radius: {
    style: RadiusStyle;
  };

  effects?: {
    shadows?: ShadowIntensity;
    /** 0 = instant, 1 = default, 2 = luxurious. */
    motionIntensity?: number;
    borderWidth?: string;
  };

  components?: {
    buttonShape?: ButtonShape;
    inputStyle?: InputStyle;
    cardStyle?: CardStyle;
  };
}

/**
 * Per-mode semantic token mapping. Each token holds a bare OKLCH triplet
 * (not an `oklch(…)` string) — the consumer wraps it with oklch(var(--x) /
 * <alpha-value>) via Tailwind config.
 */
export interface GeneratedColorsMode {
  background: OKLCHTriplet;
  foreground: OKLCHTriplet;
  card: OKLCHTriplet;
  cardForeground: OKLCHTriplet;
  popover: OKLCHTriplet;
  popoverForeground: OKLCHTriplet;
  primary: OKLCHTriplet;
  primaryForeground: OKLCHTriplet;
  secondary: OKLCHTriplet;
  secondaryForeground: OKLCHTriplet;
  muted: OKLCHTriplet;
  mutedForeground: OKLCHTriplet;
  accent: OKLCHTriplet;
  accentForeground: OKLCHTriplet;
  destructive: OKLCHTriplet;
  destructiveForeground: OKLCHTriplet;
  border: OKLCHTriplet;
  input: OKLCHTriplet;
  ring: OKLCHTriplet;

  // Ramp extras
  success: OKLCHTriplet;
  warning: OKLCHTriplet;
  info: OKLCHTriplet;
  highlight: OKLCHTriplet;
}

/** Concrete resolved CSS values for the typography dimension. */
export interface GeneratedTypography {
  fontSans: string;
  fontMono: string;
  fontDisplay: string;
  headingWeight: number;
  bodyWeight: number;
  headingTracking: string;
  /** Explicit font-size for each step in the scale. */
  scale: {
    display: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    body: string;
    bodySm: string;
  };
}

/** Concrete resolved CSS values for radius. */
export interface GeneratedRadius {
  base: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  full: string;
}

/** Concrete resolved spacing values. */
export interface GeneratedSpacing {
  baseUnit: string;
  densityFactor: number;
}

/** Concrete resolved effects values. */
export interface GeneratedEffects {
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    inner: string;
  };
  motion: {
    fast: string;
    base: string;
    slow: string;
    slower: string;
  };
  borderWidth: string;
}

/**
 * A 5-stop categorical chart palette derived from the theme hues. Each
 * entry is an OKLCH triplet. Written to --chart-1 through --chart-5 at
 * :root — chart components (recharts) read them via var(--chart-N).
 */
export interface ChartPalette {
  1: OKLCHTriplet;
  2: OKLCHTriplet;
  3: OKLCHTriplet;
  4: OKLCHTriplet;
  5: OKLCHTriplet;
}

/**
 * The full output of the generator. This is what gets applied to :root by
 * the provider, written to CSS vars, and used for rendering previews.
 *
 * The original ThemeInput is preserved on `input` so the theme can be
 * round-tripped back into the builder UI for editing.
 */
export interface GeneratedTheme {
  id: string;
  name: string;
  description?: string;
  tagline?: string;

  /** The original input, preserved for round-trip editing. */
  input: ThemeInput;

  /** The three base ramps. Same content regardless of which mode is active. */
  ramps: {
    neutral: Ramp;
    primary: Ramp;
    accent: Ramp;
  };

  /** Semantic tokens for all four modes. */
  colors: Record<ModeName, GeneratedColorsMode>;

  /** 5-stop palette for chart series. */
  chart: ChartPalette;

  typography: GeneratedTypography;
  radius: GeneratedRadius;
  spacing: GeneratedSpacing;
  effects: GeneratedEffects;
  components: NonNullable<ThemeInput["components"]>;
}
