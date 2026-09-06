---
name: ReviewFunnel
props:
  data: "[{ k: string, v: number }] — step name and count, widest step first."
  height: "number, default 224. The chart's pixel height."
  labelWidth: "number, default 176. Right margin the step labels are drawn into, outside the trapezoids."
  maxWidth: "number | null, default 448. Caps the chart so four steps do not flatten into ribbons. null to span."
  dataHook: "string, default review-funnel."
  className: "string — layout only."
when_to_use: >
  Any drop-off sequence where each step is a subset of the one before it —
  the Review Builder campaign funnel (Sent → Opened → Left a rating →
  Visited a review site) is the canonical use. NOT for comparing unrelated
  categories: that is a bar chart, and a funnel implies containment it does
  not have.
composes_with: Card, CardContent, StatCard
aliases: funnel, funnel chart, drop-off chart, conversion funnel
---

The BrightLocal DS ships no Funnel — its chart set is Area / Bar / Line /
Pie / Radar / Radial — so this wraps Recharts directly. Use it rather than
importing `recharts` into a screen: the obvious wrapping renders NOTHING,
and the reason is not guessable.

A `FunnelChart` will not take its size from the `ResponsiveContainer` that
the DS `ChartContainer` owns. ChartContainer passes
`initialDimension={{ width: 1, height: 1 }}`, and a Funnel computes its
trapezoid geometry once rather than recomputing it when the ResizeObserver
reports the real width, so it stays 1x1 and no `<svg>` reaches the DOM.
This component measures its own width and hands the chart explicit pixels
inside a ChartContainer, which is the only shape that keeps the DS chart
context — `ChartTooltipContent`, the `--color-*` variables — AND stays
responsive.

Bars are the neutral ramp, not the brand green: the funnel is context for
the numbers above it, not the headline.
