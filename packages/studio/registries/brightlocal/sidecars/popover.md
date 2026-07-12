---
name: Popover
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/popover"
subcomponents: [PopoverTrigger, PopoverContent]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - defaultOpen? — TODO(review): type + one-line description from src
  - modal? — TODO(review): type + one-line description from src
  - align? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: tooltips (use Tooltip); menus (use DropdownMenu).
aliases: [floating panel, popup panel, info popup]
---

```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Open popover</Button>
  </PopoverTrigger>
  <PopoverContent>
    Place content for the popover here.
  </PopoverContent>
</Popover>
```
```jsx
<Popover>
  <PopoverTrigger asChild>
    <Button dataHook="popover-trigger">Open popover</Button>
  </PopoverTrigger>
  <PopoverContent dataHook="popover-content">
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="leading-none font-medium">Dimensions</h4>
        <p className="text-muted-foreground text-sm">
          Set the dimensions for the layer.
        </p>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <Label htmlFor="width">Width</Label>
          <Input id="width" defaultValue="100%" dataHook="width-input" />
        </div>
        <div className="grid grid-cols-[100px_1fr] items-center gap-4">
          <Label htmlFor="height">Height</Label>
          <Input id="height" defaultValue="25px" dataHook="height-input" />
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-popover--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
