/**
 * Beacon's line for each Reviews page, off the same dataset as the hub.
 * A page strip says the thing that page is FOR: the Tracker talks about
 * volume and cadence, the Builder about what asking did, the Showcase
 * about why the reviews belong on the website (Ali, 9 Sep: "on Showcase
 * say the reasons why, Did you know").
 */

import type { ReviewStats } from "@/lib/reviews-data";
import type { Persona } from "@/lib/personas";
import type { Segment } from "@/lib/review-summary";

export type BeaconPage = "tracker" | "builder" | "showcase";

export interface PageBeacon {
  headline: string;
  line: Segment[];
  tiles: { value: string; label: string }[];
  /** The one thing to do about it. `path` is relative to the location. */
  cta?: { label: string; path: string };
}

const t = (text: string): Segment => ({ kind: "text", text });
const m = (text: string, hint?: string): Segment => ({ kind: "metric", text, tone: "neutral", hint });

export function pageBeaconFor(page: BeaconPage, s: ReviewStats, persona: Persona): PageBeacon {
  const starter = persona.engagement === "new";
  const up = s.monthChangePct >= 0;

  if (page === "tracker") {
    return {
      headline: starter
        ? "Four reviews in. Ask, and this chart starts moving."
        : up
          ? `Review velocity is up ${s.monthChangePct}% on last month.`
          : `Review velocity is down ${Math.abs(s.monthChangePct)}% on last month.`,
      line: starter
        ? [t("Your "), m(String(s.total)), t(" reviews so far all came from Google. The Tracker earns its keep once you're asking and more sources are connected.")]
        : [
            m(String(s.thisMonth), `Reviews received so far this month.`), t(" reviews so far this month, "), m(`${up ? "up" : "down"} ${Math.abs(s.monthChangePct)}%`, `Against ${s.lastMonth} in the whole of last month.`), t(` on the ${s.lastMonth} last month. `),
            ...(s.spike ? [t("The spike on "), m(s.spike.date), t(` is your ${s.spike.campaign} ${s.spike.channel}. `)] : []),
            t("Your "), m(s.recent.kind === "days" ? "last 30 days" : "last 20 reviews"), t(" average "), m(s.recent.rating), t(`; all time is `), m(s.rating), t("."),
          ],
      tiles: [
        { value: `${up ? "+" : ""}${s.monthChangePct}%`, label: "review velocity vs last month" },
        { value: s.recent.rating, label: s.recent.kind === "days" ? "rating, last 30 days" : "rating, last 20 reviews" },
        { value: `${s.fourPlusPct}%`, label: "four stars or above this month" },
      ],
      cta: starter ? { label: "Send your first campaign", path: "reviews/builder?view=wizard" } : { label: "See the reviews behind this", path: "reviews/manager" },
    };
  }

  if (page === "builder") {
    return {
      headline: starter
        ? "One campaign is enough to start."
        : s.running === 0
          ? "Nothing is asking for reviews right now."
          : s.spike
            ? `Your ${s.spike.campaign} ${s.spike.channel} is why ${s.spike.date} spiked.`
            : `${s.running} campaigns are running. Here's what they're bringing in.`,
      line: starter
        ? [t("Businesses that ask get several times more reviews than businesses that wait. A link on the receipt or a QR code by the till takes ten minutes to set up.")]
        : s.spike
          ? [t("Reviews received this month are "), m(`${up ? "up" : "down"} ${Math.abs(s.monthChangePct)}%`), t(" on last month, and "), m(`${s.fourPlusPct}%`), t(" of them were four stars or above. The send on "), m(s.spike.date), t(" did most of that. Same again next month keeps the velocity up.")]
          : [t("Reviews received this month are "), m(`${up ? "up" : "down"} ${Math.abs(s.monthChangePct)}%`), t(" on last month. Nothing you sent explains it, which means a campaign would.")],
      tiles: [
        { value: String(s.running), label: "campaigns running" },
        { value: String(s.thisMonth), label: "reviews this month" },
        { value: s.spike ? s.spike.date : "none", label: "last spike" },
      ],
      cta: { label: s.running === 0 || starter ? "Create a campaign" : "Get a campaign ready for next month", path: "reviews/builder?view=wizard" },
    };
  }

  // showcase: the reasons why
  return {
    headline: starter ? "Three showcases are ready. None is on your site yet." : `${s.fiveStar} five-star reviews, and your website shows none of them.`,
    line: [
      t("The people who read reviews on your own site are the ones who never look at Google. "),
      ...(s.theme?.good ? [t("The thing customers keep praising is "), m(s.theme.text), t(". That is the quote to put on the booking page.")] : [t("Your best reviews are ready to show; pick the ones the booking page should carry.")]),
    ],
    tiles: [
      { value: String(s.fiveStar), label: "five-star reviews" },
      { value: `${s.fourPlusPct}%`, label: "four stars or above this month" },
      { value: "3", label: "showcases ready" },
    ],
    cta: { label: "Pick the reviews to show", path: "reviews/manager" },
  };
}

