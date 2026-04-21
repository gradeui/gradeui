---
"@gradeui/ui": minor
---

Alert gains paired soft/deep status tokens across success, warning, info,
highlight, and destructive. The `-soft` token drives tinted surfaces and
`-deep` drives on-surface text and icon colour, derived through
`deriveAlertPair` in the theme pipeline so both remain legible across
generated palettes. Exposed as `bg-*-soft`, `text-*-deep`, and
`border-*/30` utilities via the Tailwind preset.

Finishes the Ramp → Grade rename: `ramp-mode-switcher`,
`ramp-theme-provider`, and `ramp-theme-switcher` are now `grade-*`.
`@ramp-ds/ui` consumers should switch to `@gradeui/ui` (the old package
is defunct).
