---
"@gradeui/ui": patch
---

Fix `ThreeScene` palette when tokens are authored as bare channel triplets (shadcn / gradeui convention — `--primary: 0.610 0.128 20`, no `oklch()` wrapper).

Passing `palette={{ primary: "var(--primary)" }}` on the gradeui default theme rendered the shader pure black because `var(--primary)` expanded to the raw string `"0.610 0.128 20"`, which is not a valid CSS `<color>` — the browser fell back to the inherited colour (black) and the palette resolver happily handed that to THREE.

The resolver now peeks at the raw custom-property value whenever the input is a `var(--token)` reference. If the value looks like an OKLCH triplet (three bare floats) or an HSL triplet (shadcn-style, with `%` on channels 2 and 3), it's re-wrapped as `oklch(...)` / `hsl(...)` before being handed to the DOM probe. Fully-formed colours (`oklch(...)`, `#hex`, `rgb(...)`, named colours, and `var(...)` pointing at a pre-wrapped value) are unchanged.

Net effect: `palette={{ primary: "var(--primary)", secondary: "var(--secondary)", ... }}` now Just Works on gradeui themes and re-tints on theme change, matching the docs.
