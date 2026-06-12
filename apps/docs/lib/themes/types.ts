/**
 * GradeTheme — a single object capturing every skinnable dimension of the
 * design system. A theme is a complete "skin": colors, typography, radius,
 * spacing feel, effects, and optional experimental (shader/WebGL) hooks.
 *
 * Themes are applied at runtime by the GradeThemeProvider, which writes the
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

  // Grade semantic extras
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

export interface GradeTheme {
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
  theme: GradeTheme;
}

/* ═════════════════════════════════════════════════════════════════════════
   GENERATOR-FIRST TYPES (Phase 1 of the OKLCH theme builder)
   ═════════════════════════════════════════════════════════════════════════

   Everything below drives the new generator-based theme system. A theme is
   now defined primarily by a compact ThemeInput (hues + a handful of
   config knobs) and generated into a full GeneratedTheme via generator.ts.

   The existing GradeTheme / ThemeColorsMode types above still work for the
   legacy Grade + Paper themes. Phase 2 replaces them with GeneratedTheme.
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
  poppins: "var(--font-poppins), system-ui, sans-serif",
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
  poppins: "Poppins",
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
  poppins: "sans",
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

/* ──────────────────────────────────────────────────────────────────────
   Custom fonts — uploaded typefaces a theme carries WITH it.

   The FONTS registry above covers fonts resident in the app (next/font
   loaders in layout.tsx). A CustomFontFace is the portable alternative:
   the theme itself names a family and points at a permanent public URL
   (the user-assets bucket, migration 0014), and every renderer — root
   provider, theme-builder scope, Fast Frame sandbox, share view, embed —
   injects the @font-face at apply time. Deterministic + portable per the
   STUDIO-THEMES contract: a saved/shared/embedded ThemeInput reproduces
   the exact face anywhere with no registry registration.
   ────────────────────────────────────────────────────────────────────── */

/** One uploaded font face a theme carries. Stored on
 *  `ThemeInput.typography.customFonts` and emitted as an @font-face rule
 *  by `fontFaceCSS` (apply.ts) wherever the theme is applied. */
export interface CustomFontFace {
  /** CSS font-family name, e.g. "Pebble Sans". Doubles as the display
   *  label and as the reference target for `custom:<family>` selections. */
  family: string;
  /** Permanent public URL for the font file (user-assets bucket). Must be
   *  publicly resolvable so cross-origin embeds can load it. */
  url: string;
  /** @font-face `format()` hint. Derived from the file extension. */
  format?: "woff2" | "woff" | "truetype" | "opentype";
  /** font-weight descriptor: "400", "700", or a variable range "100 900". */
  weight?: string;
  /** font-stretch descriptor range, e.g. "75% 125%" for a wdth axis.
   *  Defaults to a generous "50% 200%" (browsers clamp to the font's
   *  real range) so width-variable fonts respond to font-stretch. */
  stretch?: string;
  style?: "normal" | "italic";
  /** Drives the generic fallback stack appended after the family. */
  category?: "sans" | "serif" | "mono";
  /** Provenance: the `assets` row this face came from (optional — a theme
   *  must stay renderable even if the library row is gone). */
  assetId?: string;
}

/** Prefix marking a typography selection as one of the theme's own
 *  customFonts rather than a FONTS registry key. */
export const CUSTOM_FONT_PREFIX = "custom:" as const;

/** What `typography.display/body/mono` accept: a registry key, or a
 *  reference to an entry in `typography.customFonts` ("custom:<family>"). */
export type FontSelection = FontKey | `custom:${string}`;

/** The family name inside a "custom:<family>" selection, or null when the
 *  selection is a plain registry FontKey. */
export function customFontFamily(sel: string): string | null {
  return sel.startsWith(CUSTOM_FONT_PREFIX)
    ? sel.slice(CUSTOM_FONT_PREFIX.length)
    : null;
}

/** Generic fallback stacks appended after a custom family. */
export const CUSTOM_FONT_FALLBACK: Record<"sans" | "serif" | "mono", string> = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};

/** Type scale preset — controls how generous the size ladder is. */
export type TypeScalePreset = "compact" | "default" | "spacious";

/** Modular (musical-interval) scale ids — mirror GDS_MODULAR_SCALES in
 *  @gradeui/core. Selecting one generates the type ladder middle-out from
 *  the body size (Utopia model): up by the ratio, down by the reciprocal,
 *  floored. */
export type ModularScaleId =
  | "minor-second"
  | "major-second"
  | "minor-third"
  | "major-third"
  | "perfect-fourth"
  | "augmented-fourth"
  | "perfect-fifth"
  | "golden-ratio";

/** What `typography.scale` accepts: a legacy flat preset or a modular ratio. */
export type TypeScale = TypeScalePreset | ModularScaleId;

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
/** A saved remix — a named ThemeInput derived from the project theme.
 *  Stored as a JSON array on the project (theme_variants_json). Because
 *  the generator is deterministic, persisting the INPUT reproduces the
 *  exact theme; we never store the generated output. Variants with
 *  `includeInShare` form the curated A/B set the share toolbar offers. */
