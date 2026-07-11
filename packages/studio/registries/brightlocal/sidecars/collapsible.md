---
name: Collapsible
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/collapsible"
subcomponents: [CollapsibleTrigger, CollapsibleContent]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - defaultOpen? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Unstyled Radix primitive for toggling content visibility.

## Guidance

Collapsible is an interactive component that expands and collapses content. Built on [Radix UI Collapsible](https://www.radix-ui.com/primitives/docs/components/collapsible).

### When to Use
- Expandable sections with additional details
- "Show more" content areas
- Nested navigation or tree structures

### Features
- Keyboard navigation (Space/Enter to toggle)
- Animated height transitions
- Controlled and uncontrolled modes
- Full ARIA support for screen readers

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "collapsible") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
