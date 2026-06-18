---
"@gradeui/ui": patch
---

Button: every resting variant is now flat — dropped `shadow` from `variant="default"` and `shadow-sm` from `secondary`, `outline`, and `destructive`. On solid/bordered fills the theme's bevel-highlight shadow read as embossed; flat is the intended resting look, and the tactile/beveled treatment stays exclusive to `variant="raised"` (and the `raised` prop).
