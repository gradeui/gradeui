---
name: HubHeroCard
import: "@brightlocal/proposal"
props:
  - title — Hero heading (TypographyH3).
  - description — Supporting copy (muted, max-w-prose).
  - primaryCta?: string — Primary Button label. (default "Get started")
  - primaryHook?: string — dataHook for the primary Button.
  - secondaryCta?: string — Optional ghost Button label; omitted = no secondary.
  - secondaryHook?: string — dataHook for the secondary Button.
  - media? — Right media slot (hidden below md). Default: a placeholder tile with a Sparkles mark.
  - mediaAspect? (4/3 | square | video) — Media proportion preset. (default "4/3")
  - goto?: string — Screen link (STUDIO-FLOWS); stamps data-grade-goto.
  - transition? (fade | slide-left | slide-right | none) — Swap treatment for the goto.
  - dataHook?: string — Instance name.
when_to_use: The single feature/announcement banner at the top of a hub page — copy + CTAs left, media right. One per page, above the HubStatCard grid. Use for the headline featureset (AI Insights) or onboarding pushes.
composes_with: [HubStatCard, AppLayoutShell, Card, Button]
---

```jsx
<HubHeroCard
  title="Get more from your local presence"
  description="AI Insights reviews your listings, rankings and reviews together and tells you the three things to fix first."
  primaryCta="Run AI Insights"
  primaryHook="hub-hero-primary"
  secondaryCta="See how it works"
  secondaryHook="hub-hero-secondary"
  dataHook="hub-hero-card"
/>
```

Ships in "@brightlocal/proposal" — never inline a copy.
