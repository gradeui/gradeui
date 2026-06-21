---
"@gradeui/ui": minor
---

Add three token-led colour/fill controls:

- **ColorPicker** — a grouped, searchable single-select colour picker (Popover + Command + Swatch), the focused "pick one colour token" sibling of FillPicker's solid tab. `triggerVariant="inline"` reduces it to a clickable swatch for inspector / fill-row use.
- **GradientEditor** — edit a multi-stop CSS gradient with token-led stops: type Select (linear / radial / angular) with reverse + rotate, a live preview bar, and a stops list (position % + colour + opacity %). Emits the structured `GradientValue`; render the CSS with the exported `gradientToCss(value)`.
- **FillSection** (alongside the existing `FillPicker`) — a multi-fill list: each row a Solid/Gradient/Image toggle, the matching value control (ColorPicker / GradientEditor popover / image URL), an opacity %, a visibility toggle, and a remove button, with an "add fill" button in the header.
