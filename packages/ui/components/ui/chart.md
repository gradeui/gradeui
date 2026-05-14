---
name: ChartContainer
import: "@gradeui/ui"
subcomponents: [ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle]
notes: ChartContainer wraps a Recharts chart — bring your own Bar/Line/Area/Pie/Radar from "recharts" and place it inside. The wrapper threads design-system tokens through Recharts' style props and provides a styled tooltip + legend.
props:
  - ChartContainer: config: ChartConfig — `{ [seriesKey]: { label: string; color?: string; theme?: { light: string; dark: string } } }`; the keys here are the names you reference in your Recharts <Bar dataKey="…" /> calls
  - ChartContainer: id?: string — used for the inlined <style> tag
  - ChartContainer: children: React.ReactNode — typically a single Recharts ResponsiveContainer or chart
  - ChartTooltip: passes through to Recharts <Tooltip> — pair with `content={<ChartTooltipContent />}`
  - ChartTooltipContent: indicator? "dot" | "line" | "dashed"; hideLabel?, hideIndicator?, nameKey?, labelKey?
  - ChartLegend / ChartLegendContent: pair the same way for the legend
when_to_use: Reporting dashboards, single-purpose analytics cards (revenue, conversions, active users), or anywhere you'd otherwise hand-roll a Recharts setup. Bring the actual chart type from `recharts` — ChartContainer doesn't pick the chart shape for you, it themes whatever you nest. For sparkline-style decorative trends consider just rendering a small SVG line directly; ChartContainer is overkill for non-interactive ornament.
composes_with: [Card (chart-in-a-card pattern), Tabs (multi-metric switcher), Recharts components (Bar, Line, Area, Pie, Radar from "recharts")]
aliases: [chart, charts, graph, bar chart, line chart, area chart, recharts, analytics chart]
---

```jsx
// Revenue-by-month bar chart inside a Card.
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const data = [
  { month: "Jan", revenue: 12400 },
  { month: "Feb", revenue: 14210 },
  { month: "Mar", revenue: 15880 },
  { month: "Apr", revenue: 17050 },
];

const config = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer config={config} className="h-64">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  </CardContent>
</Card>
```
