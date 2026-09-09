/**
 * "What to do next" for the Reviews area, in BrightLocal's voice.
 *
 * The tone is lifted from their own material (the 12-month Local SEO
 * roadmap, Sep 2026): an outcome-led goal up top, "Key tactics" under
 * it, plain benefits, "We get it:" when a job sounds like a chore, and
 * a "Did you know" fact with its source. Every number here comes from
 * the location's profile (lib/location-profiles), so a card never says
 * something the pages beside it contradict. Facts are the location's own
 * numbers; an industry statistic goes in only with a source Ali can
 * stand behind (see FACT below).
 *
 * Items share the Insights and Actions item shape (title, actionsSummary,
 * actions with links), so the same InsightCard renders both.
 */

import type { ReviewStats } from "@/lib/reviews-data";
import type { Persona } from "@/lib/personas";

export interface ReviewInsight {
  id: string;
  area: "reviews";
  severity: "high" | "medium" | "low";
  title: string;
  actionsSummary: string;
  actions: { label: string; text: string; links: { label: string; goto: string }[] }[];
  /** One flowing sentence for the Manager strip, in place of the tactic
   *  labels stitched together (Ali, 10 Sep: two clipped sentences read
   *  oddly, and that stitching was never BrightLocal's style). */
  strip: string;
}

export interface ReviewPlan {
  /** The one-line goal, outcome first. `mark` is the phrase to highlight.
   *  `short` is the few-word size for a chip ("Answer your 26 reviews"). */
  goal: { text: string; mark: string; short: string };
  /** One plain sentence under the goal. */
  lede: string;
  items: ReviewInsight[];
  /** A "Did you know" fact from the location's own numbers. */
  fact: string | null;
}

const MANAGER = "screen:dmsxf5zjggd0n";
const TEMPLATES = "screen:dmtaq1rm9eok2";
const BUILDER = "screen:dmt094j963aye";
const SHOWCASE = "screen:dmt094lhmpwbs";
const REPORT_SETTINGS = "screen:dmtkj124xagqa";

