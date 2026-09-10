"use client";

/**
 * Account: subscription and pricing. The in-product pricing page every
 * "See Pro", "Keep everything" and "Pick up where you left off" lands on
 * (Ali, 11 Sep). The site's three plans, the account's own state on top
 * (trial countdown, lapsed win-back, or the current plan), the reviews
 * features called out because that is what brought them here.
 */

import { SidebarProvider, SidebarTrigger, GlobalLayoutContentBody, Logo } from "@brightlocal/ui-components";
import { Button } from "@brightlocal/ui-components/button";
import { Card, CardContent } from "@brightlocal/ui-components/card";
import { Menu, Check, ArrowRight, Lock } from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader } from "@brightlocal/proposal";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { PLANS } from "@/lib/plans";
import { useUrlParam } from "@/lib/url-state";
import { TODAY } from "@/lib/reviews-data";
import { pickIllustration } from "@/lib/illustrations";

function Art({ keywords, className }: { keywords: string[]; className?: string }) {
  const A = pickIllustration(keywords);
  return <A className={className} />;
}

export default function SubscriptionPage() {
  const persona = usePersona();
  const location = useLocationKey();
  const stats = statsFor(location, persona);
  // CHOOSING A PLAN (Ali, TODO 4: "decide what Choose Grow does"). It records
  // the choice and says so. Not a fake checkout, because a prototype must
  // never ask for card details, and not a persona switch, because that would
  // claim the product did something it did not. `?chosen=` survives a reload
  // and a share, and Change plan puts it back.
  const [chosen, setChosen] = useUrlParam<"" | "track" | "manage" | "grow">("chosen", "");
  const chosenPlan = PLANS.find((p) => p.id === chosen) ?? null;
  const trial = persona.trial;
  const lapsed = persona.lapsed;
  const paidPlan = trial || lapsed || persona.engagement === "empty" ? null : "grow";
  const currentPlan = chosenPlan?.id ?? paidPlan;
  const trialEnds = trial
    ? new Date(TODAY.getTime() + trial.daysLeft * 86400000).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
    : null;
  const state = trial
    ? { title: `${trial.daysLeft} ${trial.daysLeft === 1 ? "day" : "days"} left on your free trial`, body: `Everything below is on while the trial runs. Pick a plan before it ends and nothing stops: the ${stats.total} reviews already in, the replies, the campaigns.`, cta: "Choose a plan", art: ["trial", "days"] }
    : lapsed
      ? { title: `Your free trial ended ${lapsed.daysAgo} days ago`, body: "Reviews are still arriving and nobody is watching them. Come back this week and your first month is half price.", cta: "Pick up where you left off", art: ["welcome", "back"] }
      : currentPlan
        ? { title: "You are on Grow", body: "Every review site in one inbox, replies, campaigns and the showcase on your website. Billed annually.", cta: "Manage billing", art: ["growth", "grow"] }
        : { title: "Your free trial has started", body: "Fourteen days of everything in Grow. Connect a review site and see what comes in.", cta: "Choose a plan", art: ["trial", "days"] };
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="subscription-app-layout"
        sidebar={<ProposalSidebar dataHook="subscription-sidebar" activeId="all-locations" />}
        mobileBar={
          <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
            <SidebarTrigger dataHook="mobile-trigger">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-5" dataHook="mobile-logo" />
          </div>
        }
        header={
          <PageHeader
            dataHook="subscription-page-header"
            breadcrumbs={[{ label: "All Locations", goto: "screen:dmrotrgstba3l" }, { label: "Account" }]}
            title="Subscription and pricing"
            description="Best value, always transparent"
          />
        }
      >
        <GlobalLayoutContentBody dataHook="subscription-page-body" className="flex flex-col gap-8 pb-10">
          {/* The account's own state, in the dialog header format. Once a plan
              is chosen the same band confirms the choice and offers the way
              back, so the page never has two headlines competing. */}
          {chosenPlan ? (
            <section data-hook="subscription-chosen" className="flex flex-col gap-5 rounded-[20px] bg-[var(--ds-tailwind-colors-green-100)] px-8 py-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <Art keywords={["success", "confirm"]} className="size-16 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-heading-section font-display text-balance">{chosenPlan.name} it is.</p>
                  <p className="text-body max-w-[62ch] text-pretty">
                    {trial
                      ? `You move onto ${chosenPlan.name} on ${trialEnds}, when the trial ends. Nothing stops in between, and the ${stats.total} reviews already in stay exactly where they are.`
                      : lapsed
                        ? `Welcome back. ${chosenPlan.name} switches everything on again at half price for the first month, and the reviews that arrived while you were away are waiting in the inbox.`
                        : `You are moving to ${chosenPlan.name}, at $${chosenPlan.price} USD a month billed annually. ${chosenPlan.strap}.`}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" dataHook="subscription-change-plan" className="w-fit shrink-0" onClick={() => setChosen(null)}>
                Change plan
              </Button>
            </section>
          ) : (
            <section data-hook="subscription-state" className={`flex flex-col gap-5 rounded-[20px] px-8 py-7 lg:flex-row lg:items-center lg:justify-between ${lapsed ? "bg-[var(--ds-tailwind-colors-yellow-100)]" : "bg-[var(--ds-tailwind-colors-neutral-100)]"}`}>
              <div className="flex items-center gap-5">
                <Art keywords={state.art} className="size-16 shrink-0" />
                <div className="flex flex-col gap-1">
                  <p className="text-heading-section font-display text-balance">{state.title}</p>
                  <p className="text-body max-w-[60ch] text-pretty">{state.body}</p>
                </div>
              </div>
              {lapsed ? (
                <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-[var(--ds-tailwind-colors-neutral-950)] px-3 py-1 text-label-sm font-semibold text-[var(--ds-tailwind-colors-base-white)]">First month half price</span>
              ) : null}
            </section>
          )}

          {/* THE UPGRADE PATH (Ali, 11 Sep): the ladder from where this account
              stands, each step saying what it adds and what that means for
              this account's own numbers. On a trial everything is on, so the
              path reads as where you land when it ends. */}
          <section className="flex flex-col gap-4" data-hook="upgrade-path">
            <div className="flex flex-col gap-1">
              <p className="text-heading-section font-display">{chosenPlan ? `${chosenPlan.name}, and what the others add` : trial ? "Where you land when the trial ends" : lapsed ? "Pick up where you left off" : currentPlan ? "Your plan, and what the others add" : "The upgrade path"}</p>
              <p className="text-body-sm text-muted-foreground max-w-[64ch] text-pretty">{trial ? "The trial runs on Grow. Choose the step that fits, and everything below that step stays." : "Each step keeps everything from the one before it."}</p>
            </div>
            <ol className="grid gap-3 lg:grid-cols-3">
              {PLANS.map((plan, i) => {
                const isCurrent = currentPlan === plan.id;
                const unlocks =
                  plan.id === "track"
                    ? "See where you rank and where your listings are wrong."
                    : plan.id === "manage"
                      ? "AI insights on top of that, and your business details kept right everywhere."
                      : stats.needReply > 0
                        ? `Your ${stats.needReply} waiting reviews answered, campaigns to ask for more, and ${stats.fiveStar} five-star reviews ready for your website.`
                        : "Every review in one inbox, campaigns to ask for more, and your best reviews on your website.";
                return (
                  <li key={plan.id} className={`relative flex flex-col gap-3 rounded-[20px] p-5 ${isCurrent ? "bg-[var(--ds-tailwind-colors-neutral-950)] text-[var(--ds-tailwind-colors-base-white)]" : "bg-[var(--ds-tailwind-colors-neutral-100)]"}`} data-hook={`upgrade-step-${plan.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex size-7 items-center justify-center rounded-full text-label-sm font-semibold ${isCurrent ? "bg-[var(--ds-tailwind-colors-base-white)] text-[var(--ds-tailwind-colors-neutral-950)]" : "border"}`}>{i + 1}</span>
                      <span className="text-label-sm font-semibold uppercase tracking-wide">{plan.name}</span>
                      <span className={`ml-auto text-label-sm ${isCurrent ? "opacity-70" : "text-muted-foreground"}`}>{isCurrent ? "You are here" : `$${plan.price}/mo`}</span>
                    </div>
                    <p className={`text-body ${isCurrent ? "" : ""}`}>{plan.strap}</p>
                    <p className={`text-body-sm text-pretty ${isCurrent ? "opacity-80" : "text-muted-foreground"}`}>{unlocks}</p>
                    {!isCurrent && (currentPlan === null || PLANS.findIndex((p) => p.id === currentPlan) < i) ? (
                      <Button variant={plan.id === "grow" ? "primary" : "outline"} size="sm" dataHook={`upgrade-step-${plan.id}-cta`} className="mt-auto w-fit" onClick={() => setChosen(plan.id)}>
                        {trial ? `Land on ${plan.name}` : lapsed ? `Come back on ${plan.name}` : `Upgrade to ${plan.name}`}
                        <ArrowRight className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isReviews = plan.id === "grow";
              return (
                <Card key={plan.id} className={`max-w-none ${isReviews ? "border-2 border-foreground" : ""}`} density="default" dataHook={`plan-${plan.id}`}>
                  <CardContent className="flex h-full flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-label-sm font-semibold uppercase tracking-wide">{plan.name}</p>
                        <p className="text-body-sm text-muted-foreground">{plan.strap}</p>
                      </div>
                      {isCurrent ? <span className="rounded-sm border px-2 py-0.5 text-label-sm">{chosenPlan ? "Your choice" : "Your plan"}</span> : isReviews ? <span className="rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-2 py-0.5 text-label-sm font-semibold text-[var(--ds-tailwind-colors-base-white)]">Reviews live here</span> : null}
                    </div>
                    <p className="flex items-baseline gap-2">
                      <span className="text-display font-display leading-none">${plan.price}</span>
                      <span className="text-body-sm text-muted-foreground">USD / mo, billed annually</span>
                    </p>
                    <span className="inline-flex w-fit items-center rounded-full bg-[var(--ds-tailwind-colors-green-500)] px-2.5 py-0.5 text-label-sm font-semibold text-[var(--ds-tailwind-colors-neutral-950)]">{plan.saving}</span>
                    <ul className="flex flex-col gap-2">
                      {plan.plus ? <li className="text-body-sm font-semibold">{plan.plus}</li> : null}
                      {plan.includes.map((line) => (
                        <li key={line} className="flex gap-2 text-body-sm"><Check className="mt-0.5 size-4 shrink-0 text-[var(--ds-tailwind-colors-green-600)]" />{line}</li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-2">
                      <Button
                        variant={isReviews ? "primary" : "outline"}
                        dataHook={`plan-${plan.id}-cta`}
                        // Manage billing is not a plan choice, so it must not set
                        // `chosen` and claim you are "moving to Grow" when you are
                        // already on it. Deliberately inert, like the other
                        // account-admin buttons in the prototype.
                        onClick={isCurrent && !chosenPlan ? undefined : () => setChosen(plan.id)}
                        className="w-full"
                      >
                        {isCurrent ? (chosenPlan ? "Chosen" : "Manage billing") : trial ? `Try ${plan.name} free` : lapsed ? `Come back on ${plan.name}` : `Choose ${plan.name}`}
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* What the reviews features do for this account, from the rows. */}
          <section className="grid gap-4 rounded-[20px] bg-[var(--ds-tailwind-colors-yellow-100)] px-8 py-7 lg:grid-cols-[1fr_auto] lg:items-center" data-hook="subscription-reviews">
            <div className="flex flex-col gap-2">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-2 py-0.5 text-label-sm font-semibold text-[var(--ds-tailwind-colors-base-white)]"><Lock className="size-3" />Part of Grow</span>
              <p className="text-heading-section font-display text-balance">What Grow does with the reviews you already have</p>
              <ul className="flex flex-col gap-1.5 text-body">
                <li>{stats.needReply > 0 ? `Answers your ${stats.needReply} waiting five-star Google reviews automatically, in your tone.` : "Answers five-star Google reviews for you, in your tone, an hour after they land."}</li>
                <li>Asks customers for reviews by email, SMS and a QR code at the till.</li>
                <li>{stats.fiveStar > 0 ? `Puts the best of your ${stats.fiveStar} five-star reviews on your website.` : "Puts your best reviews on your website."}</li>
              </ul>
            </div>
            <Art keywords={["review", "stars"]} className="hidden size-28 lg:block" />
          </section>

          <section className="flex flex-col gap-3" data-hook="subscription-faq">
            <p className="text-heading-subsection">Frequently asked questions</p>
            <ul className="grid gap-2 text-body-sm sm:grid-cols-2">
              {["What happens after my free trial ends?", "How and when do I pay?", "Can I change my plan?", "Can I cancel at any time?"].map((q) => (
                <li key={q} className="rounded-lg border px-4 py-3">{q}</li>
              ))}
            </ul>
          </section>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
