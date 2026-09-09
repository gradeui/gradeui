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
import { Rating } from "@brightlocal/ui-components/rating";
import { pickIllustration } from "@/lib/illustrations";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PATH } from "@/lib/plans";
import { useBeaconModal } from "@/lib/beacon-modal";
import { useDemo } from "@/lib/demo";

/** Upsells always carry an illustration (Ali, 11 Sep), picked by what the feature does. */
function UpsellArt({ feature }: { feature: string }) {
  const Art = pickIllustration([feature.toLowerCase(), "automate", "save time"]);
  return <Art className="size-16 shrink-0" />;
}

export function UpsellStrip({
  feature,
  benefit,
  creditsLabel,
  creditsPlural,
  dataHook = "upsell",
  layout = "strip",
  example,
}: {
  /** "column": the dialog's right-hand column, yellow, full height, with
   *  an example of the service on the account's own review (Ali, 11 Sep:
   *  "sell the service, provide an example"). */
  layout?: "strip" | "column";
  example?: { name: string; site: string; rating: number; text: string; reply: string; business?: string } | null;
  feature: string;
  benefit: string;
  /** What one credit buys, e.g. "auto-reply", and its plural. */
  creditsLabel: string;
  creditsPlural?: string;
  dataHook?: string;
}) {
  const { settings, persona } = useDemo();
  const router = useRouter();
  const modal = useBeaconModal();
  if (!settings.upsell) return null;
  const trial = persona.trial;
  return (
    <div
      data-hook={dataHook}
      className={
        layout === "column"
          ? "flex flex-col gap-5 rounded-xl bg-[var(--ds-tailwind-colors-yellow-200)] p-6"
          : "flex flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] px-5 py-4 sm:flex-row sm:items-center sm:gap-5"
      }
    >
      <div className={layout === "column" ? "flex min-w-0 flex-col gap-2" : "flex min-w-0 flex-1 flex-col gap-1"}>
        {/* The upsell's own badge type: outlined like the Beacon badge,
            a lock, foreground text. The solid black read far too strong. */}
        <div className={layout === "column" ? "flex items-center gap-4" : "flex items-start justify-between gap-3"}>
          {/* The dialog header's format (Ali, 11 Sep): illustration left, badge and
              headline right, so the column starts tight and does not scroll. */}
          {layout === "column" ? <UpsellArt feature={feature} /> : null}
          <div className={layout === "column" ? "flex flex-col gap-1.5" : "contents"}>
          {/* In the column the Pro badge goes hard: black, white text (Ali, 11 Sep). */}
          <span className={layout === "column"
            ? "text-label-sm inline-flex w-fit items-center gap-1.5 rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-2.5 py-1 font-semibold text-[var(--ds-tailwind-colors-base-white)]"
            : "text-label-sm inline-flex w-fit items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-2 py-0.5 text-foreground"}>
            <Lock className={layout === "column" ? "size-3" : "size-3 text-muted-foreground"} />
            {feature} is part of Pro
          </span>
          {layout === "column" ? <p className="text-metric font-display text-balance">Let the easy ones answer themselves.</p> : null}
          </div>
        </div>
        <p className={layout === "column" ? "text-body text-foreground text-pretty" : "text-body-sm text-foreground"}>
          {benefit}
          {trial ? ` Your trial includes ${trial.credits} free ${trial.credits === 1 ? creditsLabel : (creditsPlural ?? `${creditsLabel}s`)}, so try one now.` : ""}
        </p>
      </div>
      {layout === "column" && example ? (
        <div className="flex flex-col gap-3" data-hook={`${dataHook}-example`}>
          <p className="text-label-sm text-muted-foreground">{example.business ? `On one of ${example.business}'s own reviews` : "On one of your own reviews"}</p>
          <div className="flex flex-col gap-2 rounded-lg bg-[var(--ds-tailwind-colors-base-white)] p-4">
            <div className="flex items-center gap-2 text-label-sm text-muted-foreground">
              <Rating value={example.rating} dataHook={`${dataHook}-example-rating`} />
              <span className="font-medium">{example.name}</span>
              <span className="text-muted-foreground">on {example.site}</span>
            </div>
            <p className="text-body text-pretty">“{example.text}”</p>
          </div>
          {/* The reply is the hero (Ali, 11 Sep: "make more of the reply"). */}
          <div className="flex flex-col gap-3 rounded-lg border-2 border-foreground bg-[var(--ds-tailwind-colors-base-white)] p-5">
            <p className="flex w-fit items-center gap-1.5 rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-2 py-0.5 text-label-sm font-semibold text-[var(--ds-tailwind-colors-base-white)]"><Sparkles className="size-3.5" />Beacon's reply, an hour later</p>
            <p className="text-body font-semibold text-pretty">“{example.reply}”</p>
            <p className="text-label-sm text-muted-foreground">Sent as {example.site === "Google" ? "the owner" : "you"}, in your tone. Edit it once and every reply follows.</p>
          </div>
        </div>
      ) : null}
      <Button variant={trial ? "primary" : "outline"} size={layout === "column" ? "lg" : "sm"} dataHook={`${dataHook}-cta`} className={layout === "column" ? "w-fit" : "shrink-0"} onClick={() => { if (!trial) { modal.close(); router.push(SUBSCRIPTION_PATH); } }}>
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
