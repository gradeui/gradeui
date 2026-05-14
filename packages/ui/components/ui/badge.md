---
name: Badge
import: "@gradeui/ui"
variants: [default, secondary, destructive, outline, highlight, success, warning, info, success-soft, warning-soft, destructive-soft, info-soft, highlight-soft, success-outline, warning-outline, destructive-outline, info-outline]
props:
  - variant? (see list above)
  - rounded? (default | full) — "full" gives a pill shape
  - All native div HTML attrs
when_to_use: Compact status chips, counts, tags, pills. For higher-signal inline status → use Alert. For solid CTAs → Button. Soft/outline variants are quieter; solid variants are loud.
composes_with: [Card, Table (inside a cell), Avatar (next to it), anywhere inline]
aliases: [chip, tag, pill, label chip]
---

```jsx
<Badge>New</Badge>
<Badge variant="success-soft" rounded="full">Active</Badge>
<Badge variant="destructive-outline">Blocked</Badge>
```
