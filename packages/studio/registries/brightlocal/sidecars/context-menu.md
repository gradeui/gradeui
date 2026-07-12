---
name: ContextMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/context-menu"
subcomponents: [ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub]
props:
  - dataHook?: string — optional on structural components (renders data-hook)
---

```jsx
<ContextMenu>
  <ContextMenuTrigger dataHook="my-trigger">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem dataHook="item-back">
      Back
      <ContextMenuShortcut>⌘[</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem dataHook="item-forward" disabled>
      Forward
      <ContextMenuShortcut>⌘]</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuCheckboxItem checked dataHook="item-bookmarks">
      Show Bookmarks
    </ContextMenuCheckboxItem>
  </ContextMenuContent>
</ContextMenu>
```
```jsx
<ContextMenu>
  <ContextMenuTrigger dataHook="context-menu-trigger">
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem dataHook="item-back">
      Back
      <ContextMenuShortcut>⌘[</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem dataHook="item-forward" disabled>
      Forward
      <ContextMenuShortcut>⌘]</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuCheckboxItem checked dataHook="item-bookmarks">
      Show Bookmarks
    </ContextMenuCheckboxItem>
  </ContextMenuContent>
</ContextMenu>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-contextmenu--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
