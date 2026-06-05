import type { GeneratedColorsMode, GeneratedTheme } from "./types";
import { RAMP_KEYS, type ModeName, type Ramp } from "./oklch";

/**
 * Runtime theme application.
 *
 * Writes a GeneratedTheme to :root as CSS custom properties. The consuming
 * CSS (globals.css + tailwind.config.ts) wraps each var with
 *   oklch(var(--x) / <alpha-value>)
 * so Tailwind opacity shortcuts keep working.
 *
 * Apart from color tokens, this also writes:
 *   - Typography CSS vars (--font-sans, --font-display, --font-mono,
 *     --font-heading-weight, --font-heading-tracking, plus the type scale)
 *   - Radius vars (--radius + --gds-radius-*)
 *   - Spacing density (--gds-density multiplier)
 *   - Shadow, motion, and border vars (--gds-shadow-*, --gds-transition-*)
 *   - Ramp swatches (--ramp-neutral-50…950, etc.) for the theme builder UI
 *   - data-* attributes driving component shape CSS rules
 */

export type { ModeName } from "./oklch";

/** Expand a GeneratedColorsMode into a flat { --var: value } map. */
function colorVars(c: GeneratedColorsMode): Record<string, string> {
  return {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.cardForeground,
    "--popover": c.popover,
    "--popover-foreground": c.popoverForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--destructive": c.destructive,
    "--destructive-foreground": c.destructiveForeground,
    "--border": c.border,
    "--input": c.input,
    "--ring": c.ring,
    "--success": c.success,
    "--warning": c.warning,
    "--info": c.info,
    "--highlight": c.highlight,

    // Alert surface pairs — paler tinted surface + deeper on-surface text
    // for each status colour. Consumed by Alert, Badge (soft variants), and
    // anywhere a banner needs a status tint without going full-saturation.
    "--destructive-soft": c.destructiveSoft,
    "--destructive-deep": c.destructiveDeep,
    "--success-soft": c.successSoft,
    "--success-deep": c.successDeep,
    "--warning-soft": c.warningSoft,
    "--warning-deep": c.warningDeep,
    "--info-soft": c.infoSoft,
    "--info-deep": c.infoDeep,
    "--highlight-soft": c.highlightSoft,
    "--highlight-deep": c.highlightDeep,
  };
}

/**
 * Produce every CSS custom property a given GeneratedTheme + mode implies,
 * as a flat { key: value } map. Useful for the provider (applies to :root)
 * and the builder preview pane (applies to a scoped wrapper).
 */
export function themeToCSSVars(
  theme: GeneratedTheme,
  mode: ModeName
): Record<string, string> {
  const colors = theme.colors[mode];
  const vars: Record<string, string> = {
    ...colorVars(colors),

    // --- Ramp swatches (useful for token previews + future palette tools) ---
    // Each ramp stop is exposed as --ramp-<name>-<step> so the builder can
    // render live palette chips without re-running the generator.
    ...flattenRamp("neutral", theme.ramps.neutral),
    ...flattenRamp("primary", theme.ramps.primary),
    ...flattenRamp("accent", theme.ramps.accent),

    // --- Chart palette — 5 tonally-cohesive series colors derived from hues.
    "--chart-1": theme.chart[1],
    "--chart-2": theme.chart[2],
    "--chart-3": theme.chart[3],
    "--chart-4": theme.chart[4],
    "--chart-5": theme.chart[5],

    // --- Brand pops — 8 vivid, saturated accents (--brand-1 … --brand-8).
    // Backgrounds, themes, and primaries are often deliberately muted; these
    // are the LOUD slots an interface reaches for when it needs to pop —
    // shader fills, highlights, gradient stops, scene fills. Auto-derived
    // here from the chart hues (tonally cohesive) plus vivid stops of the
    // primary/accent ramps, so every theme ships a usable set; a project's
    // Branding panel can override any slot (STUDIO-BRANDING.md). OKLCH
    // triplets — compose as `oklch(var(--brand-N))`.
    ...brandPops(theme),

    // --- Typography ---
    "--font-sans": theme.typography.fontSans,
    "--font-mono": theme.typography.fontMono,
    "--font-display": theme.typography.fontDisplay,
    "--font-heading-weight": String(theme.typography.headingWeight),
    "--font-body-weight": String(theme.typography.bodyWeight),
    "--font-heading-tracking": theme.typography.headingTracking,
    "--text-display": theme.typography.scale.display,
    "--text-h1": theme.typography.scale.h1,
    "--text-h2": theme.typography.scale.h2,
    "--text-h3": theme.typography.scale.h3,
    "--text-h4": theme.typography.scale.h4,
    "--text-h5": theme.typography.scale.h5,
    "--text-h6": theme.typography.scale.h6,
    "--text-body": theme.typography.scale.body,
    "--text-body-sm": theme.typography.scale.bodySm,

    // --- Radius ---
    "--radius": theme.radius.base,
    "--gds-radius-sm": theme.radius.sm,
    "--gds-radius-md": theme.radius.md,
    "--gds-radius-lg": theme.radius.lg,
    "--gds-radius-xl": theme.radius.xl,
    "--gds-radius-2xl": theme.radius["2xl"],
    "--gds-radius-full": theme.radius.full,

    // --- Spacing density multiplier (consumed via calc()) ---
    "--gds-density": String(theme.spacing.densityFactor),

    // --- Shadows ---
    "--gds-shadow-sm": theme.effects.shadows.sm,
    "--gds-shadow-md": theme.effects.shadows.md,
    "--gds-shadow-lg": theme.effects.shadows.lg,
    "--gds-shadow-xl": theme.effects.shadows.xl,
    "--gds-shadow-2xl": theme.effects.shadows["2xl"],
    "--gds-shadow-inner": theme.effects.shadows.inner,

    // --- Motion ---
    "--gds-transition-fast": theme.effects.motion.fast,
    "--gds-transition-base": theme.effects.motion.base,
    "--gds-transition-slow": theme.effects.motion.slow,
    "--gds-transition-slower": theme.effects.motion.slower,

    // --- Borders ---
    "--gds-border-width": theme.effects.borderWidth,
  };
  return vars;
}

