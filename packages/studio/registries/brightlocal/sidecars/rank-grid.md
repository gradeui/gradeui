---
name: RankGrid
import: "@brightlocal/proposal"
props:
  - grid — Rows of ranks (number | null), any rectangular shape; null = unranked/over-20 (renders "-"). Bind data.localSearchGrid.grid (brightlocal-source capture).
  - showLocationPin?: boolean — The business MapLocationPin over the grid centre. HIDDEN by default; the LSG page opts in and pairs it with a toggle. (default false)
  - size? (full | mini) — Preset: "full" = DS 32px pins / 20px gaps (the LSG page); "mini" = 24px / 8px (hub card). pinSize/gap beat the preset.
  - pinSize?: number — Explicit pin diameter in px (inline style — beats the DS size-8). The lever a zoom handler drives when the real map lands; the map must clamp zoom min/max so pins never overlap (live-product bug, see rules/90-audit.md).
  - gap?: number — Explicit grid gap in px.
  - interactive?: boolean — STATIC by default (decorative, pins aria-hidden). Interactive = pins become buttons with hover affordance and fire onPinClick — the seam for the DS MapPopover drill-down. (default false)
  - onPinClick?: (rank, index) => void — Only fires when interactive.
  - surface?: boolean — The grid ALWAYS displays in its map context: a stand-in map surface (muted panel + dot texture) wraps it BY DEFAULT — pins never float bare on a card. Pass false ONLY when the screen supplies its own bigger canvas (the LSG page does — its legend/zoom/toggle chrome lives inside it). (default true)
  - dataHook?: string — Instance name. (default "rank-grid")
when_to_use: The Local Search Grid VIZ and only the viz — rank pins (DS MapGridPin, variants mapped to the live legend bands 1-3/4-10/11-20/over-20) in a grid, optional centre location pin. TWO consumers by design - the LSG page (full + interactive, chrome around it stays screen-side: selects, MapLegend, zoom stack, hide-pin toggle) and the hub's Local Search Grid card (mini + static). Ships in "@brightlocal/proposal"; the DS ships NO map surface (recipe-not-component) — when a Google Maps key exists, RankGrid's pins move onto the real vis.gl <Map> styled with MAP_STYLES.
composes_with: [AppLayoutShell, HubCard, MapLegend]
---

```jsx
// LSG page (full, interactive, toggleable pin):
<RankGrid grid={lsg.grid} size="full" interactive showLocationPin={showPin} dataHook="lsg-grid" />
// Hub card (mini, static, no pin):
<RankGrid grid={lsg.grid} size="mini" dataHook="hub-lsg-grid" />
```
