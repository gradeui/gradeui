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
  - children — Each child is one item in the reveal cycle. Pass a TypographyText or TypographyHeading as a child. @example ```tsx <TypographyText dataHook="w1">Analyzing</TypographyText> <TypographyText dataHook="w2">Processing</TypographyText> ```
when_to_use: DEPRECATED in @brightlocal/ui-components 3.0.0 (DS-907), removal planned once product usage is gone. Do NOT emit it in new screens. Cycling phrases on a timer breaks the Loading pattern's honesty principle, because the phrases are not stages the backend reported. Use a section Skeleton, or a named-stages running screen driven by real stage data (Patterns / Loading). The examples below are kept only to read existing screens.
---

Deprecated (DS-907). The examples use the 3.0.0 type scale (TypographyText, TypographyHeading) for the children, since the old typography family is deprecated too (DS-714).

```jsx
<TextRevealMotion dataHook="my-reveal">
  <TypographyText dataHook="w1">Analyzing</TypographyText>
  <TypographyText dataHook="w2">Processing</TypographyText>
  <TypographyText dataHook="w3">Loading</TypographyText>
</TextRevealMotion>
```
```jsx
<TextRevealMotion dataHook="my-reveal" loadingLabel={t("loading")}>
  <TypographyText dataHook="w1">Analyzing</TypographyText>
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
  <TypographyHeading level={2} variant="section" dataHook="heading-1">
    Welcome
  </TypographyHeading>
  <TypographyHeading level={2} variant="section" dataHook="heading-2">
    Bienvenue
  </TypographyHeading>
  <TypographyHeading level={2} variant="section" dataHook="heading-3">
    Willkommen
  </TypographyHeading>
</TextRevealMotion>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-textrevealmotion--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
