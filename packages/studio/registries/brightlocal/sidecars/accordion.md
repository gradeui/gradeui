---
name: Accordion
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/accordion"
subcomponents: [AccordionItem, AccordionTrigger, AccordionContent]
props:
  - type? (single | multiple)
  - collapsible? — TODO(review): type + one-line description from src
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Vertically stacked collapsible sections with mutual-exclusion support.

## Guidance

Accordion displays a vertically stacked set of interactive headings that each reveal content sections. Built on [Radix UI Accordion](https://www.radix-ui.com/primitives/docs/components/accordion).

### When to Use
- FAQs and help documentation
- Settings panels with collapsible sections
- Content organization with multiple topics

### Features
- Single or multiple items can be opened simultaneously
- Keyboard navigation and ARIA attributes built-in
- Collapsible option for single-item mode
- Smooth animated expand/collapse transitions
- Customizable trigger and content styling

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "accordion") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
