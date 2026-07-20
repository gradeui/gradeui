---
name: ModuleScoreCard
import: "@brightlocal/proposal"
props:
  - moduleKey — DATA BINDING: which foundation module to render ("websiteContent" | "gbp" | "reviews" | "citations"). Reads label, summary, score, subMetrics and the derived weight note from the proposal data context at render position, so dataset switches re-skin it live. This is the ONLY required prop.
  - variant? (bars | donuts) — Sub-score data viz. "bars" (default) = thin labelled bars, two-column. "donuts" = a row of mini score rings (Google Lighthouse-style), spread evenly across the width whatever the count.
  - donutSize?: number — Ring diameter in px for the "donuts" viz (default 72). Keep >= 60 so the score value stays visible.
  - title?: string — CardTitle text. Set it PER SUBPAGE; falls back to the module's data label.
  - description?: string — CardDescription text. Set per subpage; falls back to the module's data summary. Runs through GlossaryText either way.
  - icon? — Icon component (from @brightlocal/icons) for the header. Defaults per module (Globe / Store / Star / Link).
  - dataHook?: string — Instance name. (default "module-score-card")
when_to_use: The compact score strip at the TOP of an AI Insights sub-page (Website and Content / GBP / Reviews / Citations). Identity (icon + title) + one-line summary + a colour-coded /100 score (+ derived "N% of your Foundation score" note), then the sub-metric bars in a two-column grid. It is DELIBERATELY compact and diagnostic-only — the score is demoted so the actions lead the page; pair it with AreaInsights below (same module's `area`). The five sub-scores carry NO actions of their own — fixes live in AreaInsights, keyed to the whole area. Author the per-location `summary` in the dataset (score-aware); the lib defaults are generic per-category fallbacks.
composes_with: [AreaInsights, PageHeader, AppLayoutShell, ScoreDonut]
---

```jsx
<GlobalLayoutContentBody className="space-y-6">
  {/* section overview on top — bars (default) or donuts (Lighthouse) … */}
  <ModuleScoreCard moduleKey="websiteContent" variant="donuts" dataHook="module-score-card" />
  {/* … actions lead the body */}
  <AreaInsights areaId="website-seo" />
</GlobalLayoutContentBody>
```

Ships in "@brightlocal/proposal" — never inline a copy. The score is
colour-banded (red <40 / amber <70 / green) via the shared `scoreColor`.
