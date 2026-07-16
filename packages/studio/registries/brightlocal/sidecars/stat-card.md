---
name: StatCard
import: "@brightlocal/proposal"
props:
  - label — Small uppercase label above the value ("Average Position"). Required.
  - value? — Headline value (ReactNode). Wins over the metricKey binding.
  - metricKey?: string — DATA BINDING: key into data.metrics — value/delta read from the proposal data context at render position. Prefer over literals where the seam has the number.
  - delta? — Small Badge beside the value ("+4.2% vs last month"). Wins over bound.
  - tone? (default | success | destructive | neutral) — ONE knob colouring value + trend icon + delta badge AS A SET. "default" = plain value, success-toned badge; "success"/"destructive" also tint the value and icon; "neutral" = secondary badge, no tinting. Never style parts individually. (default "default")
  - icon? — Optional trend icon component rendered after the value (TrendingUp / TrendingDown from @brightlocal/icons).
  - info?: string — Tooltip text; renders the ghost (i) button top-right.
  - level? (page | nested) — Card level. "page" sits on the canvas (white card on the raised layer); "nested" sits ON another card — steps down to the neutral-50 tier with a border, for a stat row at the top of a bigger module card. (default "page")
  - goto?: string — Screen link (STUDIO-FLOWS); stamps data-grade-goto.
  - transition? (fade | slide-left | slide-right | none) — Swap treatment for the goto.
  - dataHook?: string — Instance name; the info button derives "<dataHook>-info".
  - className?: string — LAYOUT ONLY (grid placement) — never restyle the tile.
when_to_use: EVERY compact metric tile — the summary stat rows on module pages (rankings, LSG, reviews). Used a lot; consistency is the point — same anatomy everywhere, one tone knob, presets over knobs. Put tiles in a grid (grid-cols-2 md:grid-cols-4 gap-4). Do NOT hand-roll Card + CardContent + pt-6 for stats: BL's Card already pads content and the shadcn pt-6 idiom double-pads (the oversized-top-gap bug). Use HubStatCard instead for hub MODULE tiles (icon + title + description + drill-down chevron); StatCard is the bare number.
composes_with: [HubStatCard, AppLayoutShell, Card, Badge, Tooltip]
---

```jsx
import { StatCard } from "@brightlocal/proposal";
import { TrendingUp, TrendingDown } from "@brightlocal/icons";

<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard label="Average Position" value="5.8" delta="improving" dataHook="stat-avg-card" info="Average rank across all tracked keywords." />
  <StatCard label="In Top 3" value="2 / 5" tone="neutral" dataHook="stat-top3-card" />
  <StatCard label="Moved Up" value="3" tone="success" icon={TrendingUp} dataHook="stat-up-card" />
  <StatCard label="Moved Down" value="1" tone="destructive" icon={TrendingDown} dataHook="stat-down-card" />
</div>
```

Card-on-card: give a big module Card a stat row with `level="nested"` —
the tiles step down to the neutral-50 tier so the hierarchy reads:

```jsx
<Card variant="filled" className="max-w-none">
  <CardHeader>…</CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <StatCard level="nested" label="SoLV" value="52%" />
      <StatCard level="nested" label="Avg Position" value="5.5" />
      <StatCard level="nested" label="Top 3" value="13 / 25" tone="neutral" />
    </div>
    …body…
  </CardContent>
</Card>
```

Ships in "@brightlocal/proposal" — never inline a copy.
