---
"@gradeui/ui": minor
---

Theme contract: token-to-ramp mapping seam, two-tier muted text, tighter vertical Field rhythm.

- `ThemeInput.tokenOverrides` remaps any semantic token to a ramp step (or a pure OKLCH value), per mode. The generator merges overrides over the mode's tuned map; `tokenRefsForMode()` exposes the effective mapping for editors. Overrides store the STEP, not the colour, so themes re-resolve when hues change.
- New `--super-muted-foreground` token + `text-super-muted-foreground` utility: the quietest text tier (timestamps, ghost hints, fine print), sitting at the old muted-foreground step. `muted-foreground` itself moves one step toward the foreground in every mode for firmer secondary text (light/superLight neutral 500 to 600, dark 400 to 300, superDark 500 to 400). Static stylesheet themes and scope remaps updated to match.
- Field: the label-to-control gap is now per orientation. Vertical (and the vertical phase of responsive) tightens to gap-2; horizontal rows keep gap-3.
