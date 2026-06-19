---
"@gradeui/ui": patch
---

Combobox: the leading option icon now inverts with its row. It was pinned to `text-muted-foreground`, so on the highlighted/selected row (accent fill, `accent-foreground` text) the icon stayed muted grey and read as wrong against the fill. Icons are now muted at rest and pick up `accent-foreground` when the row is highlighted, matching the label.
