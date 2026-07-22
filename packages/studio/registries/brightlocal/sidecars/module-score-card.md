---
name: ModuleScoreCard
import: "@brightlocal/proposal"
props:
  - moduleKey — DATA BINDING: which foundation module to render ("websiteContent" | "gbp" | "reviews" | "citations"). Reads score + summary AND the module's aiInsights items (insight/recommendation counts) from the proposal data context at render position, so dataset switches re-skin it live. This is the ONLY required prop.
  - variant? (bars | donuts) — PARKED. The sub-metric viz (bars / row of mini donuts) is temporarily UNRENDERED — Ali is designing its replacement (bar chart or per-metric badges). The prop is still accepted so existing screens don't break; it currently does nothing.
  - donutSize?: number — PARKED with `variant` (accepted, unrendered).
  - title?: string — Heading text. Defaults to "At a Glance" (Title Case) — the page H1 already names the module.
  - description?: string — Summary text. Set per subpage; falls back to the module's data summary. Runs through GlossaryText either way.
  - dataHook?: string — Instance name. (default "module-score-card")
when_to_use: The At-a-Glance card at the TOP of an AI Insights sub-page (Website / GBP / Reviews / Citations) — matched to the LANDING page's glance card (Ali, 23 Jul) - large ScoreDonut (168) left; "At a Glance" + outline count Badges (Lightbulb "N insights", Check "N recommendations", scoped to THIS module's area) + glossaried text-sm summary right. NO icon (the Sparkles came off these cards) and NO weight note. Diagnostic-only — the actions lead the page; pair with AreaInsights below (same module's `area`). Author the per-location `summary` in the dataset (score-aware); the lib defaults are generic per-category fallbacks.
composes_with: [AreaInsights, PageHeader, AppLayoutShell, ScoreDonut]
---

```jsx
<GlobalLayoutContentBody className="gap-4">
  {/* glance card on top … */}
  <ModuleScoreCard moduleKey="websiteContent" dataHook="module-score-card" />
  {/* … actions lead the body */}
  <AreaInsights areaId="website-seo" />
</GlobalLayoutContentBody>
```

Ships in "@brightlocal/proposal" — never inline a copy. The score is
never authored here — it binds foundation[moduleKey].score, colour-
banded (red <40 / amber <70 / green) via the shared `scoreColor`.
