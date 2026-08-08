---
name: Label
import: "@gradeui/ui"
element: label
props:
  - htmlFor?: string — binds to the input's id
  - size?: "default" | "sm" | "xs" — text size, mirrors Input/Select/Textarea so a field and its label scale together. default = text-sm; xs = 11px for dense tool panels.
  - All native label HTML attrs
when_to_use: Every Input / Textarea / Checkbox / Switch / RadioGroup. Always use htmlFor so clicking the label focuses the control. Match `size` to the field it labels (size="xs" label over a size="xs" input).
composes_with: [Input, Textarea, Checkbox, Switch, RadioGroup, Select]
aliases: [label, form label, field label, caption]
---

```jsx
<Label htmlFor="name">Full name</Label>
<Input id="name" />
```
