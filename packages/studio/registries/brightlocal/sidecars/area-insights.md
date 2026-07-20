---
name: AreaInsights
import: "@brightlocal/proposal"
props:
  - areaId — DATA BINDING: filters aiInsights.items to this area ("website-seo" | "gbp-manager" | "reviews" | "citations"). Match the score strip's module via foundation[moduleKey].area so diagnosis and fixes stay in lockstep.
  - actionStyle? (accordion | list) — How each insight's actions render. "accordion" (default) = one collapsible row per action, progressive-disclosure (Lighthouse-style). "list" = the flat numbered list. Threaded down to every InsightCard.
  - title?: string — Section heading. (default "Actions & Insights")
  - dataHook?: string — Instance name. (default "area-insights")
when_to_use: The PRIMARY, actions-led section of an AI Insights sub-page — it leads the body, below the ModuleScoreCard overview. Renders a header (title + "Last updated") then one InsightCard per matching item. Each InsightCard is LEAN by default: severity + area badges, the title, a plain-language one-line roll-up of the actions (item.actionsSummary — a recommended LLM output field), and the Actions — the diagnostic Insight is dropped and the Recommendation is opt-in behind a "Tell me more" button. All prose runs through GlossaryText so Local-SEO jargon (GBP, NAP, citations…) auto-explains on tap. Each action carries a "where": ON-SITE fixes (a tool deep-link, or explicit `where: "onsite"`) render a Button; OFF-SITE fixes (no link, or `where: "offsite"`) render an instruction ("Make this change on your website") — BrightLocal can't do those for the user. Falls back to an empty-state Card when no items match the area. Actions are keyed to the AREA, not to individual sub-metrics.
composes_with: [ModuleScoreCard, PageHeader, AppLayoutShell, Card, Badge, Button]
---

```jsx
<GlobalLayoutContentBody className="space-y-6">
  <ModuleScoreCard moduleKey="gbp" />
  <AreaInsights areaId="gbp-manager" dataHook="area-insights" />
</GlobalLayoutContentBody>
```

Ships in "@brightlocal/proposal" — never inline a copy. `InsightCard` is
also exported for one-off rendering, but prefer AreaInsights so the
header + empty state come for free.
