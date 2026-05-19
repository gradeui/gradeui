---
name: Slider
import: "@gradeui/ui"
props:
  - value?: number[] — controlled value; ALWAYS an array even for a single-thumb slider (`[50]`)
  - defaultValue?: number[] — uncontrolled initial; `[20, 80]` for a two-thumb range
  - onValueChange?: (value: number[]) => void
  - min?: number (default 0)
  - max?: number (default 100)
  - step?: number (default 1)
  - disabled?: boolean
  - orientation? "horizontal" | "vertical" (default "horizontal")
  - dir? "ltr" | "rtl"
  - inverted?: boolean — flip the visual direction
  - name?: string — form name when posting natively
when_to_use: A continuous-ish numeric pick — volume, opacity, font size, price-range filters. Use a single-thumb slider for one value, two-thumb for a range. For a small set of discrete options (1-5 stars, sm/md/lg) prefer ToggleGroup. For free-text numeric entry use an Input type="number".
composes_with: [Label (mandatory above), Row (label + current value display), Card (settings rows)]
aliases: [slider, range slider, range input, volume, opacity slider, scrub, drag value, slider control, value slider, react native slider]
---

```jsx
// Single-thumb slider with the current value shown alongside.
<Stack gap="xs">
  <Row justify="between" align="center">
    <Label htmlFor="opacity">Opacity</Label>
    <span className="text-sm text-muted-foreground tabular-nums">{value[0]}%</span>
  </Row>
  <Slider
    id="opacity"
    min={0}
    max={100}
    step={1}
    value={value}
    onValueChange={setValue}
  />
</Stack>
```

```jsx
// Two-thumb price-range filter.
<Slider
  min={0}
  max={500}
  step={5}
  defaultValue={[50, 250]}
  onValueChange={setRange}
/>
```
