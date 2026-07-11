---
name: Separator
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/separator"
subcomponents: [SeparatorWithText]
props:
  - orientation? (horizontal | vertical)
  - spacing? (default | sm | md | lg)
  - decorative? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
---

Horizontal or vertical divider line.

## Guidance

Separator visually divides content with a horizontal or vertical line. Horizontal orientation renders a semantic `<hr>` element; vertical uses a `<div>` with appropriate ARIA attributes.

### When to Use
- Dividing sections of content
- Separating navigation items inline
- Creating "OR" dividers in forms

### Features
- Horizontal and vertical orientations
- Configurable spacing (default, sm, md, lg)
- Text variant for labeled dividers
- Decorative mode for accessibility
- Uses design system border tokens

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "separator") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
