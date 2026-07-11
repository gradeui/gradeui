---
name: ToggleGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/toggle-group"
subcomponents: [ToggleGroupItem]
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - type? (single | multiple)
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Group of toggle buttons with single or multi-select mode.

## Guidance

A set of grouped toggle buttons for single or multiple selection. Built on [Radix UI Toggle Group](https://www.radix-ui.com/primitives/docs/components/toggle-group).

### When to Use
- Text formatting toolbars (bold, italic, underline)
- View mode switching (list, grid, gallery)
- Alignment controls (left, center, right, justify)

### Features
- Single or multiple selection modes
- Two visual variants: Simple (transparent) and Outline (bordered)
- Three sizes: Small (32px), Default (36px), Large (40px)
- Keyboard navigation with arrow keys
- ARIA-compliant for screen reader accessibility

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "toggle-group") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
