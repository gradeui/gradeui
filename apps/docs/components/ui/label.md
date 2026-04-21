---
name: Label
import: ./components/ui/label
props:
  - htmlFor?: string — binds to the input's id
  - All native label HTML attrs
when_to_use: Every Input / Textarea / Checkbox / Switch / RadioGroup. Always use htmlFor so clicking the label focuses the control.
composes_with: [Input, Textarea, Checkbox, Switch, RadioGroup, Select]
---

```jsx
<Label htmlFor="name">Full name</Label>
<Input id="name" />
```
