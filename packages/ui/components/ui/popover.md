---
name: Popover
import: "@gradeui/ui"
subcomponents: [PopoverTrigger, PopoverContent, PopoverAnchor]
props:
  - Popover: open?, defaultOpen?, onOpenChange?, modal? (default false)
  - PopoverTrigger: asChild?: boolean — usually a Button
  - PopoverContent: side? "top" | "right" | "bottom" | "left"; align? "start" | "center" | "end"; sideOffset?, alignOffset?, collisionPadding?, className?
  - PopoverAnchor: asChild?: boolean — pin the popover to a different element than the trigger
when_to_use: A floating panel anchored to a trigger that contains interactive content — date pickers, color pickers, filter pickers, "more info" panels, inline forms. Differs from Tooltip (hover-only, no focusable content) and Dialog (modal, blocks the page). DatePicker, DateRangePicker, and the Combobox pattern all compose Popover internally.
composes_with: [Button (as trigger), Calendar (date picker), Command (combobox), Form controls (inline edit popover)]
aliases: [popover, dropdown panel, floating panel, inline editor, attached panel, filter pop, popover view, popoverpresentation, attached popover]
---

```jsx
// Filter popover anchored to a Button trigger.
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Filter /> Filters
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-72" align="end">
    <Stack gap="md">
      <Stack gap="xs">
        <Label>Plan</Label>
        <Select>{/* … */}</Select>
      </Stack>
      <Stack gap="xs">
        <Label>Status</Label>
        <Select>{/* … */}</Select>
      </Stack>
    </Stack>
  </PopoverContent>
</Popover>
```

PopoverContent ships at elevation-4. Opt into glass for a frosted look, or layer in aura when the popover is AI-driven:

```jsx
<PopoverContent className="gds-surface-glass">…</PopoverContent>
<PopoverContent className="gds-aura-ring">Studio suggestion</PopoverContent>
```
