"use client";

/**
 * The nugget at the bottom of every Reviews page (Ali, 9 Sep: "scroll
 * for insights, there's always a nugget"). One "Did you know" from the
 * location's own reviews, in Bea's voice, quiet.
 */

import { Lightbulb } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { reviewPlanFor } from "@/lib/review-insights";

export function BeaconNugget() {
  const persona = usePersona();
  const location = useLocationKey();
  const plan = reviewPlanFor(statsFor(location, persona), persona);
  if (!plan.fact) return null;
  return (
    <div
      data-hook="beacon-nugget"
      className="mt-4 flex items-start gap-4 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] px-6 py-5"
    >
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-[var(--ds-tailwind-colors-green-500)]" />
      <div className="flex flex-col gap-1">
        <p className="text-label-sm text-muted-foreground">Beacon nugget</p>
        <p className="text-body text-pretty max-w-[70ch]">{plan.fact}</p>
      </div>
    </div>
  );
}
