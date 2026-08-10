---
"@gradeui/ui": patch
---

Calendar: the cell-size variable utilities used Tailwind v3 arbitrary syntax (`w-[--cell-size]`), which v4 silently drops, collapsing the month grid to content width (crammed day cells). Converted to v4 parenthetical syntax (`w-(--cell-size)`). DatePicker: the trigger aligns with the field family (h-9, text-sm) instead of Button's md sizing, so a picked date reads like every other field value.
