---
name: Menubar
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/menubar"
subcomponents: [MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarLabel, MenubarSeparator, MenubarShortcut, MenubarSub]
props:
  - defaultValue? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Horizontal menu bar with dropdown submenus for application menus.

## Guidance

Menubar is a horizontal menu bar for creating application-style menu systems. Built on [Radix UI Menubar](https://www.radix-ui.com/primitives/docs/components/menubar).

### When to Use
- Desktop-style application menus (File, Edit, View, Help)
- Settings panels with toggle options
- Navigation bars with dropdown sections

### Features
- Full keyboard navigation with arrow keys
- Nested submenus support
- Checkbox and radio menu items
- Keyboard shortcut display
- Accessible with ARIA roles

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "menubar") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
