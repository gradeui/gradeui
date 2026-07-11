---
name: ScrollArea
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/scroll-area"
subcomponents: [ScrollBar]
props:
  - orientation? (vertical | horizontal)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Custom-styled scrollable container with overlay scrollbars.

## Guidance

ScrollArea provides a custom-styled scrollable viewport with native scroll behavior. Built on [Radix UI ScrollArea](https://www.radix-ui.com/primitives/docs/components/scroll-area).

### When to Use
- Long lists that need scrolling (dropdown menus, sidebars)
- Chat or message containers
- Code preview areas with horizontal overflow

### Features
- Custom styled scrollbars that match the design system
- Vertical and horizontal scrolling support
- Native scroll behavior (keyboard, touch, mouse wheel)
- Focusable viewport for accessibility
- Consistent appearance across browsers

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "scroll-area") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
