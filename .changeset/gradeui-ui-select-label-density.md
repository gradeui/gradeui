---
"@gradeui/ui": patch
---

`SelectLabel` now reads the menu density from `SelectContent` (the same context `SelectItem` uses). Compact menus (`size="xs"` / `"2xs"`) render group headings as quiet muted eyebrow labels aligned with the item text indent, instead of full-size semibold headings towering over 2xs options.
