---
name: Rating
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/rating"
props:
  - value? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Star rating display and input component.

## Guidance

Rating displays a star-based rating indicator. Custom implementation using Tailwind CSS.

### When to Use
- Displaying product or service ratings (e.g., 4.5 out of 5 stars)
- Showing user review scores
- Visualizing quality or satisfaction levels

### Features
- Supports values from 0 to 5
- Half-star precision (0.5 increments)
- Two size variants: `sm` (16px, default) and `md` (24px)
- Accessible with ARIA labels for screen readers
- Visual fill percentage for partial stars

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "rating") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
