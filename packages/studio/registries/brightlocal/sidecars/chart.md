---
name: ChartContainer
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/chart"
subcomponents: [ChartTooltip, ChartTooltipContent]
props:
  - config? — TODO(review): type + one-line description from src
  - id? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
aliases: [chart]
---

Recharts wrapper with design system theming for bar, line, area, pie, and radar charts.

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "chart") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
