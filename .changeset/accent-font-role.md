---
"@gradeui/ui": minor
---

Typography gains an **accent** font role — a supplementary display face (eyebrows, pull quotes, stylised bits) alongside display / body / mono. Themes carry `typography.accent` (defaults to Instrument Serif, overridable from the picker like any other role); the generator resolves it to `--font-accent`, and a new `font-accent` Tailwind utility applies it (falling back to the display/sans stack until a theme sets one).
