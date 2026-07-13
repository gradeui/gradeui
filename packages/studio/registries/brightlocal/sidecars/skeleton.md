---
name: Skeleton
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/skeleton"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - loadingLabel?: string — Accessible label announced to screen readers during loading. (default "Loading")
---

```jsx
<Skeleton className="h-4 w-[250px]" loadingLabel={t("skeleton.loading")} />
```
```jsx
<div className="space-y-4">
  <div className="space-y-2">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-[250px]" />
  </div>
  <Skeleton className="h-48 w-full rounded-lg" />
</div>
```
```jsx
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[250px]" />
</div>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-skeleton--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
