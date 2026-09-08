/**
 * First-run content for the empty persona (signed up, nothing connected).
 * The anatomy is brightlocal.com's "Why it matters" band: a small pill, a
 * big headline, one plain sentence, then three sourced statistics. Then
 * ONE action, in the product's own order: connect review sites, ask for
 * reviews, then reply and showcase. Stats are quoted from the site with
 * the source it cites, so every number is citable (Ali's rule for any
 * industry figure). The site's word is "review sites", never sources.
 */

import type { NuggetPage } from "@/lib/beacon-pages";

export interface FirstRunStat {
  value: string;
  text: string;
  source: string;
  /** Keywords for pickIllustration (lib/illustrations). */
  art: string[];
}

export interface FirstRun {
  headline: string;
  lede: string;
  stats: FirstRunStat[];
  action: { label: string; goto: string; note: string };
  step: 1 | 2 | 3;
}

const GOTO = {
  reportSettings: "screen:dmtkj124xagqa",
  builder: "screen:dmt094j963aye",
  manager: "screen:dmsxf5zjggd0n",
  showcase: "screen:dmt094lhmpwbs",
};

/** Quoted from brightlocal.com (10 Sep 2026) with the sources it names. */
export const STATS = {
  visit: { value: "76%", text: "of nearby mobile searches result in a business visit within 24 hours.", source: "Think with Google", art: ["visit", "nearby"] },
  responses: { value: "100+", text: "reviews paired with regular responses significantly boost rankings in Google Maps and local search.", source: "WiserReview", art: ["reply", "responses"] },
  inconsistent: { value: "62%", text: "of consumers will avoid a local business if they find incorrect or inconsistent information online.", source: "BrightLocal", art: ["inconsistent", "check"] },
  twenty: { value: "47%", text: "of consumers won't use a business that has fewer than 20 reviews.", source: "BrightLocal Local Consumer Review Survey", art: ["reviews", "stars"] },
  threeMonths: { value: "74%", text: "only care about reviews written in the last three months.", source: "BrightLocal Local Consumer Review Survey", art: ["recent", "months"] },
};

export function firstRunFor(page: NuggetPage): FirstRun {
  switch (page) {
    case "hub":
      return {
        headline: "The power of first impressions.",
        lede: "Most customers read your reviews before they ever call. Connect the review sites you are on and everything written about you lands here.",
        stats: [STATS.visit, STATS.twenty, STATS.threeMonths],
        action: { label: "Connect Google Business Profile", goto: GOTO.reportSettings, note: "Google first: it is where most reviews live, and the one you can reply to from here. Facebook and 80+ other review sites come next." },
        step: 1,
      };
    case "manager":
      return {
        headline: "Nothing to reply to yet.",
        lede: "Connect a review site and anything already written about you appears here within a day, ready to answer.",
        stats: [STATS.responses, STATS.threeMonths, STATS.visit],
        action: { label: "Connect a review site", goto: GOTO.reportSettings, note: "Google and Facebook reviews can be answered without leaving BrightLocal." },
        step: 1,
      };
    case "tracker":
      return {
        headline: "This chart starts moving the day you ask.",
        lede: "Tracking shows you the trend across every review site. Right now there is nothing to track, so the first job is to get reviews coming in.",
        stats: [STATS.twenty, STATS.threeMonths, STATS.inconsistent],
        action: { label: "Ask for your first reviews", goto: GOTO.builder, note: "A branded email, an SMS, or a QR code at the till. Pick one and send it to a few happy customers." },
        step: 2,
      };
    case "builder":
      return {
        headline: "Your first review request takes five minutes.",
        lede: "Businesses that ask get several times more reviews than businesses that wait. Start with the customers who left happy this week.",
        stats: [STATS.twenty, STATS.visit, STATS.responses],
        action: { label: "Create your first campaign", goto: GOTO.builder, note: "Email, SMS, or a QR code. Drip campaigns nudge customers at the right time once you have a list." },
        step: 2,
      };
    case "showcase":
      return {
        headline: "Something worth showing is coming.",
        lede: "Once reviews arrive, the best of them can sit on your website and win the next customer. Until then, here is what it will look like.",
        stats: [STATS.twenty, STATS.threeMonths, STATS.visit],
        action: { label: "Ask for your first reviews", goto: GOTO.builder, note: "The showcase fills itself from the reviews you choose." },
        step: 3,
      };
  }
}

export const FIRST_RUN_STEPS: { step: 1 | 2 | 3; label: string; goto: string }[] = [
  { step: 1, label: "Connect your review sites", goto: GOTO.reportSettings },
  { step: 2, label: "Ask customers for reviews", goto: GOTO.builder },
  { step: 3, label: "Reply, then show the best", goto: GOTO.manager },
];
