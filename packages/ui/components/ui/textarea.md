---
name: Textarea
import: "@gradeui/ui"
props:
  - All native textarea HTML attrs (rows, value, onChange, placeholder, disabled)
when_to_use: Multi-line text entry (descriptions, messages, comments). Pair with a Label. Single-line input → use Input instead.
composes_with: [Label, Form, Card (in CardContent)]
aliases: [text area, multiline, comment box, message field, text editor, multi-line text, multiline input, multiline text field, comments box, multiline textinput]
---

```jsx
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" rows={4} placeholder="Tell us about yourself." />
```
