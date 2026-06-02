---
"@gradeui/ui": minor
---

Add `lib/motion`: a global motion control.

`useReducedMotion()` is now the single choke point for "should this animate?". It ORs the OS `prefers-reduced-motion: reduce` query with a `data-motion="off"` attribute on `<html>`, so a manual toggle can still every animated surface at once (ThreeScene, RivePlayer, VideoPlayer, aura) on top of honouring the OS preference.

- `useReducedMotion()` — live (media-query change + attribute observer), SSR-safe.
- `setMotion(enabled)` — imperatively flip the `<html>` toggle.
- `MOTION_ATTR` — the `data-motion` attribute name.
- `usePrefersReducedMotion` — deprecated alias of `useReducedMotion`, kept for back-compat; it now also folds in the toggle.

Reduce-only by design: the toggle can suppress motion but never forces it on for a viewer whose OS asks for reduced motion. A matching `[data-motion="off"]` reset in the stylesheet covers pure-CSS animation and transition.
