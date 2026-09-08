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
import { nuggetFor, type NuggetPage } from "@/lib/beacon-pages";

export function BeaconNugget({ page = "hub" }: { page?: NuggetPage }) {
  const persona = usePersona();
  const location = useLocationKey();
  const nugget = nuggetFor(page, statsFor(location, persona), persona);
  if (!nugget) return null;
  return (
    // A banner, not a card: three-quarters width, centred, close to the
    // table above it, one sentence and one button (Ali, 9 Sep).
    // Muted, like the roadmap's tinted bands: neutral surface, muted text,
    // a ghost button. Knocked back on purpose (Ali, 9 Sep).
    <div
      data-hook={`beacon-nugget-${page}`}
      className="mx-auto flex w-full flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-neutral-100)] px-6 py-4 lg:w-3/4 lg:flex-row lg:items-center lg:gap-6"
    >
      <Lightbulb className="hidden size-5 shrink-0 text-[var(--ds-tailwind-colors-neutral-500)] lg:block" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body font-medium text-[var(--ds-tailwind-colors-neutral-800)] text-balance">{nugget.fact}</p>
        <p className="text-body-sm text-muted-foreground text-pretty">{nugget.action}</p>
      </div>
      <span className="inline-flex shrink-0" data-grade-goto={nugget.cta.goto}>
        <Button variant="outline" size="sm" dataHook="beacon-nugget-cta">
          {nugget.cta.label}
          <ArrowRight className="size-4" />
        </Button>
      </span>
    </div>
  );
}
