---
name: Input
import: "@gradeui/ui"
props:
  - type?: string (text | email | password | number | search | url | tel | date)
  - All native input HTML attrs (value, onChange, placeholder, disabled, required)
when_to_use: Any single-line text entry. Always pair with a Label for accessibility.
composes_with: [Label, Form, Card (in CardContent), Button (form submit)]
aliases: [text field, textbox, textfield, form field, text input]
---

```jsx
<div className="grid gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```
