---
name: Grid
import: "@gradeui/ui"
role: layout
props:
  - cols?: "1" | "2" | "3" | "4" | "5" | "6" | "12" (default "3") — desktop column count; each value has a baked-in responsive ladder (e.g. "4" → 1 col mobile, 2 tablet, 4 desktop)
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — gap between grid cells (same scale as Stack/Row)
  - align?: "start" | "center" | "end" | "stretch" (default "stretch") — cross-axis alignment of cells
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: 2D layouts where Stack (vertical) and Row (horizontal) don't fit — stat-card grids, feature tiles, pricing columns, photo grids. Reach for Grid over hand-rolled `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4` so the column count is a prop the settings panel can mutate and the responsive ladder stays consistent across designs.
composes_with: [Card, Stack (inside each cell), Row, Button, any content component]
aliases: [grid, tiles, cards grid, stat grid, columns, feature grid]
notes: |
  `cols` values and their responsive ladders:
    "1"  → grid-cols-1 (single column at all breakpoints)
    "2"  → grid-cols-1 md:grid-cols-2
    "3"  → grid-cols-1 sm:grid-cols-2 md:grid-cols-3
    "4"  → grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  (the canonical stat-card grid)
    "5"  → grid-cols-1 sm:grid-cols-2 lg:grid-cols-5
    "6"  → grid-cols-2 sm:grid-cols-3 lg:grid-cols-6
    "12" → grid-cols-4 md:grid-cols-6 lg:grid-cols-12
  Prefer Grid over bespoke Tailwind grid classes — "gap-md" etc. are NOT real Tailwind classes (the gap scale is numeric: gap-4, gap-6) so hand-rolled grids often end up with zero gap.
---

```jsx
// Stat-card grid — the canonical 4-up.
<Grid cols="4" gap="md">
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
</Grid>
```

```jsx
// Three-column feature grid with larger gaps.
<Grid cols="3" gap="lg">
  <FeatureCard />
  <FeatureCard />
  <FeatureCard />
</Grid>
```
