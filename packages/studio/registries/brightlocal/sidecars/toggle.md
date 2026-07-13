---
name: Toggle
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/toggle"
variants: [simple, outline]
sizes: [default, sm, lg]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - variant? (simple | outline) — Visual style variant (default "simple")
  - size? (default | sm | lg) — Size variant (default "default")
  - ariaLabel?: string — ARIA label for accessibility (required when no text content)
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
