---
name: Popover
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/popover"
subcomponents: [PopoverTrigger, PopoverContent]
props:
  - defaultOpen?: boolean — The open state when initially rendered. Use when you do not need to control the open state.
  - open?: boolean — The controlled open state of the popover.
  - onOpenChange? — Event handler called when the open state of the popover changes.
  - modal?: boolean — When true, interaction with outside elements is disabled and only popover content is visible to screen readers.
  - asChild?: boolean — PopoverTrigger: Change the default rendered element for the one passed as a child, merging their props and behavior.
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - side? — PopoverContent: The preferred side of the anchor to render against. Will be reversed when collisions occur.
  - sideOffset?: number — PopoverContent: The distance in pixels from the anchor.
  - align? — PopoverContent: The preferred alignment against the anchor. May change when collisions occur.
  - alignOffset?: number — PopoverContent: An offset in pixels from the "start" or "end" alignment options.
  - avoidCollisions?: boolean — PopoverContent: When true, overrides side and align to prevent collisions with boundary edges.
  - sticky? — PopoverContent: The sticky behavior on the align axis. "partial" keeps content in boundary as long as trigger is at least partially in boundary.
  - hideWhenDetached?: boolean — PopoverContent: Whether to hide content when the trigger becomes fully occluded.
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
