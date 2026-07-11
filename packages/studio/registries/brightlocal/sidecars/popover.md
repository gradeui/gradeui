---
name: Popover
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/popover"
subcomponents: [PopoverTrigger, PopoverContent]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - defaultOpen? — TODO(review): type + one-line description from src
  - modal? — TODO(review): type + one-line description from src
  - align? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: tooltips (use Tooltip); menus (use DropdownMenu).
aliases: [floating panel, popup panel, info popup]
---

Floating panel anchored to a trigger for forms or interactive content.

## Guidance

Popover displays rich content in a floating panel anchored to a trigger element. Built on [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover).

### When to Use
- Contextual forms or settings panels
- Rich tooltips with interactive content
- Quick actions without leaving the current page

### Features
- Accessible with proper ARIA attributes and focus management
- Keyboard navigation (Escape to close, Tab to navigate)
- Flexible positioning with auto-flip behavior
- Customizable alignment and offset
- Portal rendering for proper z-index layering

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "popover") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
