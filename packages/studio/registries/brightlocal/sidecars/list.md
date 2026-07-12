---
name: List
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/list"
subcomponents: [Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemSubheader]
variants: [default, filled, outline, loading]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
