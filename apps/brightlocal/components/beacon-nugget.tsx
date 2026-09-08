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
    // A banner, not a card: three-quarters width, centred, close to the
    // table above it, one sentence and one button (Ali, 9 Sep).
    <div
      data-hook="beacon-nugget"
      className="mx-auto flex w-full flex-col gap-4 rounded-xl border bg-[var(--ds-tailwind-colors-base-white)] px-6 py-5 lg:w-3/4 lg:flex-row lg:items-center lg:gap-6"
    >
      <Lightbulb className="hidden size-6 shrink-0 text-[var(--ds-tailwind-colors-green-500)] lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {plan.fact ? <p className="text-heading-subsection text-balance">{plan.fact}</p> : null}
        {first ? <p className="text-body-sm text-muted-foreground text-pretty">One easy thing to do now: {first.label}</p> : null}
      </div>
      {link ? (
        <span className="inline-flex shrink-0" data-grade-goto={link.goto}>
          <Button variant="primary" size="sm" dataHook="beacon-nugget-cta">
            {link.label}
            <ArrowRight className="size-4" />
          </Button>
        </span>
      ) : null}
    </div>
  );
}
