---
name: Textarea
import: "@gradeui/ui"
element: textarea
props:
  - size?: "default" | "sm" | "xs" — control density, mirrors Input. default = min-h-80 / text-sm; sm and xs shrink the min-height + padding for dense panels.
  - All native textarea HTML attrs (rows, value, onChange, placeholder, disabled)
when_to_use: Multi-line text entry (descriptions, messages, comments). Pair with a Label. Single-line input → use Input instead. Use size="sm"/"xs" in dense tool panels.
composes_with: [Label, Form, Card (in CardContent)]
aliases: [text area, multiline, comment box, message field, text editor, multi-line text, multiline input, multiline text field, comments box, multiline textinput]
---

```jsx
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" rows={4} placeholder="Tell us about yourself." />
```
