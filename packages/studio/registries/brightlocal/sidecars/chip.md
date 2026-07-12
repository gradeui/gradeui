---
name: Chip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/chip"
sizes: [md, lg]
props:
  - loading? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - onRemove? — TODO(review): type + one-line description from src
  - maxWidth? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Displaying user-created tags that can be removed Selected filter values that can be dismissed Multi-select token display with remove capability Do NOT use for: non-interactive status labels (use Badge); category labels without remove action (use Badge). Use Badge for non-interactive status indicators or labels. Use InputChip when users need to both add and remove tags via an input field.
composes_with: [Badge, InputChip]
---

```jsx
<Chip dataHook="filter-chip" onRemove={() => console.log("removed")}>
  Option
</Chip>

<Chip size="lg" dataHook="large-chip" onRemove={handleRemove}>
  Large Option
</Chip>

<Chip loading dataHook="loading-chip">
  Loading
</Chip>

<Chip disabled dataHook="disabled-chip">
  Disabled
</Chip>
```
```jsx
<Chip
  dataHook="filter-chip"
  loadingLabel={t("chip.loading")}
  removeAriaLabel={t("chip.remove", { name: "Option" })}
>
  Option
</Chip>
```
```jsx
<Chip
  dataHook="chip"
  onRemove={function z0e(){}}
  removeAriaLabel="Eliminar Opción"
  size="md"
  storyDescription="Custom labels (i18n)"
  trackingEl="chip-element"
  trackingLabel="Chip Component"
>
  Opción
</Chip>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-chip--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
