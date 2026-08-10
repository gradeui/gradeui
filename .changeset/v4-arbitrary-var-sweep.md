---
"@gradeui/ui": patch
---

Sweep the remaining Tailwind v3 arbitrary-variable utilities (`x-[--var]`), which v4 silently drops, to the v4 parenthetical form: chart tooltip/legend indicator colours (`bg-[--color-bg]` rendered transparent) and the Radix transform-origin on DropdownMenu, HoverCard, Popover and Tooltip (open/close animations scaled from centre instead of the trigger). Companion to the Calendar cell-size fix.
