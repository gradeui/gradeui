---
"@gradeui/ui": minor
---

**Phase B — the at-will theming switch (THEME-MIGRATION.md B1–B5).** The theme generator now reaches into Tailwind's utility layer:

- **B1 Density → `--spacing`.** `GeneratedSpacing` gains `unit` — the Tailwind v4 spacing base derived from the density factor (tight 0.2125rem / default 0.25rem / roomy 0.3rem, floored at 0.125rem). `themeToCSSVars` emits it, so every `p-*`/`gap-*`/`m-*`/`size-*` in every screen ever generated re-scales when density changes — retroactively.
- **B2 Modular scale → `--text-*`.** When `typography.scale` is a modular ratio id, `GeneratedTypography.namedScale` carries the full 2xs…7xl ladder (middle-out from body, descending steps floored at 0.625rem) and is emitted as `--text-<step>` + `--text-<step>--line-height` (line-heights tighten as size grows, mirroring the default ladder's curve). Presets emit nothing — today's static values stand. `--text-2xs` moved from `@theme inline` to a plain `@theme` block so the utility references the variable (runtime-re-pitchable); computed default unchanged.
- **B4 Role ramp families.** Every semantic alias is now a whole ramp: `GeneratedTheme.roleRamps` carries success/warning/info/highlight/destructive ramps (seeded from the fixed status hues); `themeToCSSVars` emits `--gds-<role>-<step>` triplets for those plus primary/accent/neutral. New `--color-<role>-<step>` `@theme` entries (with flat-role fallbacks) + safelists make `bg-success-100` / `text-warning-800` / `border-primary-300`-style utilities real (+231 rules, purely additive). `neutral` ships as runtime vars only — `--color-neutral-*` would shadow Tailwind's default palette.
- **B5 Guards.** Min text size 0.625rem, min spacing base 0.125rem, modular ratios clamped to 1.02–1.8, density factor clamped to 0.6–1.6. Style-panel sliders should mirror these bounds.

Existing saved themes with non-default density will now actually re-scale spacing (previously only `--gds-density` moved). That's the feature. Known parity limit: the Sandpack check renderer (CDN Tailwind v3) gets the role-family colors via its config but cannot re-pitch `--spacing`/`--text-*` — Fast Frame is the live preview and renders all of it.
