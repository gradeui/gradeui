---
name: Checkbox
import: "@gradeui/ui"
props:
  - checked?: boolean | "indeterminate"
  - onCheckedChange?: (checked: boolean) => void
  - defaultChecked?: boolean
  - disabled?: boolean
  - id?: string — bind a Label's htmlFor to this
when_to_use: Binary on/off tied to a list (select multiple, agree to terms). Single on/off that controls a setting is better with Switch.
composes_with: [Label (via htmlFor), Card, Form rows, Table (for row selection)]
---

```jsx
<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to the terms</Label>
</div>
```
