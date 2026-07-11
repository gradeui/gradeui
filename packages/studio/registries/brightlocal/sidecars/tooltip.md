---
name: Tooltip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tooltip"
subcomponents: [TooltipProvider, TooltipTrigger, TooltipContent]
props:
  - delayDuration? — TODO(review): type + one-line description from src
  - skipDelayDuration? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - align? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: interactive content (use Popover); complex content (use HoverCard).
aliases: [hover tip, info tip, help text]
---

Small text popup that appears on hover/focus for supplementary info.

## Guidance

A popup that displays information when hovering over an element. Built on [Radix UI Tooltip](https://www.radix-ui.com/primitives/docs/components/tooltip).

### When to Use
- Icon-only buttons that need text explanation
- Truncated text that needs full content shown
- Additional context for form fields or controls

### Features
- Flexible positioning (top, bottom, left, right)
- Customizable delay and skip delay for better UX
- Keyboard accessible (Escape to dismiss)
- TooltipProvider for consistent timing across app
- ARIA-compliant for screen reader accessibility

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "tooltip") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
