// WelcomeInsightsCard — The live summary page's full-width hero: welcome copy + insights counts + CTA, Location Score donut on the right.
// keywords: welcome card, welcome back, insights card, summary hero, overview card, hero card, insights summary
// components: card, button, typography
// Hand-authored from the live "Welcome back" card (14 Jul screenshot).
// FULL WIDTH — spans the content column; the score donut sits right on
// lg+ (see the location-score-donut recipe for the ring on its own).
// The CTA carries a Sparkles icon like live.

import { Card, CardContent } from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { TypographyH2 } from "@brightlocal/ui-components/typography";
import { Sparkles } from "@brightlocal/icons";

<Card variant="filled" className="w-full max-w-none" dataHook="welcome-card">
  <CardContent>
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-3">
        <TypographyH2 dataHook="welcome-title">
          Welcome back, Andy Smith
        </TypographyH2>
        <p className="text-muted-foreground max-w-prose text-sm">
          Brighton Bierhaus has a strong Google presence with an excellent
          rating and plenty of photos. The fastest gains now are to fix
          website blockers, strengthen local signals on your site, expand
          your GBP to capture takeaway searches, and close citation gaps to
          lift visibility across Brighton.
        </p>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span>5 insights</span>
          <span>28 recommendations</span>
        </div>
        <div>
          <Button dataHook="see-all-insights-button">
            See all insights
            <Sparkles />
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2" data-hook="location-score">
        <span className="text-muted-foreground text-sm">Location Score</span>
        <div className="relative size-36">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="326.7"
              strokeDashoffset={326.7 * (1 - 32 / 100)}
              className="stroke-orange-400"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-semibold">32</span>
            <span className="text-muted-foreground text-xs">/100</span>
          </div>
        </div>
        <div className="text-muted-foreground flex gap-4 text-xs">
          <span>Foundation 64/100</span>
          <span>Visibility 0/100</span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
