"use client";

// Promoted from Studio screen "Reviews"
// (design dmrotrhbcxk66, version 1788892759000). Registry: lib/screens.ts;
// re-promotion workflow: apps/brightlocal/README.md.
// source-hash: b45c38741885

// Reviews — top-level landing (nav model v2). Generated from
// templates/hub-blank.jsx; the shell/sidenav/header live in
// "@brightlocal/proposal" and top-level nav wiring comes from the
// module's DEFAULT navLinks.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
} from "@brightlocal/ui-components/card";
import { Button } from "@brightlocal/ui-components/button";
import { Menu, ArrowRight } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  CardTitleLink,
} from "@brightlocal/proposal";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { profileFor } from "@/lib/location-profiles";
import { statsFor } from "@/lib/reviews-data";
import { STEPS, STEP_CARD } from "@/components/starter-guide";
import { ReviewSummaryStrip, BeaconChip } from "@/components/review-summary";
import { QrBanner } from "@/components/qr-banner";
import { BeaconNugget } from "@/components/beacon-nugget";
import { reviewPlanFor } from "@/lib/review-insights";
import { reviewSummaryFor } from "@/lib/review-summary";

/* ================================ reference =============================== */

// THE CARDS CARRY NUMBERS NOW (Ali, 3 Sep: "bring some kind of information
// onto the cards, 3 items maximum, maybe one key number and a breakdown").
//
// They were deliberately bare, and the reason still stands: a made-up count
// on a landing page is the kind of thing that gets quoted back as fact. So
// none of these are made up. EVERY FIGURE BELOW WAS READ OFF THE PAGE THE
// CARD LINKS TO, on 3 Sep, from its live render:
//
//   Review Manager      the status tab counts — 60 all, 26 needs action,
//                     7 manually replied, 22 auto-replied, 5 skipped
//   Review Tracker   the Sources card — 1,116 reviews, average 4.7 — and
//                     the ratings breakdown, 836 five-star of 1,116
//   Review Builder       the campaign cards — 5 campaigns, 3 live, 1 draft,
//                     1 stopped
//   Review Showcase    the two seeded widgets — one live feed, one hand-picked
//
// Ali, 3 Sep: "use it from the seed if we can, don't have to necessarily
// update". So these are STATIC, and that is a deliberate trade rather than
// an oversight: there is no store shared across RM's screens, so the only
// alternative is four numbers that silently disagree with the pages they
// summarise. If a seed changes, change it here too — that is what this
// comment is for.
//
// ONE HEADLINE, THEN A BREAKDOWN, capped at three parts. A hub card is read
// in about a second on the way somewhere else: the headline is the number
// that decides whether you go, and the breakdown is only there to stop the
// headline being ambiguous. Four parts turns a signpost into a report.
const HUB_CARDS = [
  {
    title: "Review Manager",
    lede: "Manage every review for this location",
    goto: "screen:dmsxf5zjggd0n",
    hook: "reviews-hub-inbox",
    // The headline is the one that implies an ACTION. "60 reviews" is a
    // fact; "26 need a reply" is a reason to click.
    headline: "26",
    headlineLabel: "need a reply",
    parts: [
      { k: "Replied", v: "29" },
      { k: "Skipped", v: "5" },
      // ASSUMPTION, needs Ali's call (6 Sep). This says 60 all time while the
      // Review Tracker card beside it says 1,116 reviews for the same
      // location. Both are honest to their own page: the Manager seeds 60
      // rows and its period filter genuinely offers "All time", the Tracker
      // aggregates 1,116. Sitting side by side on the hub, they read as a
      // contradiction. Cheapest fix is relabelling this part "In your inbox";
      // the real fix is reconciling the two seeds. Left as-is pending a call.
      { k: "All time", v: "60" },
    ],
  },
  {
    title: "Review Tracker",
    // NOT "charts and tables" (Ali, 3 Sep: "that summary is not so
    // insightful"). It described the FURNITURE — what the page is made of,
    // not what it is for. Every other card here says what you would learn or
    // do; this one said what widgets are on the page.
    //
    // Two questions, not three (Ali, 3 Sep: "and what is pulling it up or
    // down — not needed, it is fluff"). It was, and it was the tell: the
    // clause named no object, so it could have been appended to any of the
    // four cards without changing meaning. Where reviews come from and how
    // the rating moves are the two things the page actually answers.
    lede: "Location sources and ratings over time",
    goto: "screen:dmswb0i9c6oe5",
    hook: "reviews-hub-insights",
    headline: "4.7",
    headlineLabel: "average rating",
    parts: [
      { k: "Reviews", v: "1,116" },
      { k: "Five star", v: "836" },
      // SEVEN, matching the page (6 Sep). Four was the number of NAMED donut
      // slices; the page now counts every source with reviews, including the
      // three folded into Other.
      { k: "Sources", v: "7" },
    ],
  },
  {
    title: "Review Builder",
    lede: "Invite your visitors to leave a review",
    goto: "screen:dmt094j963aye",
    hook: "reviews-hub-get",
    // COUNTED OFF THE PAGE, not remembered (6 Sep). The table shows nine
    // campaigns: 4 Live + 1 Sending are the five actually running, then one
    // Scheduled, one Draft, one Finished and one Stopped. The hub said 3 of
    // 5, which was true of the card grid this table replaced.
    headline: "5",
    headlineLabel: "campaigns running",
    parts: [
      { k: "Scheduled", v: "1" },
      { k: "Draft", v: "1" },
      { k: "All time", v: "9" },
    ],
  },
  {
    title: "Review Showcase",
    lede: "Publish your best reviews on your site",
    goto: "screen:dmt094lhmpwbs",
    hook: "reviews-hub-widgets",
    headline: "3",
    // Three fixed showcases since 7 Sep (List hand-picked, Carousel and JSON
    // feed live). Mirrors the Showcase page, which is the source of truth.
    headlineLabel: "showcases",
    parts: [
      { k: "Live feed", v: "2" },
      { k: "Hand-picked", v: "1" },
    ],
  },
];