export type NuggetPage = BeaconPage | "hub" | "manager";

export interface Nugget {
  fact: string;
  action: string;
  cta: { label: string; goto: string };
}

const GOTO = { manager: "screen:dmsxf5zjggd0n", templates: "screen:dmtaq1rm9eok2", builder: "screen:dmt094j963aye", showcase: "screen:dmt094lhmpwbs" };

/** One fact and one easy thing, per page, from the location's own rows. */
export function nuggetFor(page: NuggetPage, s: ReviewStats, persona: Persona): Nugget | null {
  const starter = persona.engagement === "new";
  if (page === "hub") {
    if (s.needReply > 0)
      return { fact: `Did you know ${s.needReply} of your ${s.inbox} reviews are still waiting for a thank you?`, action: "Start with the oldest one.", cta: { label: "Open Review Manager", goto: GOTO.manager } };
    return { fact: `Did you know ${s.fiveStar} of your ${s.total.toLocaleString("en-GB")} reviews are five stars?`, action: "Put the best of them on your website.", cta: { label: "Open Review Showcase", goto: GOTO.showcase } };
  }
  if (page === "manager") {
    if (s.oldestWaitingDays !== null)
      return { fact: `Did you know your oldest unanswered review has waited ${s.oldestWaitingDays} days?`, action: "Answer that one first; it is the one people see waiting.", cta: { label: "Set up an auto-reply", goto: GOTO.templates } };
    return { fact: "Did you know every review here has a reply?", action: "Keep it that way with an auto-reply for five-star Google reviews.", cta: { label: "Set up an auto-reply", goto: GOTO.templates } };
  }
  if (page === "tracker") {
    return { fact: `Did you know ${s.googleShareThisMonth}% of this month's reviews came from Google?`, action: starter ? "Connect Facebook and TripAdvisor to see the rest." : "The other sources count too; make sure they are connected.", cta: { label: "See the reviews", goto: GOTO.manager } };
  }
  // RULE: a nugget never restates the page's strip (Ali, 9 Sep). The strip
  // already tells the Builder about the spike and the Showcase about the
  // praised theme, so their nuggets say something else.
  if (page === "builder") {
    if (s.spike && s.spikeDayCount > 0)
      return { fact: `Did you know your ${s.spike.campaign} ${s.spike.channel} brought ${s.spikeDayCount} reviews in two days?`, action: "Schedule the next one now and it sends itself.", cta: { label: "Schedule a campaign", goto: GOTO.builder } };
    return { fact: "Did you know businesses that ask get several times more reviews than those that wait?", action: "One campaign is enough to start.", cta: { label: "Create a campaign", goto: GOTO.builder } };
  }
  // showcase: the strip has the praised theme, so the nugget has the count.
  return { fact: `Did you know ${s.fiveStar} of your ${s.total.toLocaleString("en-GB")} reviews are five stars?`, action: "The hand-picked showcase lets you choose the six your site shows.", cta: { label: "Pick the reviews to show", goto: GOTO.manager } };
}
