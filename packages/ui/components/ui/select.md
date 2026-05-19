---
name: Select
import: "@gradeui/ui"
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - Select: value?, onValueChange?, defaultValue?, disabled? — Radix root
  - SelectTrigger: wraps the clickable control; nest SelectValue inside
  - SelectValue: placeholder?: string — text when nothing is selected
  - SelectContent: accepts items via children
  - SelectItem: value: string — required; content is the label
when_to_use: Single-choice from 3+ known options. Fewer than 3 → RadioGroup. Huge list with search → use a Combobox (not in DS yet). Multi-select → not supported by this primitive.
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
