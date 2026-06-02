---
name: Switch
import: "@gradeui/ui"
props:
  - checked?: boolean
  - onCheckedChange?: (checked: boolean) => void
  - defaultChecked?: boolean
  - disabled?: boolean
  - id?: string
when_to_use: Instant on/off setting ("Enable notifications", "Dark mode"). Commits on toggle — no submit button needed. For selecting-from-a-list use Checkbox. For a settings row (label + description on the left, Switch on the right) use Field layout="setting". For a prominent on/off presented as a whole selectable card, use SwitchCard.
composes_with: [Label (via htmlFor), Field (layout="setting" settings row), SwitchCard (whole-card toggle), Card (settings rows)]
aliases: [toggle, switch, on/off switch, ios toggle, toggle switch, switch control, react native switch]
---

```jsx
<div className="flex items-center justify-between">
  <Label htmlFor="notifications">Email notifications</Label>
  <Switch id="notifications" />
</div>
```
