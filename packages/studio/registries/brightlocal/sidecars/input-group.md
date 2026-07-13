---
name: InputGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-group"
subcomponents: [InputGroupInput, InputGroupAddon, InputGroupButton]
sizes: [default, sm, lg]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - error?: boolean — Whether the input group has an error state
  - asChild?: boolean — InputGroupButton:
  - size? (default | sm | lg | icon | icon-xs | icon-sm | icon-lg) — InputGroupButton: Size variant for the button. Options: "default" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
---

```jsx
<InputGroup>
  <InputGroupAddon className="pl-3">
    <Search />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>
```
```jsx
<InputGroup>
  <InputGroupInput type="password" />
  <InputGroupButton size="icon-sm">
    <Eye />
  </InputGroupButton>
</InputGroup>
```
```jsx
<InputGroup
  dataHook="input-group"
  size="default"
  storyDescription="Focus state"
>
  <InputGroupAddon className="pl-3">
    <Search />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search..." />
</InputGroup>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-inputgroup--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
