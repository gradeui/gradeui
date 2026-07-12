---
name: AspectRatio
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/aspect-ratio"
props:
  - ratio? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<div className="w-[300px]">
  <AspectRatio ratio={16 / 9} dataHook="video-container">
    <img
      src="/image.jpg"
      alt="Description"
      className="h-full w-full object-cover"
    />
  </AspectRatio>
</div>
```
```jsx
<div className="w-[300px]">
  <AspectRatio
    dataHook="aspect-ratio"
    ratio={0.6666666666666666}
    storyDescription="2:3 aspect ratio"
    trackingEl="aspect-ratio-element"
    trackingLabel="AspectRatio Component"
  >
    <img
      alt="Photo by Drew Beamer"
      className="h-full w-full rounded-md object-cover"
      src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
    />
  </AspectRatio>
</div>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-aspectratio--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
