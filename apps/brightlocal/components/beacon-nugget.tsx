"use client";

/**
 * The footer CTA on every Reviews page (Ali, 9 Sep: "top and tail the
 * data, like a traditional website"). One fact from the location's own
 * reviews, then the single easiest thing to do next, with the button
 * that does it. Quiet, in Bea's voice.
 */

import { Lightbulb, ArrowRight } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { reviewPlanFor } from "@/lib/review-insights";

export function BeaconNugget() {
  const persona = usePersona();
  const location = useLocationKey();
  const plan = reviewPlanFor(statsFor(location, persona), persona);
  const first = plan.items[0]?.actions[0];
  const link = first?.links[0];
  if (!plan.fact && !first) return null;
  return (
    <div
      data-hook="beacon-nugget"
      className="mt-6 flex flex-col gap-5 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] p-8 lg:flex-row lg:items-center lg:gap-10"
    >
      <Lightbulb className="hidden size-8 shrink-0 text-[var(--ds-tailwind-colors-green-500)] lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-label-sm text-muted-foreground">Before you go</p>
        {plan.fact ? <p className="text-metric font-display text-balance max-w-[40ch]">{plan.fact}</p> : null}
        {first ? (
          <p className="text-body text-muted-foreground max-w-[60ch] text-pretty">
            One easy thing to do now: {first.label}
          </p>
        ) : null}
      </div>
      {link ? (
        <span className="inline-flex shrink-0" data-grade-goto={link.goto}>
          <Button variant="primary" dataHook="beacon-nugget-cta">
            {link.label}
            <ArrowRight className="size-4" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}
