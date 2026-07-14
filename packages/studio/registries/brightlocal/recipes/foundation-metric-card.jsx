// FoundationMetricCard — Category score card: title + big score, per-metric progress rows.
// keywords: foundation card, metric card, score breakdown, progress rows, category score, metric list, score card
// components: card, progress, typography
// Hand-authored from the live "Build your foundation" cards (Website
// and content 68/100, GBP 54/100). One card per category; rows are
// label + Progress + score. Pairs with the welcome-insights-card on
// the location summary.

import { Card, CardContent } from "@brightlocal/ui-components/card";
import { Progress } from "@brightlocal/ui-components/progress";
import { Globe } from "@brightlocal/icons";

const METRICS = [
  { id: "conversion-ux", label: "Conversion UX", score: 15 },
  { id: "keyword-coverage", label: "Keyword coverage", score: 100 },
  { id: "page-optimization", label: "Page optimization", score: 100 },
  { id: "technical-health", label: "Technical health", score: 60 },
  { id: "local-intent", label: "Local intent & linking", score: 14 },
];

<Card variant="filled" dataHook="website-content-card">
  <CardContent>
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Globe className="text-muted-foreground size-5" />
        <span className="text-sm font-medium">Website and content</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold">68</span>
        <span className="text-muted-foreground text-sm">/100</span>
      </div>
      <div className="flex flex-col gap-3">
        {METRICS.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3"
            data-hook={`metric-${m.id}-row`}
          >
            <span className="w-40 shrink-0 text-sm">{m.label}</span>
            <Progress
              value={m.score}
              className="h-2 flex-1"
              dataHook={`metric-${m.id}-progress`}
            />
            <span className="text-muted-foreground w-16 shrink-0 text-right text-sm tabular-nums">
              {m.score}/100
            </span>
          </div>
        ))}
      </div>
    </div>
  </CardContent>
</Card>
