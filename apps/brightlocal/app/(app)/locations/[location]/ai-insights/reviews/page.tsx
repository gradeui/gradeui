"use client";

/**
 * Insights & Actions: Reviews. The location's review roadmap in the
 * anatomy of BrightLocal's own 12-month roadmap (Ali, 10 Sep: "a page of
 * insights, help, other things"): a stage goal pill, an outcome-led
 * headline with the key phrase marked, a month rail down the left of
 * each card, and "Key tactics" with a target icon. Content comes from
 * lib/review-roadmap, so it is true of the same rows as every other page.
 */

import { SidebarProvider, SidebarTrigger, GlobalLayoutContentBody, Logo } from "@brightlocal/ui-components";
import { Button } from "@brightlocal/ui-components/button";
import { Card, CardContent } from "@brightlocal/ui-components/card";
import { Menu, Flag, Target, ArrowRight, LifeBuoy } from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader } from "@brightlocal/proposal";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { reviewRoadmapFor, type RoadmapStage } from "@/lib/review-roadmap";
import { BeaconBadge } from "@/components/review-summary";
import { BeaconNugget } from "@/components/beacon-nugget";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewQuoteBand } from "@/components/review-quote";
import { InsightsPdfButton } from "@/components/insights-pdf";

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

function Stage({ stage, first }: { stage: RoadmapStage; first: boolean }) {
  return (
    <section className="flex flex-col gap-5" data-hook={`roadmap-stage-${stage.id}`}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span data-hook="roadmap-pill" className="inline-flex w-fit items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-1.5 py-0.5 text-label-sm text-foreground">
            <Flag className="size-3.5 text-muted-foreground" />
            {stage.pill}
          </span>
          {first ? <BeaconBadge beta dataHook="roadmap-badge" /> : null}
        </div>
        <h2 className="text-heading-page font-display max-w-[32ch] text-balance">
          <Mark text={stage.goal.text} mark={stage.goal.mark} />
        </h2>
        <p className="text-body max-w-prose text-pretty">{stage.lede}</p>
      </div>
      <Card className="w-full max-w-none overflow-hidden" density="condensed" dataHook={`roadmap-card-${stage.id}`}>
        <CardContent className="flex p-0">
          {/* The month rail: a vertical label down the left of the card,
              the roadmap's coloured column, here in the brand green. */}
          <div className="flex w-12 shrink-0 items-center justify-center bg-[var(--ds-tailwind-colors-green-500)]">
            <span className="text-heading-subsection font-display -rotate-180 whitespace-nowrap text-[var(--ds-tailwind-colors-green-950)] [writing-mode:vertical-rl]">
              {stage.rail}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-4 px-6 py-6 lg:px-8">
            <p className="flex items-center gap-2 text-heading-subsection">
              <Target className="size-4" />
              Key tactics
            </p>
            <ul className="flex flex-col gap-3">
              {stage.tactics.map((t, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-body">
                  <span className="flex gap-3">
                    <span aria-hidden className="text-muted-foreground">•</span>
                    <span className="text-pretty">{t.text}</span>
                  </span>
                  {t.link ? (
                    <span data-grade-goto={t.link.goto}>
                      <Button variant="ghost" size="sm" dataHook="roadmap-tactic-link" className="h-auto px-1 py-0 underline-offset-4 hover:underline">
                        {t.link.label}
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function ReviewsInsightsPage() {
  const persona = usePersona();
  const location = useLocationKey();
  const stats = statsFor(location, persona);
  const stages = reviewRoadmapFor(stats, persona);
  const modal = useBeaconModal();
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="insights-app-layout"
        sidebar={<ProposalSidebar dataHook="insights-sidebar" activeId="ai-insights" />}
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
            dataHook="insights-page-header"
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
              { label: "Insights & Actions", goto: "screen:dmrotrgwxijez" },
            ]}
            title="Reviews roadmap"
            description="Your next three months, one stage at a time"
          />
        }
      >
        <GlobalLayoutContentBody dataHook="insights-page-body" className="flex flex-col gap-12 pb-10">
          {/* The location's own reviews as quote bands between the stages,
              the site's testimonial anatomy: the one waiting longest after
              this week's plan, the best recent one after this month's. */}
          {stages.map((s, i) => (
            <div key={s.id} className="flex flex-col gap-12">
              <Stage stage={s} first={i === 0} />
              {i === 0 ? <ReviewQuoteBand kind="waiting" goto="screen:dmsxf5zjggd0n" /> : null}
              {i === 1 ? <ReviewQuoteBand kind="best" goto="screen:dmt094lhmpwbs" /> : null}
            </div>
          ))}
          <Card className="w-full max-w-none" density="default" dataHook="roadmap-help">
            <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <LifeBuoy className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col gap-1">
                  <p className="text-heading-subsection">Need a hand with any of this?</p>
                  <p className="text-body text-pretty">Beacon can walk you through the plan, or a person from BrightLocal can. Both are free.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" dataHook="roadmap-ask-beacon" onClick={() => modal.show("plan")}>
                  Ask Beacon
                </Button>
                <InsightsPdfButton />
                <Button variant="outline" size="sm" dataHook="roadmap-help-center" asChild>
                  <a href="https://help.brightlocal.com" target="_blank" rel="noreferrer">Help Center</a>
                </Button>
              </div>
            </CardContent>
          </Card>
          <BeaconNugget page="hub" />
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
