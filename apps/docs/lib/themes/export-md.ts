/**
 * Theme → Markdown exporter.
 *
 * Produces a self-contained spec document for a GeneratedTheme. The output
 * is designed to be pasted into a fresh LLM prompt (Claude, ChatGPT, Cursor,
 * whatever) alongside a design brief, so the model produces UI that looks
 * exactly like the theme even with zero other project context.
 *
 * What it includes:
 *   - Theme summary + full ThemeInput config (round-trippable)
 *   - All three 11-stop ramps as OKLCH triplets + hex equivalents
 *   - Semantic tokens for light + dark modes
 *   - Fixed semantic colors (success / warning / etc.)
 *   - 5-stop chart palette
 *   - Typography resolution (font-family strings, scale, weights, tracking)
 *   - Radius + spacing + effects values
 *   - Component-level defaults
 *   - Tailwind / CSS var conventions
 *   - Component API summary (just enough for an LLM to hand-compose)
 *   - Feel / voice guidance so generated UI matches the theme's character
 *
 * Intentionally ASCII/markdown only — no images, no code that needs to
 * execute. Paste it anywhere.
 */

import { oklchToHex } from "./oklch-to-hex";
import type { GeneratedTheme, Ramp } from "./types";
import { RAMP_KEYS, type RampKey } from "./oklch";

/** Format a single OKLCH triplet compactly, with hex lookup. */
function rowTriplet(triplet: string): { oklch: string; hex: string } {
  const parts = triplet.trim().split(/\s+/);
  if (parts.length < 3) return { oklch: triplet, hex: "" };
  const [l, c, h] = parts.map(Number);
  const oklch = `${l.toFixed(3)} ${c.toFixed(3)} ${Math.round(h)}`;
  const hex = oklchToHex(triplet);
  return { oklch, hex };
}

/** Render an 11-row table for a ramp. */
function rampTable(name: string, ramp: Ramp, hue: number): string {
  const lines = [
    `### ${name} ramp (hue ${Math.round(hue)}°)`,
    ``,
    `| Step | OKLCH | Hex |`,
    `|------|-------|-----|`,
  ];
  for (const step of RAMP_KEYS) {
    const { oklch, hex } = rowTriplet(ramp[step as RampKey]);
    lines.push(`| ${step} | \`${oklch}\` | \`${hex || "—"}\` |`);
  }
  return lines.join("\n");
}

/** Render a semantic token table (light + dark side by side). */
function semanticTable(
  label: string,
  rows: Array<{ token: string; light: string; dark: string; usage: string }>
): string {
  const lines = [
    `### ${label}`,
    ``,
    `| Token | Usage | Light (hex) | Dark (hex) |`,
    `|-------|-------|-------------|------------|`,
  ];
  for (const r of rows) {
    const lightHex = oklchToHex(r.light) || "—";
    const darkHex = oklchToHex(r.dark) || "—";
    lines.push(
      `| \`--${r.token}\` | ${r.usage} | \`${lightHex}\` (\`${r.light}\`) | \`${darkHex}\` (\`${r.dark}\`) |`
    );
  }
  return lines.join("\n");
}

/** Stable JSON pretty-printer for the input snapshot. */
function stringifyInput(theme: GeneratedTheme): string {
  return JSON.stringify(theme.input, null, 2);
}

