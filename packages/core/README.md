# @gradeui/core

Foundations for the Grade Design System — the **primitive token layer** (layers 1–2 of the token model; see `STUDIO-BYODS.md` "Tokens: the layering rule" at the repo root).

## What ships today

**CSS** — `styles/tokens.css`, the authored source of truth:

```css
@import "@gradeui/core/tokens.css";
```

Brand color ramps (`--gds-green-50…950` ×7 ramps), neutral grays, semantic aliases (`--gds-success` → `var(--gds-green-600)`), spacing scale, border radii, font stacks (`--font-sans` / `--font-mono`), and the type scale. `@gradeui/ui`'s `globals.css` and `apps/docs` both import it — primitives are defined exactly once.

**Typed data** — generated from the CSS by `scripts/generate-tokens.mjs` (edit the CSS, then `pnpm -F @gradeui/core generate`; also runs on prebuild):

```ts
import {
  GDS_COLOR_RAMPS,    // ramp name → { base, primaryStep, steps: { 50: "#…", … } }
  GDS_NEUTRALS,       // black / white / gray ramp
  GDS_SEMANTIC_ALIASES, // success → { ramp: "green", step: 600 }
  GDS_SPACING, GDS_RADIUS,
  GDS_FONT_FAMILIES, GDS_TYPE_SCALE,
  GDS_RAMP_NAMES,
} from "@gradeui/core";
```

Consumers: the Studio theme picker (choose primary / secondary / neutral palettes), the variables viewer (table of ramps with per-step override), and the BYODS registry's theme field.

## Layering rule

Component tokens (`--gds-carousel-*`, `--gds-composer-*`, …) deliberately do **not** live here. They're part of each component's contract and ship with `@gradeui/ui`, referencing the primitives below them. Keeping the tokens layer component-agnostic is what makes it consumable on its own (and is the mistake to avoid that we've seen in real-world tokens packages).

## Still to migrate

The theme engine (`lib/themes/*` in `@gradeui/ui`: OKLCH generator, `applyThemeToRoot`, built-in `ThemeInput`s) and `cn`. Re-exports from `@gradeui/ui` will keep existing consumers working when that lands.