// STARTER PERSONA (app-side, 8 Sep). The same four signposts for a business
// that has just started: the numbers match what its Manager, Tracker,
// Builder and Showcase pages seed for that persona (four Google reviews,
// one connected source, no campaigns, three unplaced showcases).
const STARTER_HUB_CARDS = [
  { ...HUB_CARDS[0], headline: "4", headlineLabel: "need a reply", parts: [{ k: "Replied", v: "0" }, { k: "All time", v: "4" }] },
  { ...HUB_CARDS[1], headline: "4.8", headlineLabel: "average rating", parts: [{ k: "Reviews", v: "4" }, { k: "Five star", v: "3" }, { k: "Sources", v: "1" }] },
  { ...HUB_CARDS[2], headline: "0", headlineLabel: "campaigns running", parts: [{ k: "Sent", v: "0" }, { k: "Reviews gained", v: "0" }] },
  { ...HUB_CARDS[3], headline: "3", headlineLabel: "showcases ready", parts: [{ k: "On your site", v: "0" }] },
];

// PER-LOCATION CARDS (app-side, 9 Sep): the same four signposts with the
// numbers of the location in the URL, from lib/location-profiles (where
// each number is read off the page it links to, as HUB_CARDS' were).
function hubCardsFor(h) {
  return [
    { ...HUB_CARDS[0], headline: String(h.needReply), parts: [{ k: "Replied", v: String(h.replied) }, { k: "Skipped", v: String(h.skipped) }, { k: "In your inbox", v: String(h.inbox) }] },
    { ...HUB_CARDS[1], headline: h.rating, parts: [{ k: "Reviews", v: h.total.toLocaleString("en-GB") }, { k: "Five star", v: String(h.fiveStar) }, { k: "Sources", v: String(h.sourceCount) }] },
    { ...HUB_CARDS[2], headline: String(h.running), parts: [{ k: "Scheduled", v: String(h.scheduled) }, { k: "Draft", v: String(h.draft) }, { k: "All time", v: String(h.campaignsAll) }] },
    HUB_CARDS[3],
  ];
}

// HubCard / DrillArrow are lifted VERBATIM from UI Vision - Location Hub
// (dmrurue2wmp9u), which is where the pattern is set.
function DrillArrow() {
  return (
    <Button
      variant="secondary"
      aria-hidden
      tabIndex={-1}
      dataHook="hub-drill-arrow"
      className="pointer-events-none size-9 shrink-0 rounded-full p-0 group-hover:bg-secondary/80"
    >
      <ArrowRight className="size-4" />
    </Button>
  );
}

