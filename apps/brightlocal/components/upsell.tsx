"use client";

/**
 * The house style for gated content (Ali, 9 Sep: "upsell or gated
 * content, we will need a house style for that"). One shape everywhere:
 * a "Part of Pro" pill, a benefit sentence in Bea's voice, and the CTA
 * that fits the account: free credits on a trial, "See Pro" otherwise.
 * Hidden entirely when the upsell setting is off, so a demo can run
 * without it.
 */

import { Lock, Sparkles, ArrowRight } from "@brightlocal/icons";
import { Button } from "@brightlocal/ui-components/button";
import { useDemo } from "@/lib/demo";

export function UpsellStrip({
  feature,
  benefit,
  creditsLabel,
  creditsPlural,
  dataHook = "upsell",
}: {
  feature: string;
  benefit: string;
  /** What one credit buys, e.g. "auto-reply", and its plural. */
  creditsLabel: string;
  creditsPlural?: string;
  dataHook?: string;
}) {
  const { settings, persona } = useDemo();
  if (!settings.upsell) return null;
  const trial = persona.trial;
  return (
    <div
      data-hook={dataHook}
      className="flex flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] px-5 py-4 sm:flex-row sm:items-center sm:gap-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* The upsell's own badge type: outlined like the Beacon badge,
            a lock, foreground text. The solid black read far too strong. */}
        <span className="text-label-sm inline-flex w-fit items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-2 py-0.5 text-foreground">
          <Lock className="size-3 text-muted-foreground" />
          {feature} is part of Pro
        </span>
        <p className="text-body-sm text-foreground">
          {benefit}
          {trial ? ` Your trial includes ${trial.credits} free ${trial.credits === 1 ? creditsLabel : (creditsPlural ?? `${creditsLabel}s`)}, so try one now.` : ""}
        </p>
      </div>
      <Button variant={trial ? "primary" : "outline"} size="sm" dataHook={`${dataHook}-cta`} className="shrink-0">
        {trial ? (
          <>
            <Sparkles className="size-4" />
            Use a free {creditsLabel}
          </>
        ) : (
          <>
            See Pro
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  );
}
