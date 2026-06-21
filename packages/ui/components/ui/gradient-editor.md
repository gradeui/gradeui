---
name: GradientEditor
import: "@gradeui/ui"
props:
  - value: { type, angle?, stops } — the structured gradient (type linear/radial/angular, optional angle in deg, ordered stops). NOT a CSS string — render the string via gradientToCss(value).
  - onChange: (value) => void — fired with the next structured gradient on any edit
when_to_use: Edit a multi-stop CSS gradient with token-led stops. A type Select (Linear / Radial / Angular) with reverse + rotate actions, a live full-width preview bar (a Swatch type="gradient"), then a Stops list where each stop is a position %, a colour (ColorPicker token or raw), an opacity %, and a remove button; an add button appends a stop. Token stops resolve to oklch(var(--<token>)) so the preview re-voices with the theme. Emits the structured GradientValue (kept editable + serialisable); the caller turns it into CSS with the exported gradientToCss(value). Use inside a Popover from a FillSection gradient row, or standalone in a theme builder. For a single solid colour use ColorPicker; for a full paint (solid / gradient / image / shader) use FillPicker.
composes_with: [Select, Button, Input, ColorPicker, Swatch, Popover, FillSection]
aliases: [gradient editor, gradient picker, gradient builder, css gradient editor, stop editor, gradient stops, linear gradient editor, conic gradient editor]
---

```jsx
<GradientEditor
  value={{
    type: "linear",
    angle: 90,
    stops: [
      { id: "a", position: 0, token: "action/primary", opacity: 1 },
      { id: "b", position: 100, token: "action/accent", opacity: 1 },
    ],
  }}
  onChange={setGradient}
/>
```

```jsx
// Render the CSS string for a background.
import { gradientToCss } from "@gradeui/ui";
<div style={{ background: gradientToCss(gradient) }} />
```
