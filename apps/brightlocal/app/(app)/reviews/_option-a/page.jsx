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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {HUB_CARDS.map((card) => (
              <HubCard key={card.hook} card={card} />
            ))}
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
