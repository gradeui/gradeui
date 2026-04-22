---
"@gradeui/ui": patch
---

Fix `ThreeScene` palette failing when tokens are authored in `oklch()` / `oklab()` / `color(srgb …)`.

0.5.1 resolved CSS expressions via a DOM probe, but `getComputedStyle` preserves CSS Color 4 formats — so `var(--primary)` in a gradeui theme came out as `oklch(0.74 0.18 350)`, which `THREE.Color.setStyle()` can't parse and silently rendered black.

The resolver now rasterises the computed colour through a 1×1 canvas, which is guaranteed to gamut-convert any CSS colour to sRGB bytes. Result: `var(--primary)` on an `oklch`-based theme round-trips into `rgb(r, g, b)` before THREE sees it.

Fast path retained: if the browser already returned `rgb(…)` form, we skip the canvas step.
