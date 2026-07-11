---
name: AspectRatio
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/aspect-ratio"
props:
  - ratio? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Wrapper that enforces a fixed aspect ratio on its child element.

## Guidance

AspectRatio maintains a consistent width-to-height ratio for content. Built on [Radix UI Aspect Ratio](https://www.radix-ui.com/primitives/docs/components/aspect-ratio).

### When to Use
- Image galleries with consistent proportions
- Video embeds (16:9, 21:9)
- Thumbnail grids and media cards

### Features
- Common ratios: 1:1, 4:3, 16:9, 21:9
- Content scales to fill container while preserving ratio
- Works with images, videos, iframes, and any child content
- Responsive - adapts to container width

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "aspect-ratio") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
