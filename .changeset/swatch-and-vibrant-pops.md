---
"@gradeui/ui": minor
---

Add `Swatch` and `SwatchGroup`. `Swatch` is a single colour chip that binds
to a live theme token (`token="brand-3"` → `oklch(var(--brand-3))`,
re-voicing on theme change) or a raw `color`. Sizes are the t-shirt scale
(xs–xl); `shape` is square / rounded (rides `--radius`) / circle. A
transparency checkerboard sits behind the fill and a foreground-based border
is drawn on top (`rounded-[inherit]`) so the edge reads on any surface and
survives an opaque fill. `onSelect` makes it a pickable `<button>`
(`selected` draws the shared selection ring); `onColorChange` makes it an
editable colour well that hosts a native `<input type="color">` behind the
chip — the OS picker stays native, the presentation stays the DS chip.
`SwatchGroup` arranges a set as a spaced `row` or an overlapping `stack` and
cascades `size`/`shape` to its children.

Louder brand pops: `--brand-1…8` are now a vivid spectrum fanned from the
theme's primary and accent hues (high OKLCH chroma, bright lightness) instead
of being seeded from the muted, data-viz-tuned chart palette. They still
track the theme, so switching theme or dragging hue re-voices them.
