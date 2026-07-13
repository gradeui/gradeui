---
name: ChartContainer
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/chart"
subcomponents: [ChartTooltip, ChartTooltipContent]
props:
  - children — Chart content (typically a Recharts chart component)
  - config — Configuration object for chart colors and labels
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - width? — Width of the chart's ResponsiveContainer. A number (px) skips responsive measurement and avoids the initial -1 warning. A percent string (e.g. "50%") keeps responsive behaviour within that fraction.
  - height? — Height of the chart's ResponsiveContainer. A number (px) skips responsive measurement and avoids the initial -1 warning. A percent string (e.g. "50%") keeps responsive behaviour within that fraction.
  - minWidth? — Minimum width for the chart's ResponsiveContainer.
  - minHeight? — Minimum height for the chart's ResponsiveContainer.
  - maxHeight?: number — Maximum height for the chart's ResponsiveContainer.
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - key?
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - hideLabel?: boolean — ChartTooltip: Hide the tooltip label
  - hideIndicator?: boolean — ChartTooltip: Hide the color indicator
  - indicator? — ChartTooltip: Style of the color indicator
  - nameKey?: string — ChartTooltip: Key to use for the series name
  - labelKey?: string — ChartTooltip: Key to use for the label
  - labelFormatter? — ChartTooltipContent: Custom label formatter function
  - labelClassName?: string — ChartTooltipContent: Additional CSS class for the label
  - formatter? — ChartTooltipContent: Custom value formatter function
  - hideIcon?: boolean — ChartLegendContent: Hide the series icon in the legend
  - payload? — ChartLegendContent: Legend payload from Recharts (automatically provided)
  - dataKey: string — ChartLegendContent:
  - color?: string — ChartLegendContent:
aliases: [chart]
---

Recharts wrapper with design system theming for bar, line, area, pie, and radar charts.

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "chart") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
