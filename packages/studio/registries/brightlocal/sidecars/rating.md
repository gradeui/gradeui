---
name: Rating
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/rating"
props:
  - value: number — The rating value (0-5, supports 0.5 increments)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - size? — Size of the star icons. (default "sm")
---

```jsx
<Rating dataHook="product-rating" value={4.5} />
<Rating dataHook="product-rating-lg" value={4.5} size="md" />
```
```jsx
<Rating dataHook="rating" value={4.5} ariaLabel={t("rating.label", { value: "4.5" })} />
```
```jsx
<Rating
  dataHook="rating"
  size="md"
  storyDescription="Medium size (24px)"
  value={4.5}
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-rating--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
