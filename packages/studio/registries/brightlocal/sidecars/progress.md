---
name: Progress
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/progress"
props:
  - value? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - label? — TODO(review): type + one-line description from src
  - indicatorClassName? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
