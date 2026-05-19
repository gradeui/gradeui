---
name: Separator
import: "@gradeui/ui"
props:
  - orientation? ("horizontal" | "vertical") — default "horizontal"
  - decorative?: boolean (default true) — hide from a11y tree
  - className?: string
when_to_use: Light divider between sibling blocks in a Card, list, or header. For section-level partition use extra spacing instead.
composes_with: [Card (between CardHeader/Content/Footer), navigation menus, any vertical stacks]
aliases: [divider, rule, hr, line, horizontal rule]
---

```jsx
<Separator />
<Separator orientation="vertical" className="h-6" />
```
