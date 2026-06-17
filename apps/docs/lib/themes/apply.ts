import type {
  CustomFontFace,
  GeneratedColorsMode,
  GeneratedTheme,
} from "./types";
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

    // --- Brand pops — 8 LOUD, saturated accents (--brand-1 … --brand-8).
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
    // Variable-font width cut (wdth axis). Consumed by globals.css on
    // body (inherits into every span/component) and h1–h4. Per-element
    // utilities (font-stretch-[75%]) still override — classes beat
    // inherited values.
    "--font-body-stretch": theme.typography.bodyStretch ?? "normal",
    "--font-display-stretch": theme.typography.displayStretch ?? "normal",
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

    // --- Spacing base (B1): Tailwind v4 derives EVERY spacing utility
    // from this one variable (p-4 → calc(var(--spacing) * 4)), so the
    // density control re-scales padding/gap/margin/size across every
    // screen ever generated. Falls back to the v4 default for themes
    // generated before the field existed.
    "--spacing": theme.spacing.unit ?? "0.25rem",

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

  // --- Named type ladder (B2) — present only for modular scales. Writes
  // --text-2xs … --text-7xl (+ per-step line-heights), re-pitching every
  // text-* utility. Preset scales emit nothing here, leaving the static
  // ladder in the stylesheet untouched.
  if (theme.typography.namedScale) {
    for (const [name, step] of Object.entries(theme.typography.namedScale)) {
      vars[`--text-${name}`] = step.size;
      vars[`--text-${name}--line-height`] = step.lineHeight;
    }
  }

  // --- Role ramp families (B4) — every semantic alias as a whole ramp.
  // primary/accent/neutral reuse the base ramps; statuses come from
  // roleRamps. Consumed by the --color-<role>-<step> @theme entries in
  // globals.css, so utilities like bg-success-100 / text-warning-800
  // track the theme.
  const families: Array<[string, Ramp | undefined]> = [
    ["primary", theme.ramps.primary],
    ["accent", theme.ramps.accent],
    ["neutral", theme.ramps.neutral],
    ["success", theme.roleRamps?.success],
    ["warning", theme.roleRamps?.warning],
    ["info", theme.roleRamps?.info],
    ["highlight", theme.roleRamps?.highlight],
    ["destructive", theme.roleRamps?.destructive],
  ];
  for (const [role, ramp] of families) {
    if (!ramp) continue;
    for (const step of RAMP_KEYS) {
      vars[`--gds-${role}-${step}`] = ramp[step];
    }
  }

  return vars;
}

/**
 * The 8 brand-pop slots — genuinely LOUD. The earlier version reused the
 * chart palette (tuned for data-viz cohesion: mid-lightness, low chroma,
 * one stop basically grey), so the pops came out muted/dull. Instead we
 * build a vivid spectrum ANCHORED to the theme: take the primary and accent
 * hues and fan eight high-chroma hues across the wheel from them, all at
 * bright lightness. Stays on-brand (hues track the theme, so they re-voice
 * when you switch theme or drag hue) but actually pops. Every value is a
 * bare OKLCH triplet so it composes via `oklch(var(--brand-N))`. A theme
 * always has all 8; a project's Branding panel later overrides slots.
 */
function brandPops(theme: GeneratedTheme): Record<string, string> {
  const hueOf = (triplet: string): number =>
    parseFloat(triplet.trim().split(/\s+/)[2] ?? "0");
  const wrap = (h: number): number => ((h % 360) + 360) % 360;

  const pH = hueOf(theme.ramps.primary[500]);
  const aH = hueOf(theme.ramps.accent[500]);

  // Fan eight hues out from the two brand anchors so the set spans the
  // wheel without drifting off-brand.
  const hues = [
    pH,
    aH,
    pH + 45,
    aH + 60,
    pH + 150,
    aH - 75,
    pH + 210,
    aH + 165,
  ].map(wrap);

  // Vivid: high OKLCH chroma, bright lightness with a little step-to-step
  // variation so neighbours don't read flat. Browsers gamut-map the few
  // hues that exceed sRGB at this chroma.
  const out: Record<string, string> = {};
  hues.forEach((h, i) => {
    const L = (0.68 + (i % 3) * 0.02).toFixed(3);
    out[`--brand-${i + 1}`] = `${L} 0.200 ${h.toFixed(2)}`;
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

/* ──────────────────────────────────────────────────────────────────────
   Custom font faces — the @font-face side of CustomFontFace.

   themeToCSSVars already emits font-family vars that NAME a custom
   family; these helpers materialise the face itself. Every surface that
   applies a theme to a document (root provider, builder scope, Fast
   Frame sandbox, Sandpack stylesheet, share/embed) must also inject
   this CSS, or a custom family silently falls back.
   ────────────────────────────────────────────────────────────────────── */

/** id of the <style> tag `injectFontFaces` manages per document. */
export const FONT_FACE_STYLE_ID = "gds-theme-fonts";

/** @font-face rules for a theme's custom faces. Empty string when the
 *  theme carries none (registry-only themes — the common case). */
export function fontFaceCSS(
  faces: CustomFontFace[] | undefined | null
): string {
  if (!faces || faces.length === 0) return "";
  return faces
    .map((f) => {
      const src = f.format
        ? `url("${f.url}") format("${f.format}")`
        : `url("${f.url}")`;
      return [
        "@font-face {",
        `  font-family: "${f.family.replace(/"/g, "")}";`,
        `  src: ${src};`,
        `  font-weight: ${f.weight ?? "100 900"};`,
        // Generous default range so a variable font's wdth axis is
        // reachable via font-stretch utilities (font-stretch-[90%]).
        // Browsers clamp to the font's real fvar range, and fonts with
        // no wdth axis simply ignore it — safe either way. Without a
        // declared range some browsers pin the axis at 100%.
        `  font-stretch: ${f.stretch ?? "50% 200%"};`,
        `  font-style: ${f.style ?? "normal"};`,
        "  font-display: swap;",
        "}",
      ].join("\n");
    })
    .join("\n");
}

/**
 * Upsert the theme's @font-face rules into a document's <head> via a
 * single managed <style id="gds-theme-fonts"> tag. Idempotent and
 * cheap to call on every theme apply: same CSS → no DOM write; a theme
 * with no custom faces removes the tag.
 */
export function injectFontFaces(
  faces: CustomFontFace[] | undefined | null,
  doc: Document = typeof document === "undefined"
    ? (undefined as unknown as Document)
    : document
): void {
  if (!doc) return;
  const css = fontFaceCSS(faces);
  let tag = doc.getElementById(FONT_FACE_STYLE_ID) as HTMLStyleElement | null;
  if (!css) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = doc.createElement("style");
    tag.id = FONT_FACE_STYLE_ID;
    doc.head.appendChild(tag);
  }
  if (tag.textContent !== css) tag.textContent = css;
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

  // Custom faces land on the element's own document — which is the
  // iframe's document when targeting `contentDocument.documentElement`,
  // exactly where the face must live for the family vars to resolve.
  injectFontFaces(theme.typography.fontFaces, target.ownerDocument);

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
