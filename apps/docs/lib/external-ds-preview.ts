/**
 * Shared preview plumbing for EXTERNAL design systems (BYODS).
 *
 * Both renderers need the same three things to paint a non-gradeui DS:
 *
 *   1. `EXTERNAL_TW_CSS` — Tailwind v4 SOURCE compiled by whichever v4
 *      browser build the renderer runs (Sandpack: CDN script in the
 *      generated index.html; Fast Frame: the vendored build in
 *      public/vendor). Carries tw-animate-css (the plugin their preset
 *      imports, un-resolvable as an npm @import in-browser), the .dark
 *      class variant, and the @theme inline bridge mapping semantic
 *      utility names onto the semantic vars the registry's
 *      `runtime.previewCss` defines. shadcn vocabulary — any
 *      shadcn-shaped DS gets the same mapping for free.
 *   2. The DS's own tokens — `registry.runtime.previewCss`, plain CSS.
 *   3. Fonts — `EXTERNAL_FONTS_URL` / `EXTERNAL_FONT_VARS_CSS`.
 *
 * Two-renderer rule: change this file, not per-renderer copies.
 */

import { TW_ANIMATE_CSS } from "@/lib/tw-animate.generated";

/** The @theme inline bridge (v4 source, no <style> wrapper). */
export const EXTERNAL_TW_THEME = `@custom-variant dark (&:is(.dark *));
@theme inline {
  --font-sans: var(--ds-font-font-sans, ui-sans-serif, system-ui), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--ds-font-font-serif, ui-serif), ui-serif, Georgia, serif;
  --font-mono: var(--ds-font-font-mono, ui-monospace), ui-monospace, SFMono-Regular, monospace;
  --font-display: var(--ds-font-font-display, ui-sans-serif), ui-sans-serif, system-ui, sans-serif;
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-outline: var(--outline);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-card-border: var(--card-border);
  --color-link: var(--link);
  --color-link-visited: var(--link-visited);
  --color-sidebar: var(--sidebar-background);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-lg: var(--radius, 0.5rem);
  --radius-md: calc(var(--radius, 0.5rem) - 2px);
  --radius-sm: calc(var(--radius, 0.5rem) - 4px);
}`;

/** Everything a v4 browser build should compile for an external DS.
 *  When the registry ships its own @theme block (`runtime.previewThemeCss`
 *  — the DS's full utility vocabulary lifted verbatim from its preset),
 *  that REPLACES the generic bridge above: the generic bridge covers only
 *  semantic names, so primitive utilities (text-green-600, rounded-md,
 *  font-medium) would compile against stock Tailwind — visibly not the
 *  design system. */
export function externalTwCss(previewThemeCss?: string): string {
  return `${TW_ANIMATE_CSS}
@custom-variant dark (&:is(.dark *));
${previewThemeCss ?? EXTERNAL_TW_THEME}`;
}

/** @deprecated generic-bridge form — prefer externalTwCss(registry.runtime?.previewThemeCss). */
export const EXTERNAL_TW_CSS = externalTwCss();

export const EXTERNAL_FONTS_URL =
  "https://fonts.googleapis.com/css2" +
  "?family=Inter:wght@100..900" +
  "&family=Poppins:wght@300;400;500;600;700" +
  "&family=Geist+Mono:wght@100..900" +
  "&display=swap";

/** :root aliases bridging --ds-font-* primitives onto the --font-* slots
 *  plain (non-utility) CSS reads — body copy, headings. */
export const EXTERNAL_FONT_VARS_CSS = `--font-sans: var(--ds-font-font-sans, Inter), ui-sans-serif, system-ui, sans-serif;
--font-display: var(--ds-font-font-display, Poppins), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--ds-font-font-mono, "Geist Mono"), ui-monospace, monospace;`;
