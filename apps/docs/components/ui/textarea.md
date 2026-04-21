---
name: Textarea
import: ./components/ui/textarea
props:
  - All native textarea HTML attrs (rows, value, onChange, placeholder, disabled)
when_to_use: Multi-line text entry (descriptions, messages, comments). Pair with a Label. Single-line input → use Input instead.
composes_with: [Label, Form, Card (in CardContent)]
---

```jsx
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" rows={4} placeholder="Tell us about yourself." />
```
