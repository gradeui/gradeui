/**
 * "What to do next" for the Reviews area: insight items derived from a
 * location's real numbers (lib/location-profiles) and the persona, in
 * the same item shape the Insights and Actions pages use (aiInsights
 * items: title, actionsSummary, actions with links), so the same
 * InsightCard renders both and the two can merge later.
 *
 * Rules, not prose: every sentence quotes a number from the profile, so
 * a card never says something the pages beside it contradict. This is
 * the 8 Sep priority ("trends and how do I fix it, in place"): the hub
 * should say what to do, not just what is.
 */

import type { LocationProfile } from "@/lib/location-profiles";
import type { Persona } from "@/lib/personas";

export interface ReviewInsight {
  id: string;
  area: "reviews";
  severity: "high" | "medium" | "low";
  title: string;
  actionsSummary: string;
  actions: { label: string; text: string; links: { label: string; goto: string }[] }[];
}

const MANAGER = "screen:dmsxf5zjggd0n";
const TEMPLATES = "screen:dmtaq1rm9eok2";
const BUILDER = "screen:dmt094j963aye";
const SHOWCASE = "screen:dmt094lhmpwbs";
const REPORT_SETTINGS = "screen:dmtkj124xagqa";

export function reviewInsightsFor(profile: LocationProfile, persona: Persona): ReviewInsight[] {
  const h = profile.hub;
  const starter = persona.engagement === "new";
  const items: ReviewInsight[] = [];

  if (h.needReply > 0) {
    const ratio = h.allTime ? h.needReply / h.allTime : 0;
    items.push({
      id: "reply-backlog",
      area: "reviews",
      severity: ratio > 0.4 ? "high" : "medium",
      title: `${h.needReply} ${h.needReply === 1 ? "review is" : "reviews are"} waiting for a reply`,
      actionsSummary: `${h.needReply} of your ${h.allTime} reviews have no reply. Customers read replies as much as reviews, and Google shows businesses that answer. Clearing the backlog is the quickest win on this page.`,
      actions: [
        {
          label: "Reply to the oldest reviews first.",
          text: "Reply to the oldest reviews first. The inbox is sorted newest first; switch it to oldest first so nothing has been waiting longer than a week. A short, specific thank you beats a long generic one.",
          links: [{ label: "Open Review Manager", goto: MANAGER }],
        },
        {
          label: "Let five-star Google reviews reply themselves.",
          text: "Let five-star Google reviews reply themselves. An auto-reply rule with a template handles the easy ones, so the queue only holds reviews that need a person. Google is the only source that supports it.",
          links: [{ label: "Set up an auto-reply", goto: TEMPLATES }],
        },
      ],
    });
  }

  const rating = Number(h.rating);
  if (rating && rating < 4.2) {
    items.push({
      id: "low-rating",
      area: "reviews",
      severity: "high",
      title: `Your rating is ${h.rating}. Low reviews are pulling it down`,
      actionsSummary: `At ${h.rating} you sit below the 4.2 most customers filter at. The fastest way up is fewer new low reviews and more new high ones, and both start with the reviews already here.`,
      actions: [
        {
          label: "Answer every one and two star review this week.",
          text: "Answer every one and two star review this week. A calm reply that names the problem and what changed reassures the next reader more than the review worried them. Filter the inbox to one and two stars.",
          links: [{ label: "Open the low reviews", goto: MANAGER }],
        },
        {
          label: "Ask your happiest customers for a review.",
          text: "Ask your happiest customers for a review. A steady flow of new five-star reviews moves the average faster than anything else. Start with a link on the receipt or a QR code by the till.",
          links: [{ label: "Create a campaign", goto: BUILDER }],
        },
      ],
    });
  }

  if (h.running === 0) {
    items.push({
      id: "no-campaigns",
      area: "reviews",
      severity: starter ? "medium" : "high",
      title: "You are not asking for reviews",
      actionsSummary: starter
        ? "You have no campaigns yet. Businesses that ask get three to five times more reviews than those that wait. One campaign is enough to start."
        : `No campaign is running. Your ${h.reviews} reviews arrived on their own; asking is how you keep them coming.`,
      actions: [
        {
          label: "Create your first campaign.",
          text: "Create your first campaign. Email and SMS reach past customers; a web link or QR code catches people at the till. Pick one channel and send to a small list first.",
          links: [{ label: "Create a campaign", goto: BUILDER }],
        },
      ],
    });
  }

  if (h.sourceCount < 3) {
    items.push({
      id: "few-sources",
      area: "reviews",
      severity: "medium",
      title: `Only ${h.sourceCount} review ${h.sourceCount === 1 ? "source is" : "sources are"} connected`,
      actionsSummary: "Reviews on Facebook, Yelp and TripAdvisor count too, and you cannot reply to what you cannot see. Connecting a source takes two minutes.",
      actions: [
        {
          label: "Connect Facebook and TripAdvisor.",
          text: "Connect Facebook and TripAdvisor. Facebook needs you to sign in once; TripAdvisor just needs your listing URL. New reviews from both land in the inbox.",
          links: [{ label: "Manage sources", goto: REPORT_SETTINGS }],
        },
      ],
    });
  }

  if (starter) {
    items.push({
      id: "showcase-unplaced",
      area: "reviews",
      severity: "low",
      title: "Your best reviews are not on your website yet",
      actionsSummary: "Three showcases are ready and none is placed. Reviews on your own site convert visitors who never look at Google.",
      actions: [
        {
          label: "Place a showcase on your site.",
          text: "Place a showcase on your site. Copy one line of code into the page where people decide, usually the home page or the booking page.",
          links: [{ label: "Open Review Showcase", goto: SHOWCASE }],
        },
      ],
    });
  }

  return items;
}
