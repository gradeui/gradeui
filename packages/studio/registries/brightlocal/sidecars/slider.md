---
name: Slider
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/slider"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - mode? — Slider mode - single value or range (two thumbs). - "single": One thumb, selects a single value (default) - "range": Two thumbs, selects a min/max range (default "single")
  - thumbLabels? — Accessible labels for the slider thumb(s). - For single mode: provide one label (e.g., ["Volume"]) - For range mode: provide two labels (e.g., ["Minimum price", "Maximum price"]) (default ["Slider"]) for single, ["Minimum value", "Maximum value"] for range
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
---

```jsx
<Slider defaultValue={[50]} max={100} step={1} dataHook="slider" thumbLabels={["Value"]} />
```
```jsx
<Slider
  dataHook="slider"
  defaultValue={[
    5
  ]}
  max={10}
  min={0}
  step={1}
  storyDescription="Custom min/max (0-10)"
  thumbLabels={[
    'Value'
  ]}
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-slider--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
