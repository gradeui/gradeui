---
"@gradeui/ui": minor
---

Add `Grid` — the 2D layout primitive, completing the Stack/Row/Grid trio. `cols` prop (`"1" | "2" | "3" | "4" | "5" | "6" | "12"`) bakes in a sensible responsive ladder so `<Grid cols="4">` expands to the canonical `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` stat-card pattern. `gap` and `align` scales match Stack and Row so props transfer cleanly when switching layout types.
