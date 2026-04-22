---
name: Button
import: "@gradeui/ui"
variants: [default, destructive, outline, secondary, ghost, link]
sizes: [default, sm, lg, icon]
props:
  - variant? (default | destructive | outline | secondary | ghost | link)
  - size? (default | sm | lg | icon)
  - asChild?: boolean — renders as the child element (use to wrap <a>/<Link>)
  - disabled?: boolean
  - All native button HTML attrs (onClick, type, etc.)
when_to_use: Any clickable action. Use size="icon" for square icon-only buttons, variant="link" for inline links that should look like Button component.
composes_with: [Dialog, DropdownMenu, Tooltip, Card (in CardFooter), Form controls]
---

```jsx
<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button size="icon" variant="ghost"><Mail /></Button>
```
