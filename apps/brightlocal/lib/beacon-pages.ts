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
            m(String(s.thisMonth), `Reviews received so far this month.`), t(" reviews so far this month against "), m(String(s.lastMonth), "Reviews received in the whole of last month."), t(" in the whole of last month. "),
            ...(s.spike ? [t("The spike on "), m(s.spike.date), t(` is your ${s.spike.campaign} ${s.spike.channel}. `)] : []),
            t("Your "), m(s.recent.kind === "days" ? "last 30 days" : "last 20 reviews"), t(" average "), m(s.recent.rating), t(`; all time is `), m(s.rating), t("."),
          ],
      tiles: [
        { value: `${up ? "+" : ""}${s.monthChangePct}%`, label: "review velocity vs last month" },
        { value: s.recent.rating, label: s.recent.kind === "days" ? "rating, last 30 days" : "rating, last 20 reviews" },
        { value: `${s.fourPlusPct}%`, label: "four stars or above this month" },
      ],
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
    };
  }

  // showcase: the reasons why
  return {
    headline: starter ? "Three showcases are ready. None is on your site yet." : `${s.fiveStar} five-star reviews, and your website shows none of them.`,
    line: [
      t("Did you know the people who read reviews on your own site are the ones who never look at Google? "), m(String(s.fiveStar), "Five-star reviews across every connected source, all time."), t(" of your "), m(s.total.toLocaleString("en-GB")), t(" reviews are five stars"),
      ...(s.theme?.good ? [t(", and the thing they keep praising is "), m(s.theme.text), t(". That is the quote to put on the booking page.")] : [t(". The hand-picked showcase lets you choose which ones the booking page shows.")]),
    ],
    tiles: [
      { value: String(s.fiveStar), label: "five-star reviews" },
      { value: `${s.fourPlusPct}%`, label: "four stars or above this month" },
      { value: "3", label: "showcases ready" },
    ],
  };
}
