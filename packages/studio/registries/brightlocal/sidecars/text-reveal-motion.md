---
name: TextRevealMotion
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/text-reveal-motion"
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - holdTime?: number — How long (ms) each item stays fully visible. The ball keeps morphing and rotating during the hold. (default 1300)
  - shimmer?: boolean — Show shimmer sweep after each reveal. (default true)
  - gradientFrom?: string — Gradient start color. Accepts any CSS color value. (default "var(--loading-gradient-from)")
  - gradientTo?: string — Gradient end color. Accepts any CSS color value. (default "var(--loading-gradient-to)")
  - loadingLabel?: string — Accessible label for the loading animation. (default "Loading")
  - trackingEl?: string — Tracking element identifier for analytics.
  - trackingLabel?: string — Tracking label for analytics context.
  - children — Each child is one item in the reveal cycle. Pass any Typography component as a child. @example ```tsx <TypographyP dataHook="w1">Analyzing</TypographyP> <TypographyP dataHook="w2">Processing</TypographyP> ```
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
