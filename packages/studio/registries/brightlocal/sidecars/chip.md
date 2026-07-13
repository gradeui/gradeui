---
name: Chip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/chip"
sizes: [md, lg]
props:
  - children — Chip content (text label)
  - size? (md | lg) — Size variant of the chip (default "md")
  - loading?: boolean — Show loading spinner instead of delete button (default false)
  - disabled?: boolean — Disable the chip and its delete button (default false)
  - onRemove? — Callback when delete button is clicked
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - maxWidth?: number — Maximum width of the chip label before truncation (default 200)
  - loadingLabel?: string — Accessible label for the loading spinner. (default "Loading")
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
