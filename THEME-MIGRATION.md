# THEME-MIGRATION — At-will theming: the path to the magic demo

**Status:** plan (June 10, 2026). Priority work. No external users yet, so no compatibility constraints: we can be aggressive.
**Goal (Step 3, "real magic"):** generate any screen, then drag three controls — hue, type ratio, density — and the whole screen re-themes live, including screens generated before the feature existed. The opposite of one-and-done.
**Why it matters commercially:** every usability session says the same thing — people want their own design system and they want it done FOR them. At-will theming is the substrate that makes import-from-reference (STUDIO-BYODS.md north star) trustworthy: the system can only "just know" into knobs that actually turn.

The thesis in one line: vibe-coded tools bake raw values into markup, so the only edit is regeneration; Grade output binds only to contracts, so the binding can be re-pointed forever. This doc is the work plan to make every binding real.

---

## Phase A — Tailwind v4 native @theme migration (zero visual change)

The single biggest unlock. Today both `packages/ui/styles/globals.css` and `apps/docs/app/globals.css` run the v4 engine against a v3 config (`@config "../tailwind.config.ts"` loading the preset: colors mapped to `--gds-*`/role vars, text-2xs, radius, plugins, content globs). The file comments already call the @theme rework "the next pass". v4's killer property: **all spacing utilities derive from one `--spacing` base variable, and all text utilities from `--text-*` variables.** Native @theme is what lets a theme re-pitch the entire utility layer.

- **A1. Inventory the bridge.** Catalogue everything `tailwind.config.ts` + `tailwind-preset.ts` define (both packages): color mappings, type sizes, radius, keyframes, plugins (tailwindcss-animate), content globs incl. the docs config's scan of `packages/ui/dist`.
- **A2. Translate to native `@theme`.** Colors, radius, fonts, type sizes, keyframes become `@theme` declarations in globals.css. **Gotcha:** role colors are stored as raw OKLCH triplets (`--primary: 0.61 0.15 160`) and wrapped at use (`oklch(var(--primary))`); `@theme` variables referencing other variables need `@theme inline`. Decide per family: either migrate roles to full `oklch()` values (the "raw-triplet → native @theme colour migration" the comments anticipate) or use `@theme inline` wrappers. Prefer full values + `color-mix()` where alpha is needed; fewer moving parts.
- **A3. Content scanning.** Replace config `content` globs with `@source` directives (the `@source inline()` safelists already in globals.css stay as-is).
- **A4. Plugins.** `tailwindcss-animate` via `@plugin`.
- **A5. Remove `@config`** once parity is proven. Delete `tailwind.config.ts` / `tailwind-preset.ts` or reduce to a stub for tooling that still reads it (check the Studio fixed-stylesheet build and `packages/ui` `@source` scan of component sources).
- **A6. Verify — this phase ships ONLY at zero visual change.**
  - Class-level diff: parse old vs new `dist/styles.css` into selector → declarations maps; assert equality (the var-diff method used for the core extraction, upgraded to whole rules).
  - Screenshot suite: the Playwright runner in `@gradeui/skills` over the docs component pages + a set of reference scaffolds, before/after, pixel-diff with a tolerance.
  - Eyeball pass on /studio (Fast Frame renders against the built stylesheet; remember the dist rebuild gotcha).
- **A7. (Optional but recommended while we're in there)** Kill the docs globals.css duplication: `apps/docs` imports `@gradeui/ui/styles.css` + a small docs-only layer, instead of carrying a 1,500-line copy. The core extraction already proved the import mechanism. Halves every future CSS change.

**Effort:** one focused session for A1–A5 on packages/ui, a second for docs + verification. **Risk:** moderate; entirely contained by A6's zero-diff gate. **Rollback:** keep `@config` in the tree until A6 passes; reverting is one import line.

## Phase B — Wire the ratios (the at-will switch)

With native @theme, the theme generator gains reach into the utility layer.

- **B1. Density → `--spacing`.** `SpacingDensity` presets (and later a full modular ratio) emit a `--spacing` base (e.g. compact 0.225rem, default 0.25rem, spacious 0.275rem). Every `p-*`, `gap-*`, `m-*`, `size-*` in every screen ever generated re-scales. This is the retroactive magic.
- **B2. Type scale → `--text-*`.** When `typography.scale` is a modular id, the generator emits the full named ladder from `modularTypeSizes(1, ratio)` (2xs…7xl, base mid-ladder, reciprocal descent, floored) as `--text-*` variables, alongside the existing semantic `--text-h1`-style vars. Presets keep emitting today's values. Line-heights: derive per step (tighter as size grows; reuse the current ladder's line values as the curve).
- **B3. Emit + apply paths.** Extend `GeneratedTheme` + `themeToCSSVars` + `applyThemeToRoot` (BOTH copies of lib/themes, they are deliberate duplicates) and the preview injection paths. **Two-renderer rule from CLAUDE.md applies:** the var payload must flow through both `apps/docs/app/fast-sandbox/page.tsx` (Fast Frame) and `apps/docs/lib/chat-sandpack.ts` (Sandpack parity).
- **B4. Role ramp families.** Generate per-step role variables from the alias model (June 10 decision: EVERY semantic alias points at a whole ramp; `--gds-success` is a family because status displays many ways — soft 100 bg, solid 600 fill, 800 text). Emit `--gds-primary-50…950`, `--gds-success-50…950` etc. from the alias targets, and `--color-*` @theme entries so utilities like `bg-success-100` exist. `energy` and `teal-semantic` are gone; do not reintroduce.
- **B5. Guards.** Floors: min text size (0.625rem), min spacing base; clamp ratio inputs. The style panel sliders get the same bounds.

