---
name: DropdownMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/dropdown-menu"
subcomponents: [DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuLabel, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger]
props:
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: navigation (use NavigationMenu); form selection (use Select).
aliases: [context menu, action menu, kebab menu, more menu, three-dot menu]
---

Trigger-activated menu with items, submenus, checkboxes, and radio groups.

## Guidance

DropdownMenu displays a menu of actions or options triggered by a button. Built on [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu).

### When to Use
- Action menus for items (edit, delete, share)
- User account menus with profile options
- Settings and preferences menus

### Features
- Full keyboard navigation and ARIA support
- Nested menus with SubTrigger and SubContent
- Checkbox items with checkable state
- Radio groups for single-select options
- Keyboard shortcut display
- Avatar trigger variant for user menus

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "dropdown-menu") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
