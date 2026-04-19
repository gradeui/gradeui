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
 *   - Radius vars (--radius + --rds-radius-*)
 *   - Spacing density (--rds-density multiplier)
 *   - Shadow, motion, and border vars (--rds-shadow-*, --rds-transition-*)
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
    "--rds-radius-sm": theme.radius.sm,
    "--rds-radius-md": theme.radius.md,
    "--rds-radius-lg": theme.radius.lg,
    "--rds-radius-xl": theme.radius.xl,
    "--rds-radius-2xl": theme.radius["2xl"],
    "--rds-radius-full": theme.radius.full,

    // --- Spacing density multiplier (consumed via calc()) ---
    "--rds-density": String(theme.spacing.densityFactor),

    // --- Shadows ---
    "--rds-shadow-sm": theme.effects.shadows.sm,
    "--rds-shadow-md": theme.effects.shadows.md,
    "--rds-shadow-lg": theme.effects.shadows.lg,
    "--rds-shadow-xl": theme.effects.shadows.xl,
    "--rds-shadow-2xl": theme.effects.shadows["2xl"],
    "--rds-shadow-inner": theme.effects.shadows.inner,

    // --- Motion ---
    "--rds-transition-fast": theme.effects.motion.fast,
    "--rds-transition-base": theme.effects.motion.base,
    "--rds-transition-slow": theme.effects.motion.slow,
    "--rds-transition-slower": theme.effects.motion.slower,

    // --- Borders ---
    "--rds-border-width": theme.effects.borderWidth,
  };
  return vars;
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
 * Apply a theme to the document root. Writes every CSS variable produced by
 * themeToCSSVars and sets a set of data attributes that component-shape
 * CSS rules key off of.
 *
 * Safe to call repeatedly — each call fully resets the vars the theme
 * controls. Vars the theme doesn't touch (e.g. --rds-green-500 in
 * globals.css) are left alone.
 */
export function applyThemeToRoot(theme: GeneratedTheme, mode: ModeName): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = themeToCSSVars(theme, mode);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  // Metadata attributes — components key styles off these.
  // Fall back to sensible defaults if a field is missing (shouldn't happen
  // for generator output, but keeps this safe if called with a partial).
  root.setAttribute("data-ramp-theme", theme.id);
  root.setAttribute("data-mode", mode);
  root.setAttribute("data-button-shape", theme.components.buttonShape ?? "default");
  root.setAttribute("data-input-style", theme.components.inputStyle ?? "outlined");
  root.setAttribute("data-card-style", theme.components.cardStyle ?? "flat");
}
