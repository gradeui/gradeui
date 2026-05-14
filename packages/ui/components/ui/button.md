---
name: Button
import: "@gradeui/ui"
variants: [default, destructive, outline, secondary, ghost, link]
sizes: [sm, md, lg, icon]
props:
  - variant? (default | destructive | outline | secondary | ghost | link)
  - size? (sm | md | lg | icon) — t-shirt scale aligned with Tabs/ToggleGroup heights (sm=h-7, md=h-8, lg=h-10). `default` still works as an alias for `md`.
  - asChild?: boolean — renders as the child element (use to wrap <a>/<Link>)
  - disabled?: boolean
  - All native button HTML attrs (onClick, type, etc.)
when_to_use: Any clickable action. Use size="icon" for square icon-only buttons, variant="link" for inline links that should look like Button. A Button placed next to a TabsList of the same size lines up edge-to-edge without per-call overrides.
composes_with: [Dialog, DropdownMenu, Tooltip, Card (in CardFooter), Row, Form controls]
---

```jsx
<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button size="icon" variant="ghost"><Mail /></Button>
```

```jsx
// Lined up next to a TabsList — same size = same height.
<Row gap="sm" align="center">
  <TabsList size="sm">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="open">Open</TabsTrigger>
  </TabsList>
  <Button size="sm">New issue</Button>
</Row>
```
