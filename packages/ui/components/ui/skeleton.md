---
name: Skeleton
import: "@gradeui/ui"
props:
  - className?: string — required in practice; supply width/height utilities
  - All native div HTML attrs
when_to_use: Loading placeholder for content whose shape you know. Set width/height via className to mimic the real content (e.g. "h-4 w-32"). Not a spinner — use it where the real thing will drop in.
composes_with: [Card, Avatar (inside a Skeleton for avatar loading), any layout]
aliases: [placeholder, shimmer, loader, loading state, redacted, redacted placeholder, shimmer placeholder, content placeholder, lottie placeholder]
---

```jsx
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```
