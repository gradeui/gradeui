---
name: Label
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/label"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics Defaults to "label" if not provided
  - trackingLabel?: string — Tracking label for analytics context Additional context for tracking events
  - optional?: boolean — Display "(optional)" suffix after label text (default false)
when_to_use: Do NOT use for: standalone text (use Typography).
aliases: [form label, input label]
---

```jsx
<div className="flex flex-col gap-2">
  <Label dataHook="email-label" htmlFor="email">
    Email
  </Label>
  <Input dataHook="email-input" id="email" type="email" />
</div>
```
```jsx
<Label dataHook="phone-label" htmlFor="phone" optional>
  Phone number
</Label>
```
```jsx
<div className="flex items-center gap-2">
  <Checkbox
    dataHook="checkbox-demo"
    id="demo-terms"
  />
  <Label
    dataHook="label-with-checkbox"
    htmlFor="demo-terms"
    storyDescription="With checkbox"
  >
    Accept terms and conditions
  </Label>
</div>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-label--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
