---
name: Toggle
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/toggle"
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - pressed? — TODO(review): type + one-line description from src
  - onPressedChange? — TODO(review): type + one-line description from src
  - ariaLabel? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<Toggle
  dataHook="toggle-bold"
  ariaLabel="Toggle bold"
  pressed={isBold}
  onPressedChange={setIsBold}
>
  <Bold />
</Toggle>
```
```jsx
<Toggle
  dataHook="toggle-italic"
  ariaLabel="Toggle italic"
  variant="outline"
  pressed={isItalic}
  onPressedChange={setIsItalic}
>
  <Italic />
</Toggle>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-toggle--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
