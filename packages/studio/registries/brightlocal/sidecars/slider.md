---
name: Slider
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/slider"
props:
  - mode? (single | range)
  - value? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - min? — TODO(review): type + one-line description from src
  - max? — TODO(review): type + one-line description from src
  - step? — TODO(review): type + one-line description from src
  - thumbLabels? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
