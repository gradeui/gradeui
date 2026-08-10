---
"@gradeui/ui": patch
---

Callout: the title sits at the description's text-sm size with font-semibold carrying the hierarchy (letter-spacing left to the theme), and the icon slot grows to 20px against a 32px text inset. Selection cards (RadioCard / CheckboxCard): the rest-state ring falls back to `--super-muted-foreground` instead of `--border`, so the control reads as a control on near-white backgrounds while staying per-mode calibrated; the `--gds-selection-card-control` override seam is unchanged.
