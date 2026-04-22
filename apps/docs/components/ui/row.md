---
name: Row
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — gap between children
  - align?: "start" | "center" | "end" | "stretch" | "baseline" (default "center") — cross-axis (vertical) alignment
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis distribution
  - wrap?: boolean (default false) — allow children to wrap onto additional lines when they overflow
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: Horizontal composition — button groups, inline form rows, logo + nav rows, anything on one line. Reach for Row instead of `flex items-center gap-*` so the alignment and spacing are editable through the settings panel. For two-pane layouts with an explicit ratio (sidebar + content, 1/3 + 2/3) use Split instead — Row evenly flows whatever children it holds.
composes_with: [Button, Input, NavItem, Stack (can wrap a Row), any content component]
aliases: [row, hstack, horizontal, inline, horizontal layout]
---

```jsx
// Button group — justify="end" pushes the group to the right.
<Row gap="sm" justify="end">
  <Button variant="ghost">Cancel</Button>
  <Button>Save</Button>
</Row>
```

```jsx
// Spread apart — logo left, action right.
<Row justify="between" align="center">
  <Logo />
  <Button>Sign in</Button>
</Row>
```
