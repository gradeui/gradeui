---
name: Select
import: "@gradeui/ui"
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - Select: value?, onValueChange?, defaultValue?, disabled? — Radix root
  - SelectTrigger: size?: "default" | "sm" | "xs" — control density; wraps the clickable control, nest SelectValue inside
  - SelectValue: placeholder?: string — text when nothing is selected
  - SelectContent: size?: "default" | "sm" | "xs" — menu density; cascades to every SelectItem inside via context so a compact trigger gets a compact menu. Accepts items via children.
  - SelectItem: value: string — required; content is the label. Inherits density from SelectContent.
when_to_use: Single-choice from 3+ known options. Fewer than 3 → RadioGroup. Huge list with search → use a Combobox (not in DS yet). Multi-select → not supported by this primitive. In dense tool panels, set size="xs" on BOTH the trigger and the content so the closed control and open menu match.
composes_with: [Label (above SelectTrigger), Form, Card]
aliases: [dropdown, combobox, picker, select, pop-up button, popup button, popup picker, picker view, rnpickerselect, react native picker, native picker]
---

```jsx
<Select defaultValue="apple">
  <SelectTrigger><SelectValue placeholder="Pick a fruit" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectContent>
</Select>
```

Compact, for dense panels — match the trigger and menu density:

```jsx
<Select defaultValue="md">
  <SelectTrigger size="xs"><SelectValue /></SelectTrigger>
  <SelectContent size="xs">
    <SelectItem value="sm">Small</SelectItem>
    <SelectItem value="md">Medium</SelectItem>
  </SelectContent>
</Select>
```
