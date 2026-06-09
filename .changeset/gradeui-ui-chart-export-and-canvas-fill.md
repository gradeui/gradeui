---
"@gradeui/ui": minor
---

Export the `Chart` family from the public barrel + make `--gds-canvas-fill` mode-aware.

- **`Chart` is now part of the public API.** `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle` (and the `ChartConfig` type) are exported from `@gradeui/ui` — previously the component existed but was never re-exported from `lib/index.ts`, so `import { ChartContainer } from "@gradeui/ui"` failed. It's the themed Recharts wrapper: bring the chart shape (`Bar`/`Line`/`Area`/`Pie` from `recharts`) and nest it inside `<ChartContainer config={…}>`; the wrapper threads design-system tokens through Recharts and supplies a styled tooltip + legend. Reference series colours as `fill="var(--color-<key>)"`. (Also added to the Studio emission allowlist.)

- **`--gds-canvas-fill` is now mode-aware.** It was a fixed near-black (`#0b0b0e`) with no light variant, so the letterbox bars behind a contained screen (embed / share / fullscreen preview) and the `ScreenAnimator` stage stayed black in light mode. Now a soft neutral (`#e8e8ec`) in light and the near-black in dark — one token, mode-scoped. Override or set to `transparent` as before.