/** The full template. */
export function generateThemeMarkdown(theme: GeneratedTheme): string {
  const { input, ramps, colors, chart, typography, radius, spacing, effects, components } = theme;
  const intensity = input.intensity ?? "default";

  // Core / derived semantic tokens — two columns (light / dark).
  const mapToken = (token: string) => ({
    token,
    usage: USAGE_HINTS[token] ?? "",
    light: (colors.light as unknown as Record<string, string>)[token],
    dark: (colors.dark as unknown as Record<string, string>)[token],
  });

  const hueDerived = [
    "background",
    "foreground",
    "card",
    "cardForeground",
    "popover",
    "popoverForeground",
    "primary",
    "primaryForeground",
    "secondary",
    "secondaryForeground",
    "muted",
    "mutedForeground",
    "accent",
    "accentForeground",
    "border",
    "input",
    "ring",
  ].map(mapToken);

  const fixedSemantic = [
    "destructive",
    "destructiveForeground",
    "success",
    "warning",
    "info",
    "highlight",
  ].map(mapToken);

  // Chart palette row with hex.
  const chartRows = ([1, 2, 3, 4, 5] as const).map((i) => {
    const triplet = chart[i];
    return { slot: i, triplet, hex: oklchToHex(triplet) || "—" };
  });

  return `# ${theme.name} — Grade Design System Theme

> **Portable theme spec.** Paste this entire file into a fresh LLM prompt along with your design brief. The model will have everything it needs to produce UI that matches this exact theme — colors, typography, spacing, shapes, and the "feel" we're after.

## At a glance

- **Name**: ${theme.name}
- **ID**: \`${input.id}\`
${input.description ? `- **Description**: ${input.description}\n` : ""}- **Hues**: neutral \`${input.hues.neutral}°\` · primary \`${input.hues.primary}°\` · accent \`${input.hues.accent}°\`
- **Intensity**: \`${intensity}\` ${intensity === "muted" ? "(quieter chroma across the board)" : intensity === "vibrant" ? "(punchier chroma across the board)" : "(balanced)"}
- **Typography**: ${input.typography.display} display · ${input.typography.body} body · ${input.typography.mono} mono · scale \`${input.typography.scale}\`
- **Spacing density**: \`${input.spacing.density}\`
- **Radius style**: \`${input.radius.style}\` (base \`${radius.base}\`)
- **Button shape**: \`${components.buttonShape}\` · **Input style**: \`${components.inputStyle}\` · **Card style**: \`${components.cardStyle}\`
- **Shadow preset**: \`${input.effects?.shadows ?? "default"}\` · **Motion intensity**: \`${input.effects?.motionIntensity ?? 1}\`

## How themes work

Every theme in Grade DS is produced by a pure function:

\`\`\`ts
generateTheme(input: ThemeInput) => GeneratedTheme
\`\`\`

A \`ThemeInput\` is a small object (three hues plus a handful of presets). The generator turns it into three 11-stop **OKLCH** color ramps, semantic tokens for four brightness modes (superLight / light / dark / superDark), a chart palette, and concrete values for typography, radius, spacing, and effects. Everything downstream reads from CSS variables set on \`:root\`.

## Full ThemeInput (round-trippable)

\`\`\`json
${stringifyInput(theme)}
\`\`\`

## Color ramps

Three 11-stop OKLCH ramps, generated from the input hues + chromas + global intensity. Every color elsewhere in the theme resolves back to one of these stops.

${rampTable("Neutral", ramps.neutral, input.hues.neutral)}

${rampTable("Primary", ramps.primary, input.hues.primary)}

${rampTable("Accent", ramps.accent, input.hues.accent)}

## Semantic tokens (hue-derived)

Purpose-based tokens drawn from the ramps. Two values per token — the generator produces them for all four brightness modes, but only light + dark are shown here for brevity.

${semanticTable("Core semantic tokens", hueDerived)}

## Fixed semantic tokens (not hue-derived)

Status colors stay consistent across themes so users always read green as success, red as destructive, etc. Accessibility wins over brand cohesion.

${semanticTable("Status colors", fixedSemantic)}

## Chart palette

5-stop categorical palette derived from theme hues. Primary leads, then two hue-rotated variants, then neutral, then accent. Adjacent slots are guaranteed to be visually distinct.

| Slot | OKLCH | Hex |
|------|-------|-----|
${chartRows.map((r) => `| \`--chart-${r.slot}\` | \`${r.triplet}\` | \`${r.hex}\` |`).join("\n")}

## Typography

