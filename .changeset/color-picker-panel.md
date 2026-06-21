---
"@gradeui/ui": minor
---

ColorPicker reworked into the Figma "Color Picker" popover, and adopted as the inspector's one colour control:

- New `<ColorPickerPanel>` export — the popover body (header title + ghost close button, search, grouped DropdownMenuItem-style rows: Swatch + token name + check). `<ColorPicker>` now composes it behind its own trigger, and the Studio inspector hosts the same panel inside its TokenField-chrome fields so every colour control shares one list.
- New `title` prop on `ColorPicker` (default `"Color"`; pass `null` to drop the header) and `onClose` on `ColorPickerPanel`. `shortName` is exported as `colorTokenShortName`.
- Compact rows (`text-xs`, 12px) and a fixed-height scroll area so filtering never resizes the popover (Radix no longer repositions mid-search).
- `PopoverClose` is now exported from `popover.tsx`.

Inspector: Fill solid, gradient stops, border colour, and text colour all now render as TokenFields (leading swatch + bound chip) that open this picker — replacing the previous plain token Selects and the oversized default ColorPicker trigger.
