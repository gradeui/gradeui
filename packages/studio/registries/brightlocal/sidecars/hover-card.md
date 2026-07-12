---
name: HoverCard
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/hover-card"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - openDelay? — TODO(review): type + one-line description from src
  - closeDelay? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
---

```jsx
<HoverCard>
  <HoverCardTrigger
    dataHook="hover-trigger"
    disabled
  >
    Trigger Text
  </HoverCardTrigger>
  <HoverCardContent
    className="w-80"
    dataHook="hover-card-content"
  >
    <Slot />
  </HoverCardContent>
</HoverCard>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-hovercard--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
