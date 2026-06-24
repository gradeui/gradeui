---
name: ShaderControls
import: "@gradeui/ui"
props:
  - controls (ControlSpec[]) — the schema to render. Each spec describes one control (slider / toggle / select / switch / input) and its range, step, label, and display.
  - value (DemoState) — controlled state object keyed by control name; the parent owns it.
  - onChange ((key, value) => void) — fired on every control change.
  - labelPosition? (inline | above) — dense inline (label left, control + value right) or stacked label-above; default inline.
  - numberFormat? (raw | percent) — "percent" normalises eligible sliders (no unit, fractional step, non-negative) to 0–100%; a control's own `display: "percent"` always wins. Default raw.
when_to_use: Render a `ControlSpec[]` schema into a DS-native control panel — the single renderer behind shader params, the post-processing stack, and any effect layer (they all describe themselves as ControlSpec[]). Reach for it whenever you have a list of named, typed parameters to expose as a tweaker panel and want it to read identically to the Studio inspector. DS-consistent by construction: it composes the primitives at tool-panel density (Label size="xs", Slider size="sm", ghost Input, ToggleGroup, Select, Switch) — never bespoke markup.
composes_with: [Label, Slider, Input, ToggleGroup, Select, Switch, Card]
aliases: [shader controls, control panel, params panel, tweaker, parameter panel, controlspec renderer, effect controls, schema controls]
---

```jsx
const [state, setState] = React.useState({ speed: 0.4, grain: 0.2, invert: false });

<ShaderControls
  controls={[
    { key: "speed", type: "slider", label: "Speed", min: 0, max: 1, step: 0.01, display: "percent" },
    { key: "grain", type: "slider", label: "Grain", min: 0, max: 1, step: 0.01 },
    { key: "invert", type: "switch", label: "Invert" },
  ]}
  value={state}
  onChange={(key, v) => setState((s) => ({ ...s, [key]: v }))}
  numberFormat="percent"
/>
```

One renderer drives every params surface (shader, post stack, effect layer), so a
control added to the schema appears identically in the Studio inspector and any
consumer panel. Keep state in the parent; `ShaderControls` is fully controlled.