export interface ThemeVariant {
  id: string;
  name: string;
  input: ThemeInput;
  /** When true, this variant travels with the share link and shows up in
   *  the share toolbar's theme switcher. */
  includeInShare: boolean;
  createdAt: number;
}

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
   * Focus ring colour. By default the ring (`--ring`) rides the PRIMARY
   * ramp at a mode-tuned step (500 light / 400 dark / 300 superDark).
   * `source` re-points it at another ramp; `hue` (0–360) gives the ring
   * its own dedicated ramp at primary chroma — for brands whose focus
   * colour is deliberately independent of primary/accent (e.g. a blue
   * a11y ring on a warm-toned brand). `hue` wins over `source` when both
   * are set. The mode-tuned step is preserved either way, so contrast
   * behaviour per mode doesn't change. Deterministic + portable like
   * every other ThemeInput field.
   */
  ring?: {
    source?: "primary" | "accent" | "neutral";
    hue?: number;
  };

  /**
   * Global chroma intensity. Multiplies every ramp's chroma — a quick way to
   * flip the whole theme between muted / default / vibrant without touching
   * the per-ramp chroma values.
   */
  intensity?: ColorIntensity;

  typography: {
    display: FontSelection;
    body: FontSelection;
    mono: FontSelection;
    scale: TypeScale;
    /** Override heading weight. Defaults to 600 for sans, 500 for serif. */
    headingWeight?: number;
    /** Override body weight. Defaults to 400. */
    bodyWeight?: number;
    /** Letter-spacing applied to headings. Default "-0.01em". */
    headingTracking?: string;
    /** CSS font-stretch for body text (spans, paragraphs, component
     *  text — it inherits everywhere). Meaningful for fonts with a
     *  wdth axis, e.g. "90%" = TT Commons' Compact cut. Default
     *  "normal". Fonts without the axis ignore it. */
    bodyStretch?: string;
    /** CSS font-stretch for display/heading text. Defaults to
     *  bodyStretch so one knob re-cuts the whole theme. */
    displayStretch?: string;
    /** Uploaded faces this theme carries. A `custom:<family>` selection
     *  above must have a matching entry here; unreferenced entries are
     *  harmless (kept so switching back is instant). */
    customFonts?: CustomFontFace[];
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

  // Grade extras
  success: OKLCHTriplet;
  warning: OKLCHTriplet;
  info: OKLCHTriplet;
  highlight: OKLCHTriplet;

  // Alert / badge surface pairs — derived from the status colours. `*-soft`
  // is the pale tinted surface for alerts, badges, and banners; `*-deep` is
  // the readable text/icon colour that pairs with it. Generated per-mode so
  // a dark mode tint is still dark, but the text stays bright.
  destructiveSoft: OKLCHTriplet;
  destructiveDeep: OKLCHTriplet;
  successSoft: OKLCHTriplet;
  successDeep: OKLCHTriplet;
  warningSoft: OKLCHTriplet;
  warningDeep: OKLCHTriplet;
  infoSoft: OKLCHTriplet;
  infoDeep: OKLCHTriplet;
  highlightSoft: OKLCHTriplet;
  highlightDeep: OKLCHTriplet;
}

/** Concrete resolved CSS values for the typography dimension. */
export interface GeneratedTypography {
  fontSans: string;
  fontMono: string;
  fontDisplay: string;
  /** Custom @font-face sources carried through from the input. Whoever
   *  applies the theme (apply.ts, Fast Frame, Sandpack, embed) is
   *  responsible for injecting these — the font-family vars above already
   *  reference the family names. Absent/empty for registry-only themes. */
  fontFaces?: CustomFontFace[];
  headingWeight: number;
  bodyWeight: number;
  headingTracking: string;
  /** Resolved CSS font-stretch values ("normal" when unset). */
  bodyStretch: string;
  displayStretch: string;
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
  /**
   * The full named Tailwind ladder (2xs…7xl), present ONLY when
   * `typography.scale` is a modular ratio id (THEME-MIGRATION.md B2).
   * Emitted as `--text-<name>` / `--text-<name>--line-height` so every
   * text-* utility re-pitches when the ratio changes. Presets leave this
   * undefined — the static ladder in the stylesheet stays untouched.
   */
  namedScale?: Record<string, { size: string; lineHeight: string }>;
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
  /**
   * The Tailwind v4 `--spacing` base unit (e.g. "0.2125rem" for tight,
   * "0.25rem" for default, "0.3rem" for roomy). Every spacing utility is
   * calc(var(--spacing) * N), so this single variable re-scales padding,
   * gaps, margins and sizes across every generated screen — retroactively
   * (THEME-MIGRATION.md B1).
   */
  unit: string;
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

  /**
   * Role ramp families (THEME-MIGRATION.md B4) — every status alias is a
   * whole ramp because status displays many ways (soft 100 bg, solid 600
   * fill, 800 text). Seeded from the fixed status hues; emitted as
   * `--gds-<role>-<step>` triplets alongside primary/accent/neutral
   * (which reuse `ramps`). Optional so partially-constructed themes stay
   * valid; generator output always includes it.
   */
  roleRamps?: {
    success: Ramp;
    warning: Ramp;
    info: Ramp;
    highlight: Ramp;
    destructive: Ramp;
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