- **Display font**: \`${typography.fontDisplay}\`
- **Body font**: \`${typography.fontSans}\`
- **Mono font**: \`${typography.fontMono}\`
- **Heading weight**: \`${typography.headingWeight}\`
- **Body weight**: \`${typography.bodyWeight}\`
- **Heading letter-spacing**: \`${typography.headingTracking}\`

### Type scale

| Step | Size |
|------|------|
| \`text-display\` | \`${typography.scale.display}\` |
| \`text-h1\` | \`${typography.scale.h1}\` |
| \`text-h2\` | \`${typography.scale.h2}\` |
| \`text-h3\` | \`${typography.scale.h3}\` |
| \`text-h4\` | \`${typography.scale.h4}\` |
| \`text-h5\` | \`${typography.scale.h5}\` |
| \`text-h6\` | \`${typography.scale.h6}\` |
| body | \`${typography.scale.body}\` |
| body-sm | \`${typography.scale.bodySm}\` |

## Radius, spacing, effects

### Radius

| Step | Value |
|------|-------|
| \`--radius\` (base) | \`${radius.base}\` |
| \`--rds-radius-sm\` | \`${radius.sm}\` |
| \`--rds-radius-md\` | \`${radius.md}\` |
| \`--rds-radius-lg\` | \`${radius.lg}\` |
| \`--rds-radius-xl\` | \`${radius.xl}\` |
| \`--rds-radius-2xl\` | \`${radius["2xl"]}\` |
| \`--rds-radius-full\` | \`${radius.full}\` |

### Spacing

- **Density factor**: \`${spacing.densityFactor}\` (applied as \`var(--rds-density)\` on components that opt in)
- **Base unit**: \`${spacing.baseUnit}\`

### Motion

| Var | Duration |
|-----|----------|
| \`--rds-transition-fast\` | \`${effects.motion.fast}\` |
| \`--rds-transition-base\` | \`${effects.motion.base}\` |
| \`--rds-transition-slow\` | \`${effects.motion.slow}\` |
| \`--rds-transition-slower\` | \`${effects.motion.slower}\` |

### Shadows

All shadows are applied via Tailwind's \`shadow-*\` utilities mapped to these var values.

| Var | Value |
|-----|-------|
| \`--rds-shadow-sm\` | \`${effects.shadows.sm}\` |
| \`--rds-shadow-md\` | \`${effects.shadows.md}\` |
| \`--rds-shadow-lg\` | \`${effects.shadows.lg}\` |
| \`--rds-shadow-xl\` | \`${effects.shadows.xl}\` |

## CSS variable conventions

Every color is stored as a bare \`L C H\` OKLCH triplet and wrapped at call time:

\`\`\`css
:root {
  --primary: ${colors.light.primary};
  --background: ${colors.light.background};
}
\`\`\`

Tailwind config wraps these with \`oklch(var(--x) / <alpha-value>)\` so Tailwind's opacity shortcuts work:

\`\`\`html
<div class="bg-primary text-primary-foreground">...</div>
<div class="bg-primary/50 hover:bg-primary/80">...</div>
<div class="text-muted-foreground border-border/40">...</div>
\`\`\`

## Tailwind class cheat sheet

| Utility | Token |
|---------|-------|
| \`bg-background\`, \`text-foreground\` | page bg + primary text |
| \`bg-card\`, \`text-card-foreground\` | elevated surfaces |
| \`bg-popover\`, \`text-popover-foreground\` | floating menus |
| \`bg-primary\`, \`text-primary-foreground\` | primary action / brand |
| \`bg-secondary\`, \`text-secondary-foreground\` | secondary surface |
| \`bg-muted\`, \`text-muted-foreground\` | subtle surface + subtext |
| \`bg-accent\`, \`text-accent-foreground\` | highlight / hover |
| \`border-border\`, \`border-input\` | default + form borders |
| \`ring-ring\` | focus ring |
| \`bg-destructive\`, \`bg-success\`, \`bg-warning\`, \`bg-info\`, \`bg-highlight\` | status colors |
| \`bg-chart-1\` … \`bg-chart-5\` | chart series |

## Components the theme styles

Import from \`@gradeui/ui\` — all components read theme vars and re-skin automatically:

\`\`\`tsx
import {
  Button, Input, Textarea, Label, Select, Checkbox, RadioGroup, Switch,
  Slider, Toggle, Calendar, Card, Badge, Callout, Skeleton, Separator,
  HoverCard, Popover, Dialog, Sheet, Tooltip, Progress, DropdownMenu,
  Command, Tabs, Accordion, Collapsible, ScrollArea, Table,
  Avatar, AIChat, Logo, SectionBlock, CardBlock, MediaBlock, FAQBlock,
} from "@gradeui/ui";
import "@gradeui/ui/styles.css";
\`\`\`

Every component accepts a \`className\` for layout tweaks. Variants are passed via a \`variant\` prop: \`<Button variant="outline">\`, \`<Callout variant="success">\`, \`<Badge variant="destructive-soft">\`.

## Feel and voice

When generating UI in the ${theme.name} theme, match this character:

${feelNotes(theme)}

## Instructions for the generating LLM

1. **Use semantic tokens first**. Prefer \`bg-primary\`, \`text-foreground\`, \`border-border\` over raw ramp classes. Reach for \`bg-primary-500\` / \`bg-neutral-200\` only when you need a specific shade unavailable as a semantic token.
2. **Status colors are fixed**. Do not use \`success\` for a generic success-feeling visual — it's always green-ish. Use \`primary\` / \`accent\` for brand flavor; \`success\` / \`warning\` / \`destructive\` for actual state.
3. **Respect the shape presets**. If the theme's buttonShape is \`pill\`, don't add \`rounded-none\` to a Button. The component already matches the theme.
4. **Typography scales with the theme**. Heading utilities \`.text-h1\`–\`.text-h6\` pick up the theme's display font automatically; body text inherits the body font. Only override with \`font-mono\` for code-like content.
5. **Charts get theme palette**. Use \`var(--chart-1)\` through \`var(--chart-5)\` for series colors. Don't hardcode hex in charts.
6. **Dark mode is one class**. Add \`dark\` to \`<html>\` (or toggle with the provider's \`setMode("dark")\`). All tokens have dark variants already — no \`dark:\` prefixes needed on most components.
7. **Layout freely**. The theme controls look-and-feel; composition is up to you. Use Tailwind for grids, spacing, flex layout exactly as normal.

## Quick regeneration

To recreate this theme in code:

\`\`\`ts
import { generateTheme, applyThemeToRoot, type ThemeInput } from "@gradeui/ui";

const input: ThemeInput = ${stringifyInput(theme).replace(/\n/g, "\n")};

const theme = generateTheme(input);
applyThemeToRoot(theme, "light"); // or "dark" / "superLight" / "superDark"
\`\`\`

---
*Generated from Grade Design System v1 · ${new Date().toISOString()}*
`;
}

