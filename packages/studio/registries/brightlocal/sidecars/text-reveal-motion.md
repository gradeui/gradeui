---
name: TextRevealMotion
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/text-reveal-motion"
props:
  - holdTime? — TODO(review): type + one-line description from src
  - shimmer? — TODO(review): type + one-line description from src
  - gradientFrom? — TODO(review): type + one-line description from src
  - gradientTo? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<TextRevealMotion dataHook="my-reveal">
  <TypographyP dataHook="w1">Analyzing</TypographyP>
  <TypographyP dataHook="w2">Processing</TypographyP>
  <TypographyP dataHook="w3">Loading</TypographyP>
</TextRevealMotion>
```
```jsx
<TextRevealMotion dataHook="my-reveal" loadingLabel={t("loading")}>
  <TypographyP dataHook="w1">Analyzing</TypographyP>
</TextRevealMotion>
```
```jsx
<TextRevealMotion
  _renderOverride="mixed"
  dataHook="text-reveal"
  holdTime={1300}
  shimmer
  storyDescription="Mixed typography sizes"
>
  <TypographyH2 dataHook="heading-1">
    Welcome
  </TypographyH2>
  <TypographyH2 dataHook="heading-2">
    Bienvenue
  </TypographyH2>
  <TypographyH2 dataHook="heading-3">
    Willkommen
  </TypographyH2>
</TextRevealMotion>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-textrevealmotion--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
