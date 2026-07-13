---
name: HoverCard
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/hover-card"
subcomponents: [HoverCardTrigger, HoverCardContent]
props:
  - openDelay?: number — Time in milliseconds to delay opening the hover card (default 300)
  - closeDelay?: number — Time in milliseconds to delay closing the hover card (default 300)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - disabled?: boolean — HoverCardTrigger: Whether the trigger is disabled
  - trackingEl?: string — HoverCardTrigger: Optional analytics element identifier
  - trackingLabel?: string — HoverCardTrigger: Optional analytics label context
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
