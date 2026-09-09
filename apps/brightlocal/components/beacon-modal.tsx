"use client";

/**
 * The large Beacon dialog. Two sections: the summary (every line, the
 * six-month charts, led by the page's own block when opened from a
 * page) and the plan (opened from the Manager's goal strip). Never
 * both at once. Mounted once in the product layout.
 */

import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@brightlocal/ui-components/dialog";
import { Button } from "@brightlocal/ui-components/button";
import { X } from "@brightlocal/icons";
import { useLocationKey } from "@/lib/location";
import { DATASETS } from "@brightlocal/data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { ReviewSummary, BeaconBadge, BeaconPageBlock, SummaryCharts, DidYouKnowPanel, isEarlyDays } from "@/components/review-summary";
import { ArrowRight } from "@brightlocal/icons";
import { statsFor } from "@/lib/reviews-data";
import { usePersona } from "@/lib/demo";
import { ReviewInsights } from "@/components/review-insights";
import { pickIllustration } from "@/lib/illustrations";
import { pageBeaconFor, type BeaconPage } from "@/lib/beacon-pages";
import { hrefFor } from "@/lib/screens";
import { useRouter } from "next/navigation";

const PAGE_NAME: Record<string, string> = { tracker: "Review Tracker", builder: "Review Builder", showcase: "Review Showcase" };
const ART_KEYS: Record<string, string[]> = { plan: ["fix", "win", "habit"], summary: ["reviews", "stars"], tracker: ["velocity", "spike"], builder: ["campaign", "email", "ask"], showcase: ["website", "widget"] };

function HeaderArt({ section, page }: { section: string; page?: string | null }) {
  const Art = pickIllustration(ART_KEYS[section === "plan" ? "plan" : page ?? "summary"]);
  return <Art className="size-16 shrink-0" />;
}

/** The dialog's CTA, bottom-left (Ali, 10 Sep: "where is the CTA?"): the
 *  one thing to do next, from the rows. */
function ModalCta({ stats, page }: { stats: ReturnType<typeof statsFor>; page?: BeaconPage | null }) {
  const { close } = useBeaconModal();
  const persona = usePersona();
  const location = useLocationKey();
  const router = useRouter();
  const pageCta = page ? pageBeaconFor(page, stats, persona).cta : undefined;
  const goto = stats.needReply > 0 ? "screen:dmsxf5zjggd0n" : "screen:dmt094j963aye";
  const label = stats.needReply > 0 ? `Reply to your ${stats.needReply} waiting ${stats.needReply === 1 ? "review" : "reviews"}` : "Create a campaign";
  return (
    <div className="mt-6 border-t pt-6">
      {pageCta ? (
        <Button variant="primary" size="lg" dataHook="beacon-modal-cta" onClick={() => { close(); router.push(hrefFor({ path: pageCta.path, scope: "location" }, location)); }}>
          {pageCta.label}
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <span data-grade-goto={goto} onClick={() => close()}>
          <Button variant="primary" size="lg" dataHook="beacon-modal-cta">
            {label}
            <ArrowRight className="size-4" />
          </Button>
        </span>
      )}
    </div>
  );
}

export function BeaconModal() {
  const { open, close, page, section } = useBeaconModal();
  const location = useLocationKey();
  const persona = usePersona();
  const locationName = (DATASETS as Record<string, { location?: { name?: string } }>)[location]?.location?.name ?? location;
  const stats = statsFor(location, persona);
  const early = isEarlyDays(stats);
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : close())}>
      {/* LARGE, with a fixed header (Ali, 9 Sep): near full-screen on
          desktop, the header stays put, the body scrolls underneath only
          if it must, and nothing inside carries its own border. */}
      <DialogContent
        dataHook="beacon-modal"
        data-beacon-section={section}
        className="flex max-h-[94vh] w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1400px)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-6 border-b px-6 py-5" data-hook="beacon-modal-header">
          {/* The trial recap's header format (Ali, 10 Sep: "a lovely header
              format"): an illustration picked for what the dialog is about,
              the badge and the location on one line, the title under it. */}
          <div className="flex min-w-0 items-center gap-4">
            <HeaderArt section={section} page={page} />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <BeaconBadge dataHook="beacon-modal-badge" beta />
                <span className="text-label-sm text-muted-foreground">{locationName}</span>
              </div>
              <DialogTitle className="text-heading-page font-sans leading-tight text-balance">{section === "plan" ? "Beacon's plan for you" : page ? `What Beacon sees in your ${PAGE_NAME[page]}` : "Beacon's summary of your reviews"}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">Your AI summary for this location.</DialogDescription>
          <DialogClose asChild>
            <Button variant="outline" size="sm" dataHook="beacon-modal-close">
              <X className="size-4" />
              Close
            </Button>
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6" key={`${section}-${page ?? "hub"}`}>
          {section === "plan" ? (
            <ReviewInsights bare />
          ) : early ? (
            // Content left, the Did you know up the right (Ali, 10 Sep),
            // stacked on mobile. Early days: no charts to draw yet.
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-stretch">
              <div className="gds-stagger flex flex-col gap-2">
                {page ? <BeaconPageBlock page={page} /> : <ReviewSummary full bare tilesRow />}
                <SummaryCharts stats={stats} />
                <ModalCta stats={stats} page={page} />
              </div>
              <div className="gds-beacon-column lg:sticky lg:top-0 lg:self-start">
                <DidYouKnowPanel stats={stats} page={page} />
              </div>
            </div>
          ) : (
            // Rich data: content left, the six-month charts stacked up the
            // right as an infographic (Ali, 11 Sep). Each page gets the
            // charts it is about (Ali, 9 Sep).
            <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-start">
              <div className="gds-stagger flex flex-col gap-2">
                {page ? <BeaconPageBlock page={page} /> : <ReviewSummary full bare tilesRow />}
                <ModalCta stats={stats} page={page} />
              </div>
              <div className="gds-beacon-column lg:sticky lg:top-0 lg:self-start">
                <SummaryCharts
                  stats={stats}
                  stacked
                  kinds={page === "builder" ? ["velocity", "fourPlus"] : page === "showcase" ? ["rating", "fourPlus"] : ["rating", "velocity", "fourPlus"]}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
