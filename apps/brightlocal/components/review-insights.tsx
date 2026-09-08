"use client";

/**
 * "What to do next" on the Reviews hub: the review-derived insights for
 * the location in the URL, rendered with the same InsightCard the
 * Insights and Actions pages use, so the two read as one system.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@brightlocal/ui-components/card";
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
    <Card className="w-full max-w-none" density="default" dataHook="review-insights">
      {/* Title INSIDE the card, like the hub cards beside it (Ali, 9 Sep:
          "the title would be inside the card"). */}
      <CardHeader>
        <div className="flex flex-col gap-1.5">
          <CardTitle>What to do next</CardTitle>
          <CardDescription>
            Worked out from your reviews as they stand today. Each step opens the tool that does it.
          </CardDescription>
        </div>
      </CardHeader>
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
  );
}
