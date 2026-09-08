"use client";

/**
 * "What to do next" on the Reviews hub: the review-derived insights for
 * the location in the URL, rendered with the same InsightCard the
 * Insights and Actions pages use, so the two read as one system.
 */

import { Card, CardContent } from "@brightlocal/ui-components/card";
import { TypographyH3, TypographyMuted } from "@brightlocal/ui-components";
import { InsightCard } from "@brightlocal/proposal-insights";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { profileFor } from "@/lib/location-profiles";
import { reviewInsightsFor } from "@/lib/review-insights";

export function ReviewInsights() {
  const persona = usePersona();
  const location = useLocationKey();
  const items = reviewInsightsFor(profileFor(location, persona), persona);
  if (items.length === 0) return null;
  return (
    <div className="space-y-1" data-hook="review-insights">
      <TypographyH3>What to do next</TypographyH3>
      <TypographyMuted>
        Worked out from your reviews as they stand today. Each step opens the tool that does it.
      </TypographyMuted>
      <Card className="mt-4 w-full max-w-none" density="default" dataHook="review-insights-card">
        <CardContent>
          <div className="flex flex-col divide-y divide-[var(--ds-tailwind-colors-neutral-100)]">
            {items.map((item, i) => (
              <div key={item.id} className={i === 0 ? "pb-6" : "py-6 last:pb-0"}>
                <InsightCard item={item} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
