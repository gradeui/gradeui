---
name: RadioGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/radio-group"
subcomponents: [RadioGroupItem]
variants: [default, box, boxIconVertical, boxIconHorizontal]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Group of mutually exclusive radio button options.

## Guidance

RadioGroup allows users to select a single option from a set of mutually exclusive choices. Built on [Radix UI Radio Group](https://www.radix-ui.com/primitives/docs/components/radio-group).

### When to Use
- Single selection from a small set of options (2-5 choices)
- Form fields where users must choose one option
- Settings or preferences requiring explicit selection

### Features
- Composition with Field, FieldLabel, and FieldDescription
- Box container variant via Field for card-style layouts
- Icon support for box icon variants
- Full keyboard navigation and ARIA compliance

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "radio-group") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
