---
name: Progress
import: "@gradeui/ui"
element: div
props:
  - value?: number (0–100) — percent complete
  - max?: number (default 100)
  - tone?: "primary" | "accent" | "muted" — fill colour of the bar (default "primary"). Reach for "accent" when the bar is LARGE, a full-width wizard header bar in the action colour reads as competing with the page's actual actions rather than as progress. "muted" for a purely informational gauge (quota, storage) where brand colour over-signals. Use this prop; do NOT tint the indicator with a child selector from outside.
  - className?: string
when_to_use: Determinate progress — file uploads, multi-step forms, quota meters. Indeterminate state → use Skeleton or animated Loader icon.
composes_with: [Card (as a section), Badge (showing % next to it), Label (describing what's loading)]
aliases: [progress, progress view, progress indicator, progress bar, determinate progress, loading bar, completion bar]
---

```jsx
<Progress value={42} />
```
