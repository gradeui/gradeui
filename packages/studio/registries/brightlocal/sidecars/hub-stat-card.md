---
name: HubStatCard
import: "@brightlocal/proposal"
props:
  - icon — Icon component (from @brightlocal/icons), rendered in a neutral-50 tile.
  - title — Card title (CardTitle size="small", semibold).
  - metricKey?: string — DATA BINDING: key into data.metrics ("reviews", "rankings", "citations", "localSearchGrid", "gbpManager", "websiteSeo") — metric/delta/description read from the proposal data context at render position, so dataset switches re-skin the card live. PREFER this over literal values.
  - metric? — Headline value (ReactNode). Wins over the bound value.
  - delta? — Secondary Badge next to the metric (ReactNode). Wins over bound.
  - description? — CardDescription line. Wins over bound.
  - goto?: string — Screen link (STUDIO-FLOWS): screen name or "screen:<id>" this card drills into; stamps data-grade-goto so shares/embeds navigate on click.
  - transition? (fade | slide-left | slide-right | none) — Swap treatment for the goto (data on the link; stamps data-grade-transition).
  - ctaHook?: string — Names the drill-down chevron for QA/AT.
  - dataHook?: string — Instance name.
when_to_use: One module tile on a hub/overview page — icon, title, drill-down chevron, description, big metric (+ delta Badge). The whole card is a click target; put cards in a grid whose tracks own the sizing (the card sets max-w-none itself). Bind with metricKey and link with goto so hubs stay data-driven and navigable. Do NOT use Chip for the delta (Chip is dismissible input; Badge is the read-only status component).
composes_with: [HubHeroCard, AppLayoutShell, Card, Badge]
---

```jsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
  <HubStatCard icon={Star} title="Reviews" metricKey="reviews" ctaHook="hub-reviews-cta" dataHook="hub-reviews-card" />
  <HubStatCard icon={TrendingUp} title="Rankings" metricKey="rankings" goto="Rankings Table" ctaHook="hub-rankings-cta" dataHook="hub-rankings-card" />
</div>
```

Ships in "@brightlocal/proposal" — never inline a copy.