/**
 * The 8 brand-pop slots. Vivid by construction: the chart palette (5 hues,
 * already saturated mid-lightness) seeds 1–5; 6–8 pull the brightest stops
 * of the primary/accent ramps. Every value is an OKLCH triplet so it
 * composes via `oklch(var(--brand-N))`. A theme always has all 8; a
 * project's Branding panel later overrides individual slots.
 */
function brandPops(theme: GeneratedTheme): Record<string, string> {
  const c = theme.chart;
  const p = theme.ramps.primary;
  const a = theme.ramps.accent;
  const slots: string[] = [
    c[1],
    c[2],
    c[3],
    c[4],
    c[5],
    // Vivid ramp stops — 400/500 read as the "loud" version of the brand.
    p[400] ?? p[500],
    a[400] ?? a[500],
    p[600] ?? p[500],
  ];
  const out: Record<string, string> = {};
  slots.forEach((v, i) => {
    out[`--brand-${i + 1}`] = v;
  });
  return out;
}

function flattenRamp(
  name: "neutral" | "primary" | "accent",
  ramp: Ramp
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const step of RAMP_KEYS) {
    out[`--ramp-${name}-${step}`] = ramp[step];
  }
  return out;
}

/**
 * Apply a theme to an arbitrary element. Writes every CSS variable
 * produced by `themeToCSSVars` to the element's inline style and sets
 * the `data-*` attributes that component-shape CSS rules key off.
 *
 * Safe to call repeatedly — each call fully resets the vars the theme
 * controls. Vars the theme doesn't touch (e.g. `--gds-green-500` in
 * globals.css) are left alone.
 *
 * Targets:
 *   - `document.documentElement` (default; used by `applyThemeToRoot`)
 *   - any `<div>` you want to host a scoped subtree theme
 *   - an iframe's own document element via
 *     `iframeRef.contentDocument?.documentElement` — this is the path
 *     for the "theme-per-iframe" use case
 *
 * Note: when scoping to a non-root element, you'll also want to apply
 * the `.dark` class on that element (the way the provider does at the
 * document root) so Tailwind's `dark:` variants resolve correctly
 * inside that subtree. The companion `ThemeBuilderScope` component
 * does this for you.
 */
export function applyThemeToElement(
  theme: GeneratedTheme,
  mode: ModeName,
  target: HTMLElement,
): void {
  const vars = themeToCSSVars(theme, mode);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }

  // Metadata attributes — components key styles off these.
  // Fall back to sensible defaults if a field is missing (shouldn't
  // happen for generator output, but keeps this safe if called with a
  // partial).
  target.setAttribute("data-grade-theme", theme.id);
  target.setAttribute("data-mode", mode);
  target.setAttribute("data-button-shape", theme.components.buttonShape ?? "default");
  target.setAttribute("data-input-style", theme.components.inputStyle ?? "outlined");
  target.setAttribute("data-card-style", theme.components.cardStyle ?? "flat");
}

/**
 * Apply a theme to `document.documentElement`. Thin wrapper around
 * `applyThemeToElement` kept as the canonical "theme the whole site"
 * entry-point. SSR-safe (no-ops when `document` is undefined).
 */
export function applyThemeToRoot(theme: GeneratedTheme, mode: ModeName): void {
  if (typeof document === "undefined") return;
  applyThemeToElement(theme, mode, document.documentElement);
}
