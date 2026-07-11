---
name: ContextMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/context-menu"
subcomponents: [ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub]
props:
  - dataHook?: string — optional on structural components (renders data-hook)
---

Right-click menu with nested submenus.

## Guidance

ContextMenu displays a menu on right-click for context-aware actions. Built on [Radix UI Context Menu](https://www.radix-ui.com/primitives/docs/components/context-menu).

### When to Use
- Right-click menus for file/item operations
- Context-specific actions (copy, paste, delete)
- Quick access to item-specific options

### Features
- Right-click trigger for context-aware actions
- Full keyboard navigation
- Sub-menus for nested actions
- Checkbox and radio items for selections
- Keyboard shortcut hints
- ARIA roles and labels for screen readers

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "context-menu") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
