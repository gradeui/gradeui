---
name: InputGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-group"
subcomponents: [InputGroupInput, InputGroupAddon, InputGroupButton]
sizes: [default, sm, lg]
props:
  - error? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
