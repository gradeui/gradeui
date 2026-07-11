---
name: Slider
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/slider"
props:
  - mode? (single | range)
  - value? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - min? — TODO(review): type + one-line description from src
  - max? — TODO(review): type + one-line description from src
  - step? — TODO(review): type + one-line description from src
  - thumbLabels? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Range input slider with single or dual thumbs.

## Guidance

Slider is an input for selecting numeric values within a range. Built on [Radix UI Slider](https://www.radix-ui.com/primitives/docs/components/slider).

### When to Use
- Volume, brightness, or opacity controls
- Price range filters in e-commerce
- Rating or scoring inputs
- Time range selection (start/end)

### Features
- Single value or range selection (two thumbs)
- Horizontal and vertical orientations
- Custom min/max values and step increments
- Full keyboard accessibility (arrow keys)
- Touch-friendly for mobile devices
- Disabled state support

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "slider") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
