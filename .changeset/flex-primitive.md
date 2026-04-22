---
"@gradeui/ui": minor
---

Add `Flex` — the unopinionated flexbox primitive, the CSS-aligned escape hatch under Stack / Row / Grid. Exposes `direction` (`"row" | "col" | "row-reverse" | "col-reverse"`), `gap`, `align` (including `baseline`, which Stack/Row don't expose), `justify`, and `wrap` (`"nowrap" | "wrap" | "wrap-reverse"`) directly. Defaults match CSS — no baked-in rhythm — so consumers pay for exactly the props they set. Reach for Flex when Stack / Row / Grid don't fit (reverse direction, baseline alignment, or when you want raw CSS defaults instead of Row's `items-center gap-md` starting point).
