"use client";

/**
 * "What to do next", in BrightLocal's voice, at the top of the Reviews
 * hub. The anatomy follows their roadmap material: a goal pill, an
 * outcome-led headline with the key phrase highlighted, "Key tactics"
 * with a target icon, then the tactics themselves (the same InsightCard
 * the Insights and Actions pages use), and a tinted "Did you know" band.
 * Starter accounts get the set-up guide instead (components/starter-guide).
 */

import { Card, CardContent, CardHeader } from "@brightlocal/ui-components/card";
import { Flag, Target } from "@brightlocal/icons";
import { InsightCard } from "@brightlocal/proposal-insights";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { reviewPlanFor } from "@/lib/review-insights";
import { UpsellStrip } from "@/components/upsell";
import { BeaconBadge } from "@/components/review-summary";
import { useBeaconModal } from "@/lib/beacon-modal";
import { Button } from "@brightlocal/ui-components/button";
import { ArrowRight } from "@brightlocal/icons";
import { FixItForMe } from "@/components/fix-it-for-me";
import { FirstRunBand } from "@/components/first-run";

/** The green highlighter mark from the brand material, on a phrase. */
function Mark({ text, mark }: { text: string; mark: string }) {
  const i = text.indexOf(mark);
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-[var(--ds-tailwind-colors-neutral-200)] px-1 text-inherit">{mark}</mark>
      {text.slice(i + mark.length)}
    </>
  );
}

export function ReviewInsights({ bare = false }: { bare?: boolean } = {}) {
  const persona = usePersona();
  const location = useLocationKey();
  const stats = statsFor(location, persona);
  const plan = reviewPlanFor(stats, persona);
  const hasUpsell = plan.items.some((i) => i.id === "reply-backlog");
  return (
    <Card className={bare ? "w-full max-w-none rounded-none border-0 bg-transparent shadow-none" : "w-full max-w-none"} density="default" dataHook="review-insights">
      {/* In the dialog the upsell is a column up the right (Ali, 10 Sep:
          "upsell on right, content on left"); on the hub it leads the card. */}
      <div className={bare && hasUpsell ? "grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start" : undefined}>{/* upsell column sits at the top of the right track */}
      <div className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col gap-4">
          {hasUpsell && !bare ? (
            <UpsellStrip
              feature="Auto-reply"
              benefit="Beacon can answer your five-star Google reviews for you, in your tone, an hour after they land."
              creditsLabel="auto-reply"
              creditsPlural="auto-replies"
              dataHook="upsell-auto-reply"
            />
          ) : null}
          {/* The goal pill, the roadmap's "Stage 1 Goal" flag, with the
              Beacon Beta badge beside it so the beta is called out here too. */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-hook="review-insights-pill"
              className="inline-flex w-fit items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-1.5 py-0.5 text-label-sm text-foreground"
            >
              <Flag className="size-3.5 text-muted-foreground" />
              This week's goal
            </span>
            <BeaconBadge beta dataHook="review-insights-badge" />
          </div>
          <h2 className="text-metric font-display text-foreground max-w-prose text-pretty" data-hook="review-insights-goal">
            <Mark text={plan.goal.text} mark={plan.goal.mark} />
          </h2>
          <p className="text-foreground text-body max-w-prose text-pretty">{plan.lede}</p>
          <div className="flex flex-wrap items-center gap-2">
            <FixItForMe count={stats.needReply} goto="screen:dmsxf5zjggd0n" />
          </div>
        </div>
      </CardHeader>
      {plan.items.length > 0 ? (
        <CardContent className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-heading-subsection" data-hook="review-insights-tactics">
            <Target className="size-4" />
            Key tactics
          </p>
          <div className="flex flex-col divide-y divide-[var(--ds-tailwind-colors-neutral-100)]">
            {plan.items.map((item, i) => (
              <div key={item.id} className={i === 0 ? "pb-6" : "py-6 last:pb-0"}>
                <InsightCard item={item} />
              </div>
            ))}
          </div>


        </CardContent>
      ) : null}
      </div>
      {bare && hasUpsell ? (
        <UpsellStrip
          layout="column"
          feature="Auto-reply"
          benefit="Beacon can answer your five-star Google reviews for you, in your tone, an hour after they land."
          creditsLabel="auto-reply"
          creditsPlural="auto-replies"
          dataHook="upsell-auto-reply"
        />
      ) : null}
      </div>
    </Card>
  );
}

/**
 * The compact goal strip for a working page (Review Manager): the goal
 * pill and sentence, the first tactic, and a button into the modal's plan.
 */
export function ReviewPlanStrip() {
  const persona = usePersona();
  const location = useLocationKey();
  const { show } = useBeaconModal();
  const stats = statsFor(location, persona);
  const plan = reviewPlanFor(stats, persona);
  const lead = plan.items[0];
  if (persona.engagement === "empty") return <FirstRunBand page="manager" />;
  return (
    <div
      data-hook="review-plan-strip"
      className="flex flex-col gap-6 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] p-8 shadow-sm lg:flex-row lg:items-stretch lg:gap-10"
    >
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span data-hook="review-plan-strip-pill" className="inline-flex w-fit items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-1.5 py-0.5 text-label-sm text-foreground">
          <Flag className="size-3 text-muted-foreground" />
          This week's goal
        </span>
        <BeaconBadge beta dataHook="review-plan-strip-badge" />
      </div>
      <p className="text-metric font-display text-balance max-w-[40ch]" data-hook="review-plan-strip-goal">
        <Mark text={plan.goal.text} mark={plan.goal.mark} />
      </p>
      {lead ? <p className="text-body text-foreground max-w-[60ch] text-pretty">{lead.strip}</p> : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
        <Button variant="outline" size="sm" dataHook="review-plan-strip-open" onClick={() => show("plan")}>
          Tell me more
        </Button>
        <FixItForMe count={stats.needReply} goto="screen:dmsxf5zjggd0n" />
      </div>
    </div>
      {/* The inbox's own numbers, in the same grey panel the other strips use. */}
      <dl className="grid shrink-0 grid-cols-3 gap-6 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] p-6 lg:w-72 lg:grid-cols-1 lg:gap-5" data-hook="review-plan-strip-tiles">
        {[
          { value: String(stats.needReply), label: "need a reply" },
          { value: String(stats.replied), label: "replied" },
          { value: stats.oldestWaitingDays === null ? "0" : `${stats.oldestWaitingDays}d`, label: "oldest still waiting" },
        ].map((tile) => (
          <div key={tile.label} className="flex flex-col">
            <dd className="text-metric text-foreground">{tile.value}</dd>
            <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
