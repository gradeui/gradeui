---
name: Label
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/label"
props:
  - optional? — TODO(review): type + one-line description from src
  - htmlFor? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: standalone text (use Typography).
aliases: [form label, input label]
---

Form label element that associates with inputs via htmlFor.

## Guidance

> Note: This is a helper component used when building other components. It is not present in the Design System files in Figma.

Label renders accessible labels for form controls. Built on [Radix UI Label](https://www.radix-ui.com/primitives/docs/components/label).

### When to Use
- Form field labels that need to be associated with inputs
- Checkbox and radio button labels
- Any form control requiring an accessible label

### Features
- Automatic association with form controls via `htmlFor`
- Optional indicator with "(optional)" suffix
- Disabled state styling when paired with disabled inputs
- Accessible by default with proper semantics

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "label") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
