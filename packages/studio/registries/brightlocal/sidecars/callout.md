---
name: Callout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/callout"
subcomponents: [CalloutHeading, CalloutCitation]
variants: [primary, purple, blue, green]
props:
  - pointer? (top | bottom | left | right | none)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<Callout variant="primary" pointer="bottom" dataHook="onboarding-callout">
  <CalloutHeading>Let's get you set up.</CalloutHeading>
</Callout>

<Callout variant="purple" dataHook="stat-callout">
  <CalloutHeading>93% of consumers read online reviews.</CalloutHeading>
  <CalloutCitation>— BrightLocal Consumer Review Survey 2024</CalloutCitation>
</Callout>
```
```jsx
<Callout
  dataHook="callout-blue"
  pointer="none"
  storyDescription="Without pointer"
  variant="blue"
>
  <CalloutHeading>
    Your online reputation is your most valuable marketing asset.
  </CalloutHeading>
  <CalloutCitation>
    — BrightLocal Industry Report
  </CalloutCitation>
</Callout>
```
```jsx
<Callout
  dataHook="callout-primary"
  pointer="none"
  storyDescription="Without pointer"
  variant="primary"
>
  <CalloutHeading>
    Let's get you set up.
  </CalloutHeading>
</Callout>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-callout--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