export function reviewPlanFor(stats: ReviewStats, persona: Persona): ReviewPlan {
  const h = { ...stats, allTime: stats.inbox, reviews: stats.total.toLocaleString("en-GB"), fiveStar: String(stats.fiveStar) };
  const starter = persona.engagement === "new";
  const rating = Number(h.rating);
  const items: ReviewInsight[] = [];

  if (h.needReply > 0) {
    const ratio = h.allTime ? h.needReply / h.allTime : 0;
    items.push({
      id: "reply-backlog",
      strip: "Start with the oldest reviews, then let your five-star Google reviews reply themselves.",
      area: "reviews",
      severity: ratio > 0.4 ? "high" : "medium",
      title: `Get every review answered`,
      actionsSummary: `We get it: ${h.needReply} replies sounds like an afternoon you don't have. But a reply is the one thing customers and Google both read, and ${h.needReply} of your ${h.allTime} reviews are still waiting. Here's the quickest way through.`,
      actions: [
        {
          label: "Start with the oldest reviews.",
          text: "Start with the oldest reviews. Flip the inbox to oldest first so nobody has been waiting more than a week. Keep it short and specific: thank them, name the thing they liked, sign off.",
          links: [{ label: "Open Review Manager", goto: MANAGER }],
        },
        {
          label: "Let five-star Google reviews reply themselves.",
          text: "Let five-star Google reviews reply themselves. An auto-reply rule with a template takes the easy ones off your plate, so the queue only holds reviews that need a person. Google is the only source that supports it.",
          links: [{ label: "Set up an auto-reply", goto: TEMPLATES }],
        },
      ],
    });
  }

  const win = stats.recent;
  const winLabel = win.kind === "days" ? `last ${win.size} days` : `last ${win.size} reviews`;
  if (stats.total > 0 && (win.ratingValue < 4.2 || stats.ratingValue - win.ratingValue >= 0.3)) {
    items.push({
      id: "low-rating",
      strip: "Answer every one and two star review this week, then ask your happiest customers for a review.",
      area: "reviews",
      severity: "high",
      title: stats.compare ? `Bring ${stats.compare.self} back in line with ${stats.compare.label}` : `Turn your recent reviews around`,
      actionsSummary: `Your ${winLabel} average is ${win.rating}${stats.ratingValue - win.ratingValue >= 0.3 ? ` against ${stats.rating} all time` : ""}. The lifetime number barely moves. The recent one does, and it is what the next customer sees first. Two things move it: fewer new low reviews, and more new high ones.${stats.compare && stats.compare.mentions ? ` ${stats.compare.mentions} of your last ${stats.lastN} reviews name your ${stats.compare.label} branch as the standard. Go and see what ${stats.compare.label} does differently.` : ""}`,
      actions: [
        {
          label: "Answer every one and two star review this week.",
          text: "Answer every one and two star review this week. A calm reply that names the problem and says what changed reassures the next reader more than the review worried them. Filter the inbox to one and two stars.",
          links: [{ label: "Open the low reviews", goto: MANAGER }],
        },
        {
          label: "Ask your happiest customers for a review.",
          text: "Ask your happiest customers for a review. A steady flow of new five-star reviews lifts the average faster than anything else. A link on the receipt or a QR code by the till is the fastest start.",
          links: [{ label: "Create a campaign", goto: BUILDER }],
        },
      ],
    });
  }

  if (h.running === 0) {
    items.push({
      id: "no-campaigns",
      strip: "Pick one channel, send to a small list first, and watch the count climb.",
      area: "reviews",
      severity: starter ? "medium" : "high",
      title: "Start asking for reviews",
      actionsSummary: starter
        ? "You haven't asked anyone yet, and that's normal in week one. Businesses that ask get several times more reviews than businesses that wait. One campaign is enough to start."
        : `Nothing is running. Your ${h.reviews} reviews arrived on their own, which is great, and asking is how you keep them coming.`,
      actions: [
        {
          label: "Create your first campaign.",
          text: "Create your first campaign. Email and SMS reach past customers. A web link or QR code catches people at the till. Pick one channel and send to a small list first.",
          links: [{ label: "Create a campaign", goto: BUILDER }],
        },
      ],
    });
  }

  if (h.sourceCount < 3) {
    items.push({
      id: "few-sources",
      strip: "Connect Facebook and TripAdvisor so every new review lands in the same inbox.",
      area: "reviews",
      severity: "medium",
      title: "See every review in one place",
      actionsSummary: `Only ${h.sourceCount === 1 ? "Google is" : `${h.sourceCount} sources are`} connected. Reviews on Facebook, Yelp and TripAdvisor count too, and you can't reply to what you can't see. Connecting a source takes about two minutes.`,
      actions: [
        {
          label: "Connect Facebook and TripAdvisor.",
          text: "Connect Facebook and TripAdvisor. Facebook needs you to sign in once. TripAdvisor just needs your listing URL. New reviews from both land in the inbox.",
          links: [{ label: "Manage sources", goto: REPORT_SETTINGS }],
        },
      ],
    });
  }

  if (starter) {
    items.push({
      id: "showcase-unplaced",
      strip: "Choose the reviews you are proudest of and put them where new customers will see them.",
      area: "reviews",
      severity: "low",
      title: "Put your best reviews on your website",
      actionsSummary: "Three showcases are ready to place, and reviews on your own pages convince the visitors who never look at Google. This is the easiest win on the list.",
      actions: [
        {
          label: "Place a showcase on your site.",
          text: "Place a showcase on your site. Copy one line of code into the page where people decide, usually the home page or the booking page.",
          links: [{ label: "Open Review Showcase", goto: SHOWCASE }],
        },
      ],
    });
  }

  // The recent-window item leads when it fires: it is the interesting one.
  const lowIdx = items.findIndex((i) => i.id === "low-rating");
  if (lowIdx > 0) items.unshift(items.splice(lowIdx, 1)[0]);
  // The goal is the first item's outcome, said as a sentence.
  const goal =
    items[0]?.id === "reply-backlog"
      ? { text: `Answer your ${h.needReply} waiting reviews and keep your rating moving up.`, mark: `${h.needReply} waiting reviews`, short: `Answer your ${h.needReply} reviews` }
      : items[0]?.id === "low-rating"
        ? stats.compare
          ? { text: `Get ${stats.compare.self}'s recent reviews back to ${stats.compare.label}'s standard.`, mark: `${stats.compare.label}'s standard`, short: `Catch up with ${stats.compare.label}` }
          : { text: `Get your ${winLabel} back to four stars and above.`, mark: "four stars and above", short: "Turn recent reviews around" }
        : items[0]?.id === "no-campaigns"
          ? { text: "Start asking for reviews and watch the count climb.", mark: "asking for reviews", short: "Send your first campaign" }
          : items[0]?.id === "few-sources"
            ? { text: "Get every review source into one inbox.", mark: "one inbox", short: "Connect more sources" }
            : { text: "Keep doing what you're doing. Your reviews are in good shape.", mark: "good shape", short: "All in good shape" };

  const lede =
    items.length > 0
      ? `Worked out from your ${h.allTime} reviews as they stand today. Each tactic opens the tool that does it.`
      : "Nothing needs you right now. Check back after your next campaign.";

  // Own-data fact. FACT (assumption for Ali): an industry statistic in the
  // roadmap's "Did you know" style needs a source we can cite, for example
  // BrightLocal's Local Consumer Review Survey; until one is chosen, the
  // fact quotes the location's own numbers, which are always true.
  // ONE sentence (Ali, 9 Sep: "the nugget text string is too long").
  const fact =
    h.allTime > 0
      ? h.needReply > 0
        ? `Did you know ${h.needReply} of your ${h.allTime} reviews are still waiting for a thank you?`
        : `Did you know ${h.fiveStar} of your ${h.reviews} reviews are five stars?`
      : null;

  return { goal, lede, items, fact };
}
