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
when_to_use: A small set of mutually-exclusive (`type="single"`) or independent (`type="multiple"`) binary options that live side-by-side as a segmented control — viewport size picker (Mobile/Tablet/Desktop), text alignment, view density. Reads identically to a TabsList of the same size; reach for ToggleGroup when each option emits a value (like a form input) rather than swapping panels. Use Tabs for panel switching, Toggle for a single on/off.
composes_with: [Card (header controls), Row, AppShellHeader chrome, settings panels]
aliases: [toggle group, segmented control, segmented buttons, button group, pill group, view selector]
---

```jsx
// Single-select segmented control — viewport size picker.
<ToggleGroup type="single" defaultValue="desktop" size="sm">
  <ToggleGroupItem value="mobile" aria-label="Mobile"><Smartphone /></ToggleGroupItem>
  <ToggleGroupItem value="tablet" aria-label="Tablet"><Tablet /></ToggleGroupItem>
  <ToggleGroupItem value="desktop" aria-label="Desktop"><Monitor /></ToggleGroupItem>
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
