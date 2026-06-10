---
"@gradeui/ui": major
---

**Breaking — Tailwind v4 native `@theme` migration (THEME-MIGRATION.md Phase A).**

The v3 config bridge is gone. Everything `tailwind.config.ts` / `tailwind-preset.ts` defined (brand ramps, OKLCH semantic roles, `text-2xs`, radius, elevation shadow scale, surface colors, backdrop blurs, keyframes/animations, `darkMode: "class"`, content globs, tailwindcss-animate) now lives in `styles/globals.css` as native `@theme inline reference` declarations, `@source` directives, `@custom-variant dark`, and `@plugin "tailwindcss-animate"`.

- **Removed: the `@gradeui/ui/tailwind-preset` export.** There is no JS Tailwind config for consumers to extend anymore — `@gradeui/ui/styles.css` is fully self-contained (tokens + `@theme` bridge + all utilities the components use). Consumers running their own Tailwind v4 build should add an `@source` for `node_modules/@gradeui/ui/dist` instead.
- **`dist/styles.css` is unchanged at the rule level.** Verified by a selector→declarations structural diff of the old (`@config`) vs new (native `@theme`) unminified output under Tailwind 4.3.0: identical rule sets (2,512 = 2,512), zero rules added or removed. The only textual deltas are v4 preflight's font indirection (`var(--default-font-family, …)` instead of `var(--font-sans, …)`) and Tailwind's emitted default `--font-sans`/`--font-mono`/`--default-*-font-family` theme vars — all of which resolve to the same computed values because the runtime `--font-sans`/`--font-mono` are defined in the unlayered `:root` of `@gradeui/core/tokens.css`. Opacity shortcuts (`bg-primary/50`) compile to `color-mix()` instead of `<alpha-value>` substitution — same rendered color.
- Semantic role colors stay raw OKLCH triplets wrapped at use (`oklch(var(--primary))`) — the `GradeThemeProvider` / `applyThemeToRoot` runtime contract is untouched.

This is the prerequisite for Phase B (density → `--spacing`, modular type scales → `--text-*`): with the utility layer driven by native theme variables, the theme generator can re-pitch spacing and type across every screen ever generated.
