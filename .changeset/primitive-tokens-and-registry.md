---
"@gradeui/core": minor
"@gradeui/ui": minor
"@gradeui/studio": minor
---

The primitive token layer, the BYODS registry, and modular type scales.

**@gradeui/core — first real release.** No longer a placeholder. Ships the primitive token layer (layers 1–2 of the token model):

- `tokens.css` (import via `@gradeui/core/tokens.css`) — brand color ramps, neutral grays, semantic role aliases, spacing scale, border radii, font stacks + the new `--font-display` / `--font-body` slots, and the type scale. Authored source of truth.
- Typed data generated from the CSS (`GDS_COLOR_RAMPS`, `GDS_NEUTRALS`, `GDS_SEMANTIC_ALIASES`, `GDS_SPACING`, `GDS_RADIUS`, `GDS_FONT_FAMILIES`, `GDS_TYPE_SCALE`, `GDS_RAMP_NAMES`) via `scripts/generate-tokens.mjs`.
- Modular scales: `GDS_MODULAR_SCALES` (musical-interval ratios), `modularRamp`, `modularStep`, and `modularTypeSizes` — the middle-out (Utopia-model) ladder over Tailwind's size vocabulary (`GDS_TYPE_SIZE_NAMES`, base mid-ladder, reciprocal descent, floored).
- Semantic alias model: every alias is a ROLE pointing at a whole ramp. Added palette roles `--gds-primary` / `--gds-secondary` / `--gds-neutral`; removed `--gds-teal-semantic` (named a color, not a meaning) and `--gds-energy` (brand flavor, not a role).

**@gradeui/ui.** Now depends on `@gradeui/core`; `styles/globals.css` imports `@gradeui/core/tokens.css` instead of carrying the primitives inline (built `dist/styles.css` remains self-contained and is verified var-identical). Theme engine: `ThemeInput.typography.scale` accepts modular scale ids (`TypeScale = TypeScalePreset | ModularScaleId`) and generates the semantic ladder middle-out from the body size; legacy presets unchanged.

**@gradeui/studio.** New `registry` module (`@gradeui/studio/registry`): the `DesignSystemRegistry` contract for bring-your-own-design-system, with `GRADE_REGISTRY` as the default assembled from the playbook constants. `buildSystemPrompt()` takes an optional registry (component list, DS name, package specifier); output with the default registry is byte-identical to the previous prompt.
