---
name: MiniStat
import: "@brightlocal/proposal"
props:
  - icon? — Icon component (from @brightlocal/icons), top-right of the tile.
  - title — Tile label (small semibold), top-left.
  - value — Headline number (ReactNode).
  - valuePrefix? — Leading node beside the number (e.g. a filled review star).
  - delta? — Green ↗ chip beside the number (string/number). Omit for no movement.
  - caption? — Muted line under the number. Prefer OMITTING on dense heroes (Ali, 17 Jul).
  - dataHook?: string — Instance name (default "mini-stat").
when_to_use: One "small insight" stat in a MiniStatStrip — passive display tile (title + icon, big number + optional delta) on a pale NEUTRAL surface (--bl-surface-muted → #f2f7f3; a warm-cast neutral, NOT green-50). Use for at-a-glance performance numbers inside a hero or summary card. NOT interactive — for a drill-down module tile with goto, use HubStatCard instead. Bind values from useProposalData() (visibility.googleMaps, competitors self row, metrics.*) — never author numbers.
composes_with: [MiniStatStrip, HubStatCard, Card]
---

```jsx
<MiniStatStrip>
  <MiniStat icon={TrendingUp} title="Rank position" value={maps.avgRank} delta={maps.avgRankDelta} />
  <MiniStat icon={Star} title="Review score" value={self.rating} valuePrefix={<Star className="size-6 fill-[var(--ds-tailwind-colors-amber-400)] text-[var(--ds-tailwind-colors-amber-400)]" />} />
</MiniStatStrip>
```

Ships in "@brightlocal/proposal" — never inline a copy. MiniStatStrip is the
4-up grid wrapper (2-up under xl, gap-4); its children are MiniStat tiles.
