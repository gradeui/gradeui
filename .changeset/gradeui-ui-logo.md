---
"@gradeui/ui": minor
---

Add `Logo` — a brand mark with built-in lockup, on-light / on-dark, and monochrome variations.

A brand rarely has one logo: a square mark for tight spaces, a horizontal lockup for headers, single-colour versions for busy or inverted surfaces. `Logo` holds that set and renders the right one for the context, so toolbars, sidenavs, and footers can all reach for the same component.

- `sources` — artwork keyed by lockup (`square` / `horizontal` / `icon`) then appearance (`light` / `dark` / `mono`). Each slot is any node (inline `<svg>`, `<img>`, a component). Supply only what you have; it falls back across appearances and lockups.
- `lockup`, `mode` (explicit light/dark, not theme-coupled), `mono`, `size` (t-shirt or pixel height), `label` / `decorative` for a11y, optional `href` to link.
- Monochrome artwork inherits `currentColor`. A neutral placeholder renders when a slot has no artwork yet (handy in Studio before wiring real art).
