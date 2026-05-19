---
name: Flex
import: "@gradeui/ui"
role: layout
props:
  - direction?: "row" | "col" | "row-reverse" | "col-reverse" (default "row") — main-axis direction
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "none") — gap between children
  - align?: "start" | "center" | "end" | "stretch" | "baseline" (default "stretch") — cross-axis alignment
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis distribution
  - wrap?: "nowrap" | "wrap" | "wrap-reverse" (default "nowrap") — wrap behaviour when children overflow
  - asChild?: boolean (default false) — render as the child element via Slot
  - className?: string
  - children: React.ReactNode
when_to_use: The unopinionated flexbox primitive — reach for Flex when Stack, Row, or Grid don't quite fit. Specifically when you need reverse direction (`row-reverse` / `col-reverse`), CSS defaults instead of Row's baked-in `items-center gap-md`, or baseline alignment. Otherwise prefer Stack / Row / Grid — they're easier to read and tuned for the 95% case. Flex is the escape hatch, not the default.
composes_with: [any content component]
aliases: [flex, flexbox, flex container, hstack, vstack, horizontal, vertical, generic container, layout view]
---

```jsx
// Reverse direction — last child appears first (e.g. timestamp before avatar).
<Flex direction="row-reverse" gap="sm" align="center">
  <Avatar />
  <span>2m ago</span>
</Flex>
```

```jsx
// CSS-default Flex — no rhythm baked in, opt into each axis deliberately.
<Flex direction="col" justify="between" className="h-full">
  <Header />
  <Footer />
</Flex>
```

```jsx
// Baseline alignment for icon + text where the caps line should line up.
<Flex gap="sm" align="baseline">
  <Icon />
  <h2 className="text-2xl">Heading</h2>
</Flex>
```
