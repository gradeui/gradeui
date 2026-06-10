# @gradeui/core

## 1.1.0

### Minor Changes

- 2845f87: The primitive token layer, the BYODS registry, and modular type scales.

  **@gradeui/core — first real release.** No longer a placeholder. Ships the primitive token layer (layers 1–2 of the token model):

  - `tokens.css` (import via `@gradeui/core/tokens.css`) — brand color ramps, neutral grays, semantic role aliases, spacing scale, border radii, font stacks + the new `--font-display` / `--font-body` slots, and the type scale. Authored source of truth.
  - Typed data generated from the CSS (`GDS_COLOR_RAMPS`, `GDS_NEUTRALS`, `GDS_SEMANTIC_ALIASES`, `GDS_SPACING`, `GDS_RADIUS`, `GDS_FONT_FAMILIES`, `GDS_TYPE_SCALE`, `GDS_RAMP_NAMES`) via `scripts/generate-tokens.mjs`.
  - Modular scales: `GDS_MODULAR_SCALES` (musical-interval ratios), `modularRamp`, `modularStep`, and `modularTypeSizes` — the middle-out (Utopia-model) ladder over Tailwind's size vocabulary (`GDS_TYPE_SIZE_NAMES`, base mid-ladder, reciprocal descent, floored).
  - Semantic alias model: every alias is a ROLE pointing at a whole ramp. Added palette roles `--gds-primary` / `--gds-secondary` / `--gds-neutral`; removed `--gds-teal-semantic` (named a color, not a meaning) and `--gds-energy` (brand flavor, not a role).

  **@gradeui/ui.** Now depends on `@gradeui/core`; `styles/globals.css` imports `@gradeui/core/tokens.css` instead of carrying the primitives inline (built `dist/styles.css` remains self-contained and is verified var-identical). Theme engine: `ThemeInput.typography.scale` accepts modular scale ids (`TypeScale = TypeScalePreset | ModularScaleId`) and generates the semantic ladder middle-out from the body size; legacy presets unchanged.

  **@gradeui/studio.** New `registry` module (`@gradeui/studio/registry`): the `DesignSystemRegistry` contract for bring-your-own-design-system, with `GRADE_REGISTRY` as the default assembled from the playbook constants. `buildSystemPrompt()` takes an optional registry (component list, DS name, package specifier); output with the default registry is byte-identical to the previous prompt.

## 1.0.0

### Major Changes

- fcc5317: **BREAKING: runtime token namespace renamed from `rds-*` / `ramp-*` to `gds-*` / `grade-*`**

  The last of the legacy `ramp-ds`-era token names are gone. Every runtime surface that touches the brand prefix has been renamed in one sweep:

  | Old                    | New                    | Where it lives                                                                                                                                                          |
  | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `--rds-*`              | `--gds-*`              | CSS custom properties (every theme token, every component token — ~720 references)                                                                                      |
  | `.rds-*`               | `.gds-*`               | CSS class names (`gds-app-shell`, `gds-card`, `gds-button`, `gds-aura-*`, `gds-surface-*`, `gds-flex`/`grid`/`row`/`stack`, the `gds.*` Tailwind color namespace, etc.) |
  | `data-ramp-theme`      | `data-grade-theme`     | HTML attribute on `<html>` set by `GRADE_PRE_HYDRATION_SCRIPT`                                                                                                          |
  | `'ramp-mode'`          | `'grade-mode'`         | localStorage                                                                                                                                                            |
  | `'ramp-theme'`         | `'grade-theme'`        | localStorage                                                                                                                                                            |
  | `'ramp-user-themes'`   | `'grade-user-themes'`  | localStorage                                                                                                                                                            |
  | `'rds-playgrounds'`    | `'gds-playgrounds'`    | localStorage                                                                                                                                                            |
  | `'rds-template-saves'` | `'gds-template-saves'` | localStorage                                                                                                                                                            |
  | `'rds-chat-settings'`  | `'gds-chat-settings'`  | localStorage                                                                                                                                                            |

  ### What stays

  - `--ramp-*` CSS custom properties — these are the per-step OKLCH color-ramp values (`--ramp-50` … `--ramp-950`) and refer to _color ramps_ as a technical concept, not the Ramp brand. Untouched, as in the previous Ramp→Grade pass.
  - The React API (`GradeThemeProvider`, `useGradeTheme`, `GRADE_PRE_HYDRATION_SCRIPT`) — already on the new names from the prior rebrand.

  ### Migration

  Anyone consuming `@gradeui/ui` from npm needs to:

  1. **CSS overrides** — find/replace `--rds-` → `--gds-` and bare `.rds-` → `.gds-` in any stylesheet that targets Grade tokens or classes.
  2. **Tailwind config** — if you extended Grade's colour palette, update references to the `rds` namespace (`text-rds-gray-500` → `text-gds-gray-500`, etc.).
  3. **HTML attribute targeting** — replace `[data-ramp-theme="…"]` selectors with `[data-grade-theme="…"]`.
  4. **localStorage** — no migration shim ships with this release. The library had no external installs prior to this change, so anyone on a dev branch will get a one-time loss of their saved theme / playground / template-saves selection on next load.

  ### Why now

  The rename was on the books from the original Ramp→Grade rebrand. It was deferred to avoid wiping persisted user state for any in-flight consumer. With no public installs yet, "now" was the cheapest moment to take it.

  The rename script (`scripts/rename-rds-to-gds.py`) is checked in. It walks the monorepo, runs a longest-first replacement list, and protects technical substrings (`--ramp-*`, `@rds-energy`, `rds-energy-zap` URL slug). Re-runnable and idempotent.

## 0.0.2

### Patch Changes

- 74baf04: Initial public release of @gradeui/core, @gradeui/ui, and @gradeui/pro.
