---
name: List
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/list"
subcomponents: [Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemSubheader]
variants: [default, filled, outline, loading]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics.
  - trackingLabel?: string — Tracking label for analytics context.
  - asChild?: boolean — Item: Render as the child element instead of `<li>`. Useful when the item is wrapped by another element (e.g. `<motion.li>`).
  - variant? (default | filled | outline | loading) — Item: Visual style of the item row. - `default` — plain row without background or border - `filled` — card background (default) - `outline` — bordered row on page background - `loading` — skeleton placeholder (default "filled")
---

```jsx
<List dataHook="my-list">
  <Item variant="filled" dataHook="item-1">
    <ItemContent>
      <ItemTitle>Coffee beans</ItemTitle>
      <ItemDescription>Arabica, medium roast</ItemDescription>
    </ItemContent>
    <ItemActions>
      <button aria-label="Remove" type="button"><X /></button>
    </ItemActions>
  </Item>
  <Item variant="loading" />
</List>
```
```jsx
<List dataHook="actions-list">
  <ItemSubheader>Suggestions</ItemSubheader>
  <Item variant="default" dataHook="item-1">
    <ItemContent>
      <ItemTitle>Search rankings</ItemTitle>
    </ItemContent>
  </Item>
  <ItemSubheader>Recent</ItemSubheader>
  <Item variant="default" dataHook="item-2">
    <ItemContent>
      <ItemTitle>Citation audit</ItemTitle>
    </ItemContent>
  </Item>
</List>
```
```jsx
<T
  dataHook="list"
  showSubheader
  variant="default"
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-list--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
