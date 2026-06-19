---
"@gradeui/ui": patch
---

Toggle / ToggleGroup dense sizes now scale their text and icons: `2xs` drops to `text-2xs` + `size-3` icons and `xs` to `text-xs`, so a labelled segmented control (e.g. a Row/Stack direction toggle) reads at property-panel density instead of inheriting the base `text-sm`.
