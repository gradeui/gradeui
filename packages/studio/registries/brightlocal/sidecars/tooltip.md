---
name: Tooltip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tooltip"
subcomponents: [TooltipProvider, TooltipTrigger, TooltipContent]
props:
  - open?: boolean
  - defaultOpen?: boolean
  - onOpenChange?
  - delayDuration?: number — The duration from when the pointer enters the trigger until the tooltip gets opened. This will override the prop with the same name passed to Provider. @defaultValue 700
  - disableHoverableContent?: boolean — When `true`, trying to hover the content will result in the tooltip closing as the pointer leaves the trigger. @defaultValue false
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — TooltipContent: Optional analytics element identifier
  - trackingLabel?: string — TooltipContent: Optional analytics label context
  - hideArrow?: boolean — TooltipContent: Hide the tooltip arrow
  - skipDelayDuration?: number — TooltipProvider:
when_to_use: Do NOT use for: interactive content (use Popover); complex content (use HoverCard).
aliases: [hover tip, info tip, help text]
---

```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" dataHook="button">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent dataHook="tooltip">
      Add to library
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```
```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" dataHook="tooltip-trigger">
        Hover me
      </Button>
    </TooltipTrigger>
    <TooltipContent dataHook="tooltip-content">
      Add to library
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-tooltip--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
