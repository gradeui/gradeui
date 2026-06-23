---
"@gradeui/ui": minor
---

Two surface-consistency fixes found while dogfooding in the Astro sites spike:

- **MediaSurface no longer rounds its corners by default.** `radius` now defaults to `"none"` (was `"lg"`). Baked-in rounding looked wrong when a slot sits flush at the top of a Card — the bottom corners curled away and showed the Card behind them. Rounding stays a one-prop opt-in: `radius="lg"` / `"xl"` for a standalone image. This is a visual change for any MediaSurface relying on the old default; pass `radius="lg"` to restore it.
- **Segmented ToggleGroup track is now opaque** (`bg-muted`, was `bg-muted/70`), matching the opaque `TabsList` track. On a glass/translucent surface the 70%-alpha track let the page show through while the adjacent Tabs did not — an inconsistent, jarring mix. Both segmented controls now read identically.
