---
"@gradeui/ui": minor
---

Button sizing reworked to match the Figma Button with zero drift:

- `2xs` and `xs` are now first-class `size` values (previously only in the cva, so they worked at runtime but the Studio inspector treated them as raw overrides). `2xs` corrected to `h-5` (20px). Full ramp: 2xs 20 · xs 24 · sm 28 · md 32 · lg 40.
- New `iconOnly` boolean: squares the button at the current `size` height (width = height, no horizontal padding) so you can make a square icon-only button at *any* density (`size="sm" iconOnly` → 28², `size="2xs" iconOnly` → 20²). The icon child is centered.
- BREAKING: `size="icon"` is removed. Migrate `size="icon"` → `iconOnly` (identical 32² result, since `iconOnly` defaults to the md height). All in-repo call sites have been migrated.
- Code Connect updated: `size` map drops `icon`, adds `iconOnly` (mapped from an "Icon only" Figma variant axis).
