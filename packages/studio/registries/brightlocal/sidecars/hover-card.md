---
name: HoverCard
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/hover-card"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - openDelay? — TODO(review): type + one-line description from src
  - closeDelay? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
---

Popover that appears on hover for previewing linked content.

## Guidance

HoverCard displays rich content when hovering over a trigger element. Built on [Radix UI Hover Card](https://www.radix-ui.com/primitives/docs/components/hover-card).

### When to Use
- User profile previews on @mentions or avatars
- Link previews showing page summaries
- Additional context without cluttering the interface

### Features
- Hover-activated popover content
- Customizable open/close delays (default: 300ms)
- Support for any trigger element (links, buttons, text)
- Smooth enter/exit animations
- ARIA attributes for screen readers

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "hover-card") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
