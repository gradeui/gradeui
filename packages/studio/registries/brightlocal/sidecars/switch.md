---
name: Switch
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/switch"
props:
  - disabled? — TODO(review): type + one-line description from src
  - checked? — TODO(review): type + one-line description from src
  - onCheckedChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: multi-option selection (use Checkbox or RadioGroup); button toggle (use Toggle).
aliases: [toggle switch, on/off toggle]
---

```jsx
<Field orientation="horizontal">
  <Switch id="notifications" dataHook="notifications-switch" />
  <FieldLabel htmlFor="notifications" dataHook="notifications-label">
    Enable notifications
  </FieldLabel>
</Field>
```
```jsx
<Field orientation="horizontal">
  <Switch id="feature" dataHook="feature-switch" checked={checked} onCheckedChange={setChecked} />
  <FieldContent>
    <FieldLabel htmlFor="feature" dataHook="feature-label">Enable feature</FieldLabel>
    <FieldDescription dataHook="feature-desc">
      This feature allows you to do something useful.
    </FieldDescription>
  </FieldContent>
</Field>
```
```jsx
<Switch aria-label="Toggle option" dataHook="toggle-switch" />
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-switch--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
