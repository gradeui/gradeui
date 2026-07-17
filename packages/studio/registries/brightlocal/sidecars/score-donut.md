---
name: ScoreDonut
import: "@brightlocal/proposal"
props:
  - value — Score 0–100 (drives arc + centred number). ALWAYS from computeLocationScore(data) or a module score — never author it.
  - size?: number — Outer px (default 110). Number auto-hides under 60 so the same component serves mini (22) and hero (168) sizes.
  - stroke?: number — Ring thickness; defaults to ~15% of size (the Figma ring weight). Don't thin it back to 10.
  - label? — Muted caption above the donut. Omit when a CardHeader already names it (Ali, 17 Jul).
  - className?: string
  - dataHook?: string — Instance name (default "score-donut").
when_to_use: THE Location Score ring — any screen showing a /100 score as a donut (hero, module drill-downs, hub). Colour bands are shared convention (red <40 / amber <70 / green). Pure SVG, no chart library. Never hand-roll the circle; import from "@brightlocal/proposal".
composes_with: [Card, MiniStat, HubHeroCard]
---

```jsx
const score = computeLocationScore(useProposalData());
<ScoreDonut value={score.overall} size={168} />
```

Ships in "@brightlocal/proposal" — never inline a copy.
