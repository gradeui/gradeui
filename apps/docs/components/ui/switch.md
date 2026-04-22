---
name: Switch
import: "@gradeui/ui"
props:
  - checked?: boolean
  - onCheckedChange?: (checked: boolean) => void
  - defaultChecked?: boolean
  - disabled?: boolean
  - id?: string
when_to_use: Instant on/off setting ("Enable notifications", "Dark mode"). Commits on toggle — no submit button needed. For selecting-from-a-list use Checkbox.
composes_with: [Label (via htmlFor), Card (settings rows)]
aliases: [toggle]
---

```jsx
<div className="flex items-center justify-between">
  <Label htmlFor="notifications">Email notifications</Label>
  <Switch id="notifications" />
</div>
```
