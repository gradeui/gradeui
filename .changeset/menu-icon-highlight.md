---
"@gradeui/ui": patch
---

Menu items now invert their icons on highlight. A leading icon with its own colour (e.g. a muted folder, a primary check) used to stay that colour on the highlighted/selected row, where the text had flipped to `accent-foreground`, leaving the icon stranded and low-contrast on the accent fill. `DropdownMenuItem` (and sub-trigger / checkbox / radio items), `SelectItem`, and `Combobox` options now flip every SVG to `accent-foreground` while the row is highlighted, so the icon tracks the label. Resting-state icon colours are unchanged.
