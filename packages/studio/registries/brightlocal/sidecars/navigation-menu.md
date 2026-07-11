---
name: NavigationMenu
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/navigation-menu"
subcomponents: [NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Horizontal navigation with dropdown panels for site navigation.

## Guidance

NavigationMenu is a horizontal navigation component with dropdown support. Built on [Radix UI Navigation Menu](https://www.radix-ui.com/primitives/docs/components/navigation-menu).

### When to Use
- Main website navigation with mega-menu dropdowns
- Product navigation requiring rich content previews
- Multi-level site navigation with categorized links

### Features
- Full keyboard navigation with arrow keys
- Rich dropdown content with customizable layouts
- Focus management and accessibility built-in
- Animated viewport transitions
- Active item indicator

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "navigation-menu") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