**Effort:** one session. **Risk:** low after Phase A; visual change only when a user moves a control, which is the point.

## Phase C — Close the leaks (generated output never escapes the contracts)

- **C1. Prompt rules.** Rule 7 gets siblings: no arbitrary text sizes (`text-[15px]`), no arbitrary spacing (`p-[18px]`, `gap-[7px]`), no raw radius. Point the model at scale steps and the named ladder. Keep the existing allowance for structural arbitrary sizes (`min-h-[300px]` containers) but steer toward scale-reachable values.
- **C2. Validator.** `validateAgainstContract` (packages/studio core) learns to flag theme-unreachable absolutes in generated JSX, severity-tagged like the other review skills. Wire into the existing validation gate; the rubric/verify loop reuses it.
- **C3. Audit existing scaffolds + sidecars** for baked absolutes that would freeze under re-theming; fix the worst offenders (they're also what the model imitates).

**Effort:** half a session. **Risk:** minimal.

## Phase D — Step 3: the magic demo

- **D1. The three controls already exist** (hue rows, Scale select, density segmented). Compose a "magic bar" surface: a generated screen front and center, hue / ratio / density floating beside it, everything live. Could be a playground scaffold (camera-tour style showcase) + a docs/home demo via the lib/demo spine.
- **D2. Retroactivity proof:** load screens saved BEFORE Phase B, drag, confirm everything moves. That's the anti-one-and-done receipt.
- **D3. Capture it:** ScreenAnimator/Motion demo for the homepage. This demo IS the marketing for "your design system, done for you".

## After Step 3 (parallel tracks, unblocked)

Button token pilot (component assignment) → contracts at component depth. MCP contract tools (`get_design_contracts`, `apply_theme_input`, propose flow) → "just knows" front door. Import/verify loop with decomposed confidence scores (theme/layout/content fidelity) → the reference-image north star. All specified in STUDIO-BYODS.md.

## Publishing — the migration ships through npm too

Every phase lands in the PUBLISHED packages, not just the apps. The Changesets flow (publish.yml on main) carries it; what each phase owes npm:

- **Already owed by today's diff (pre-Phase A):** `@gradeui/core`'s first REAL release (tokens.css + GDS_* data exports; `files` now includes `styles/`, exports map carries `./tokens.css`) and `@gradeui/ui` bumps with the new `@gradeui/core` dependency (workspace:* converts to a real version on publish — core must publish before or with ui) plus the TypeScale extension and font slots. `@gradeui/studio` bumps for the registry. Write the changesets when you commit today's work.
- **Phase A:** the built `dist/styles.css` stays SELF-CONTAINED — the Tailwind build inlines core's `@import`, so consumers who only use the stylesheet see zero packaging change (verified today: identical var output). But removing `tailwind.config.ts` / `tailwind-preset.ts` deletes part of @gradeui/ui's potential public surface (consumers extending their own Tailwind config from the preset). No external installs exist, so remove cleanly now rather than carrying a stub forever — but it's formally breaking, so take the major/minor decision consciously in the changeset.
- **Phase B:** `GeneratedTheme` shape changes ship in @gradeui/ui's theme engine (the packages/ui copy IS the published one; the docs copy is the vendored twin — keep them in lockstep as always).
- **Phase C:** validator changes ship via `@gradeui/studio`.
- **Rule of thumb:** every phase ends with `pnpm changeset` before merge; core publishes first in any release train that touches it.

## Order of execution

A (ui) → A (docs + verify) → B → C → D. A7 (kill docs CSS duplication) slots into the second A session. Phases are sequential; nothing in B–D starts until A6's zero-diff gate passes.
