---
name: Toggle
import: "@gradeui/ui"
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - variant? (default | outline) — outline adds a border, default is borderless and ghost-like
  - size? (default | sm | lg)
  - pressed?: boolean — controlled pressed state
  - defaultPressed?: boolean — uncontrolled initial state
  - onPressedChange?: (pressed: boolean) => void
  - disabled?: boolean
  - children: React.ReactNode — usually an icon or short label
when_to_use: A standalone on/off button — Bold/Italic in a toolbar, "Show grid" in a header, single binary toggle that doesn't belong inside a Switch row. For two-or-more mutually-exclusive options use ToggleGroup. For a labeled settings switch ("Active: on/off") use Switch.
composes_with: [Tooltip (wrap an icon-only Toggle), Row, TabsList (sibling)]
aliases: [toggle, toggle button, press button, bold button, italic button]
---

```jsx
// Single toolbar toggle — icon + tooltip for screen readers.
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Toggle aria-label="Toggle bold">
        <Bold />
      </Toggle>
    </TooltipTrigger>
    <TooltipContent>Bold</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

```jsx
// Borderless variant — fits inline among other controls.
<Toggle defaultPressed>Show grid</Toggle>
```
