---
name: Progress
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/progress"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Optional tracking element identifier for analytics
  - trackingLabel?: string — Optional tracking label for analytics
  - ariaLabel?: string — Accessible label for the progress bar for screen readers (default "Progress")
  - label?: string — Optional visible label text displayed above the progress bar
  - indicatorClassName?: string — Custom class name for the indicator (progress fill) Use this to customize the color, e.g., "bg-red-500"
  - disabled?: boolean — Whether the progress is in a disabled state When disabled, the component renders with 50% opacity
---

```jsx
<Progress dataHook="upload-progress" value={66} label="Uploading..." />

<Progress
  dataHook="score"
  value={90}
  label="Local SEO score"
  color="green"
  showValue
/>

<Progress
  dataHook="steps"
  value={3}
  max={5}
  unit="steps"
  label="Setup"
  showValue
/>
```
```jsx
<Progress dataHook="progress" value={50} ariaLabel={t("progress.label")} />
```
```jsx
<Progress
  ariaLabel="Progress"
  dataHook="progress"
  label="Pending"
  showValue
  storyDescription="Value — none, falls back to –"
  value={null}
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-progress--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
