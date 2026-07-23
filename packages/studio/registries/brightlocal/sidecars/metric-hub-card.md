---
name: MetricHubCard
import: "@brightlocal/proposal"
subcomponents: [TrendPill]
props:
  - title — Card title (CardTitleLink treatment — text-xl semibold, hover link colour; the whole card is the link).
  - trend?: string — Soft-green TrendPill copy next to the title ("0.4 in last 7 days"). Omit to hide. TrendPill is also exported standalone.
  - goto?: string — Screen link ("screen:<id>") stamped as data-grade-goto on the card; the circular arrow top-right is its visual handle.
  - label?: string — Muted stat label above the value ("Average rating" / "Average position").
  - value — The BIG display-type stat (Poppins semibold, text-4xl, tabular). DERIVE it from the viz data where possible — never author it twice.
  - context?: string — Muted text beside the value ("12 total reviews" / "5 keywords tracked").
  - delta?: string — Green delta beside the context ("+1.2").
  - children? — The data viz below the stat block (bar rows, sparkline, …).
  - dataHook?: string — Instance name. (default "metric-hub-card")
when_to_use: The STANDARD hub metric-card anatomy (Ali's mock, 23 Jul) - title + trend pill, circular drill arrow, big derived stat, viz below. Reviews + Rankings wear it on the Location Hub; Citations and GBP Manager are next. Use it for any hub card whose story is "one headline number with a small chart under it". Ships in "@brightlocal/proposal" — never inline a copy.
composes_with: [AppLayoutShell, CardTitleLink, ScoreDonut]
---

```jsx
<MetricHubCard
  title="Reviews"
  trend="0.4 in last 7 days"
  goto="screen:dmrotrhbcxk66"
  dataHook="hub-reviews"
  label="Average rating"
  value={4.9}
  context="12 total reviews"
>
  {/* bar rows… */}
</MetricHubCard>
```
