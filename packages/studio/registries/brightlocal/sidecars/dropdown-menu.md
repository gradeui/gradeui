---
name: DropdownMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/dropdown-menu"
subcomponents: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger]
props:
  - dir?
  - open?: boolean
  - defaultOpen?: boolean
  - onOpenChange?
  - modal?: boolean
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — DropdownMenuCheckboxItem: Tracking element identifier for analytics
  - trackingLabel?: string — DropdownMenuCheckboxItem: Tracking label for analytics context
  - inset?: boolean — DropdownMenuItem: Indent the item (for hierarchical menus)
  - avatar — DropdownMenuTriggerAvatar: Avatar slot - expects an Avatar component
  - title: string — DropdownMenuTriggerAvatar: Main text/title displayed next to avatar
  - description?: string — DropdownMenuTriggerAvatar: Description text displayed below title
  - ariaLabel?: string — DropdownMenuTriggerAvatar: Accessible label for screen readers. Defaults to title if not provided.
when_to_use: Do NOT use for: navigation (use NavigationMenu); form selection (use Select).
aliases: [context menu, action menu, kebab menu, more menu, three-dot menu]
---

```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent dataHook="menu-content">
    <DropdownMenuLabel dataHook="menu-label">My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem dataHook="profile-item">Profile</DropdownMenuItem>
    <DropdownMenuItem dataHook="settings-item">Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem dataHook="logout-item">Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```
```jsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      Dropdown <ChevronDown />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-56" dataHook="dropdown-content">
    <DropdownMenuLabel>Label Text</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem dataHook="menu-item-1">
      <span>Dropdown Menu Item Text</span>
      <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger dataHook="submenu-trigger">
        <span>SubTrigger Text</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Submenu Item</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-dropdownmenu--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
