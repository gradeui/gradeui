---
name: StatusBanner
import: "@brightlocal/proposal"
props:
  - score: number — 0–100; drives the band via scoreBand (thresholds mirror scoreColor — <40 low/red, <70 fair/amber, else good/green).
  - headline?: string — Override the band's default status line ("This location's overall score is low. We'll help you fix it." etc.).
  - illustration? — Override the default <RobotAiA size={88} /> with any node (an @brightlocal/illustrations component, usually).
  - dataHook?: string — Instance name. (default "status-banner")
  - className?: string — Merged onto the tinted panel.
when_to_use: The illustrated status strip — tinted panel (red-50/amber-50/green-50), robot illustration, ScoreStatusPill, and a big Poppins status line. Tops the AI Insights v2 At-a-Glance card; the Location Hub gets "something similar" (Ali, 22 Jul). Also exported — scoreBand(score) (the shared band vocabulary: label/Icon/pill/surface/headline/arc/track) and ScoreStatusPill (the band as a DS Badge with the soft tint override).
composes_with: [ScoreDonut, ScoreStatusPill, Card, Illustration]
aliases: [status banner, warning banner, alert strip, score banner]
---

```jsx
import { StatusBanner, ScoreStatusPill, scoreBand } from "@brightlocal/proposal";

<StatusBanner score={19} dataHook="glance-status-banner" />
<ScoreStatusPill score={59} />
```

Band labels: "Needs attention" / "Average" are VERIFIED from the live
product; "Good" (green) and the fair/good headline copy are ASSUMPTIONS
(flagged in source) until Ali verifies them on live. Pair a status-
tinted ScoreDonut with the same band: `const band = scoreBand(score)`
then `<ScoreDonut value={score} color={band.arc} trackColor={band.track} />`.