function HubCard({ card }) {
  return (
    <Card
      className="group h-full max-w-none cursor-pointer gap-4 transition-shadow hover:shadow-sm"
      dataHook={card.hook}
      data-grade-goto={card.goto}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitleLink>{card.title}</CardTitleLink>
            <CardDescription>{card.lede}</CardDescription>
          </div>
          <DrillArrow />
        </div>
      </CardHeader>
      {/* mt-auto ON THE CONTENT, BREAKDOWN IN THE FOOTER (Ali, 3 Sep: "put
          the summary numbers in the footer, so they stick to the bottom").
          The four ledes are different lengths — Review Tracker wraps to two
          lines, Review Manager does not — so without this the numbers sat at
          four different heights across a 2x2 grid and the eye had nothing to
          run along. Pushing the content down pins the headline AND the
          breakdown to the bottom edge, so the numbers line up across the row
          whatever the copy above them does. */}
      <CardContent className="mt-auto flex flex-col gap-3">
        {/* THE HEADLINE READS AS A SENTENCE, not as a stat tile. A tile
            would put this card in competition with the module cards on the
            location hub, which ARE stat tiles; this is a signpost with a
            number on it. Number and label share a baseline so they read as
            one phrase rather than as a label above a value. */}
        <p className="flex items-baseline gap-2" data-hook={`${card.hook}-headline`}>
          <span className="text-3xl font-bold tracking-tight tabular-nums">{card.headline}</span>
          <span className="text-muted-foreground text-sm">{card.headlineLabel}</span>
        </p>
        {card.beacon ? <BeaconChip text={card.beacon} dataHook={`${card.hook}-beacon`} /> : null}
        {/* A starter's next step lives in the card it belongs to (Ali, 11 Sep),
            in place of a separate guide. */}
        {card.step ? (
          <div className="flex flex-col gap-2 rounded-lg bg-[var(--ds-tailwind-colors-neutral-50)] p-3" data-hook={`${card.hook}-step`}>
            <p className="text-sm font-medium">{card.step.done ? "Done: " : "Next: "}{card.step.title}</p>
            <p className="text-muted-foreground text-sm">{card.step.detail}</p>
            <span className="w-fit" data-grade-goto={card.step.goto} onClick={(e) => e.stopPropagation()}>
              <Button variant={card.step.done ? "outline" : "primary"} size="sm" dataHook={`${card.hook}-step-cta`}>
                {card.step.cta}
                <ArrowRight className="size-4" />
              </Button>
            </span>
          </div>
        ) : null}
      </CardContent>
      {/* The breakdown is one row, not a stack: three short key/value pairs
          fit across a half-width card, and stacking them would make the card
          twice as tall for the same three facts. */}
      <CardFooter className="border-t pt-3">
        <dl
          className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm"
          data-hook={`${card.hook}-parts`}
        >
          {card.parts.map((p) => (
            <div key={p.k} className="flex items-baseline gap-1.5">
              <dt>{p.k}</dt>
              <dd className="text-foreground font-medium tabular-nums">{p.v}</dd>
            </div>
          ))}
        </dl>
      </CardFooter>
    </Card>
  );
}

export default function ReviewsPage() {
  const persona = usePersona();
  const starter = persona.engagement === "new";
  const locationKey = useLocationKey();
  const stats = statsFor(locationKey, persona);
  const cards = (starter ? STARTER_HUB_CARDS : hubCardsFor(stats)).map((card) =>
    starter ? { ...card, step: STEPS.find((s) => s.id === STEP_CARD[card.hook]) ?? null } : card,
  );
  // The smallest Beacon size on the two cards it can say something about.
  const chips = {
    "reviews-hub-inbox": reviewPlanFor(stats, persona).goal.short,
    "reviews-hub-insights": reviewSummaryFor(stats, starter).short,
  };
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        navDensity="comfortable"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="reviews-app-layout"
        sidebar={<ProposalSidebar dataHook="reviews-sidebar" activeId="reviews" />}
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
            dataHook="reviews-page-header"
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
            ]}
            title="Reviews"
            // IT WAS LISTING THE CARDS (Ali, 7 Sep: "this is also truly
            // awful"). Four clauses, one per card, sitting directly above four
            // cards that each carry a title AND a lede: the page said
            // everything twice and the description was the weaker telling.
            // A page description should say what the PAGE is, and leave the
            // cards to say what they are. Deleting it outright breaks the
            // standing rule that every proposal page carries one (20 Jul), so
            // this is the shortest line that does the job.
            description="Everything you need to increase your reputation"
          />
        }
      >
        <GlobalLayoutContentBody dataHook="reviews-page-body" className="space-y-6 pb-10">
          <ReviewSummaryStrip />
          {/* The guide is folded into the cards for a starter (Ali, 11 Sep). */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cards.map((card) => (
              <HubCard key={card.hook} card={{ ...card, beacon: chips[card.hook] }} />
            ))}
          </div>
          <BeaconNugget page="hub" />
          {/* The QR code sits at the foot for an account that has not asked
              yet (Ali, 11 Sep: "meaningful and fun for a fresh starter, it
              ties them in to the service"). */}
          {stats.campaignsAll === 0 ? <QrBanner /> : null}
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
