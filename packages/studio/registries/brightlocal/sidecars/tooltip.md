---
name: Tooltip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/tooltip"
subcomponents: [TooltipProvider, TooltipTrigger, TooltipContent]
props:
  - delayDuration? — TODO(review): type + one-line description from src
  - skipDelayDuration? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - align? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
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