/** One-line usage hints for each semantic token — populates the table. */
const USAGE_HINTS: Record<string, string> = {
  background: "Page / body background",
  foreground: "Primary text",
  card: "Elevated surface background",
  cardForeground: "Text on cards",
  popover: "Floating menu background",
  popoverForeground: "Text inside floating menus",
  primary: "Primary actions, links, default button",
  primaryForeground: "Text on primary-tinted fills",
  secondary: "Secondary surfaces + quiet buttons",
  secondaryForeground: "Text on secondary surfaces",
  muted: "Subtle surfaces (hover states, skeletons)",
  mutedForeground: "Secondary / less-important text",
  accent: "Highlights, hover accents",
  accentForeground: "Text on accent surfaces",
  border: "Default borders",
  input: "Form input borders",
  ring: "Focus ring color",
  destructive: "Destructive actions, errors",
  destructiveForeground: "Text on destructive surfaces",
  success: "Success states",
  warning: "Warning states",
  info: "Informational states",
  highlight: "Emphasis, new features, callouts",
};

/**
 * Heuristic feel notes per theme — tuned by input.intensity + components
 * + typography. Gives the generating LLM concrete direction for voice +
 * composition, not just colors.
 */
function feelNotes(theme: GeneratedTheme): string {
  const notes: string[] = [];
  const { input, components } = theme;

  if (input.intensity === "muted") {
    notes.push(
      "- **Quiet and restrained.** Avoid heavy saturation, glowing effects, or loud contrast jumps. Let whitespace do the work."
    );
  } else if (input.intensity === "vibrant") {
    notes.push(
      "- **Loud and confident.** Primary color wants to lead. Use it on hero CTAs, key metrics, empty states. Don't be shy."
    );
  } else {
    notes.push(
      "- **Balanced.** Neither shouty nor sleepy — a workhorse feel suited to product interfaces."
    );
  }

  if (input.spacing.density === "roomy") {
    notes.push(
      "- **Generous spacing.** Stretch things out — reach for \`gap-6\`, \`gap-8\`, \`p-6\`, \`p-8\`. Airy is the vibe."
    );
  } else if (input.spacing.density === "tight") {
    notes.push(
      "- **Dense layouts.** Pack information in — \`gap-2\`, \`gap-3\`, \`p-3\`, \`p-4\`. Scan-friendly dashboard energy."
    );
  } else {
    notes.push("- **Standard density.** Use Tailwind's default spacing ladder.");
  }

  if (input.radius.style === "pill") {
    notes.push(
      "- **Fully rounded.** Controls are pill-shaped. Use \`rounded-full\` on custom chips / pills too."
    );
  } else if (input.radius.style === "sharp") {
    notes.push(
      "- **Square corners.** Zero radius everywhere — very architectural. Do not add curves."
    );
  } else if (input.radius.style === "round") {
    notes.push(
      "- **Rounded and friendly.** Corner radius is noticeable (≈14px base). Avoid sharp edges."
    );
  } else {
    notes.push("- **Standard rounded corners.**");
  }

  const displayFont = input.typography.display;
  if (displayFont === "fraunces" || displayFont === "instrumentSerif" || displayFont === "sourceSerif") {
    notes.push(
      "- **Editorial serif headings.** Treat headings like magazine titles — give them space and weight. Serifs reward larger sizes."
    );
  } else if (displayFont === "geist" || displayFont === "inter") {
    notes.push(
      "- **Modern technical sans.** Clean, functional, neutral. Good for product UIs."
    );
  }

  if (components.cardStyle === "outlined") {
    notes.push(
      "- **Cards are outlined**, not shadowed. Rely on borders + spacing for hierarchy."
    );
  } else if (components.cardStyle === "elevated") {
    notes.push(
      "- **Cards have real elevation.** Use shadows to stack content visually."
    );
  } else if (components.cardStyle === "glass") {
    notes.push(
      "- **Glass / frosted cards.** Use translucent surfaces over background imagery or gradients."
    );
  }

  if (components.buttonShape === "pill") {
    notes.push("- **Buttons are pills** — don't override with square corners.");
  }

  return notes.join("\n");
}

/**
 * Trigger a browser download of the theme's markdown spec.
 * Client-side only — no-ops during SSR.
 */
export function downloadThemeMarkdown(theme: GeneratedTheme): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const content = generateThemeMarkdown(theme);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ramp-theme-${theme.input.id}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
