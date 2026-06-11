---
"@gradeui/ui": minor
---

Default palette refresh (THEME-MIGRATION A7.1): the base `:root`/`.dark`
semantic tokens in `styles/globals.css` now match the current Studio
design (warm-cream hue-85 neutrals, near-black primary, Inter/Geist
type, 0.25rem radius). They previously still carried the pre-redesign
terracotta theme (hue 20/40 palette, Fraunces serif, 0.875rem radius),
which changed the out-of-box look of the package AND leaked the old
colours into any surface that loaded both this stylesheet and the docs
one (the MCP preview panel's "pink progress bar"). 35 custom-property
values updated; rule set verified structurally identical via
scripts/css-rule-diff.mjs (0 added / 0 removed; only the two palette
rules changed). Apps applying a theme at runtime (GradeThemeProvider,
Studio, embeds) are unaffected — this changes only the un-themed
defaults.

New export (A7.2): `@gradeui/ui/styles/globals.css` — the raw Tailwind
v4 source stylesheet (@theme blocks, dark variant, plugin, palette,
component layer), for apps that compile Tailwind themselves and want
the design system as their base. `apps/docs` now consumes it this way
instead of maintaining a 1,700-line copy. The `styles/` directory is
now included in the published package.
