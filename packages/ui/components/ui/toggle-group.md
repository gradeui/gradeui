---
name: ToggleGroup
import: "@gradeui/ui"
subcomponents: [ToggleGroupItem]
variants: [default, outline]
sizes: [sm, md, lg]
props:
  - ToggleGroup: type: "single" | "multiple" — single picks one, multiple picks any number
  - ToggleGroup: value?: string | string[] — controlled; matches `type` (string for single, string[] for multiple)
  - ToggleGroup: defaultValue?: string | string[] — uncontrolled initial
  - ToggleGroup: onValueChange?: (value: string | string[]) => void
  - ToggleGroup: size? (sm | md | lg, default md) — cascades to every ToggleGroupItem via context, matches Tabs/Button heights
  - ToggleGroup: variant? (default | outline)
  - ToggleGroupItem: value: string — what the group reports when this item is pressed
  - ToggleGroupItem: tooltip?: ReactNode — when set, wraps the item in a Tooltip; required for icon-only items where the visible chrome doesn't carry a label
  - ToggleGroupItem: tooltipSide? ("top" | "right" | "bottom" | "left", default "top") — side the tooltip renders on
  - ToggleGroupItem: tooltipDelay?: number — per-item delay override; falls back to the upstream TooltipProvider's delayDuration
when_to_use: A small set of mutually-exclusive (`type="single"`) or independent (`type="multiple"`) binary options that live side-by-side as a segmented control — viewport size picker (Mobile/Tablet/Desktop), text alignment, view density. Reads identically to a TabsList of the same size; reach for ToggleGroup when each option emits a value (like a form input) rather than swapping panels. Use Tabs for panel switching, Toggle for a single on/off.
composes_with: [Card (header controls), Row, AppShellHeader chrome, settings panels]
aliases: [toggle group, segmented control, segmented buttons, button group, pill group, view selector, segmented picker, segmentedcontrolios, segmented buttons group, rn segmented control]
---

```jsx
// Single-select segmented control — viewport size picker with
// icon-only items + tooltips. The `tooltip` prop also fills in
// `aria-label` for screen readers, so consumers don't have to
// duplicate the label.
<ToggleGroup type="single" defaultValue="desktop" size="sm">
  <ToggleGroupItem value="mobile" tooltip="Mobile — 390px"><Smartphone /></ToggleGroupItem>
  <ToggleGroupItem value="tablet" tooltip="Tablet — 768px"><Tablet /></ToggleGroupItem>
  <ToggleGroupItem value="desktop" tooltip="Desktop — 1024px"><Monitor /></ToggleGroupItem>
  <ToggleGroupItem value="responsive" tooltip="Responsive — fills the column"><MoveHorizontal /></ToggleGroupItem>
</ToggleGroup>
```

```jsx
// Multi-select — text formatting toolbar.
<ToggleGroup type="multiple">
  <ToggleGroupItem value="bold" aria-label="Bold"><Bold /></ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic"><Italic /></ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Underline"><Underline /></ToggleGroupItem>
</ToggleGroup>
```
