---
name: Progress
import: ./components/ui/progress
props:
  - value?: number (0–100) — percent complete
  - max?: number (default 100)
  - className?: string
when_to_use: Determinate progress — file uploads, multi-step forms, quota meters. Indeterminate state → use Skeleton or animated Loader icon.
composes_with: [Card (as a section), Badge (showing % next to it), Label (describing what's loading)]
---

```jsx
<Progress value={42} />
```
