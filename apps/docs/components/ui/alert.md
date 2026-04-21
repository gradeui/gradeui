---
name: Alert
import: ./components/ui/alert
subcomponents: [AlertTitle, AlertDescription]
variants: [default, destructive, success, warning, info, highlight]
props:
  - variant? (default | destructive | success | warning | info | highlight)
  - All native div HTML attrs
when_to_use: Inline status/feedback that sits inside the layout flow. NOT a toast (use Sonner for transient). NOT a modal (use Dialog). Put an icon as first child — it will be auto-positioned; AlertTitle + AlertDescription follow.
composes_with: [lucide-react icons as first child, Button (inside AlertDescription), Card (as a section callout)]
---

Variant tokens come from theme (`--destructive-soft`, `--success-deep`, etc.) so they restyle with the active Grade theme.

```jsx
<Alert variant="warning">
  <AlertTriangle />
  <AlertTitle>Low disk space</AlertTitle>
  <AlertDescription>2GB remaining on /dev/sda1.</AlertDescription>
</Alert>
```
