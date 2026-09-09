/**
 * The deck: the same story as the walkthrough videos, told as a PDF
 * (Ali, 12 Sep: "much more visual, insights only, with the cut scenes
 * being PDF pages of headers, at a standard PDF size").
 *
 * A4 landscape, so it drops into Figma Slides, a deck, or an email. Every
 * page is built from the same libraries the product renders from, so the
 * numbers in the PDF are the numbers on the screen.
 */

import type { Persona } from "@/lib/personas";
import type { ReviewStats } from "@/lib/reviews-data";
import { reviewSummaryFor, type Segment } from "@/lib/review-summary";
import { reviewPlanFor } from "@/lib/review-insights";
import { pageBeaconFor, type BeaconPage } from "@/lib/beacon-pages";
import { STATS } from "@/lib/first-run";
import { cardFor, type CardSpec } from "@/lib/cards";

export type DeckPage =
  | { kind: "card"; card: CardSpec }
  | {
      kind: "insight";
      eyebrow: string;
      headline: string;
      segments?: Segment[];
      body?: string;
      tiles?: { value: string; label: string }[];
      chart?: "rating" | "velocity" | "fourPlus";
      art: string[];
      surface?: string;
    }
  | { kind: "fact"; value: string; text: string; source: string; line: string; art: string[] };

export function deckFor(persona: Persona, stats: ReviewStats, locationName: string): DeckPage[] {
  const pages: DeckPage[] = [];
  const summary = reviewSummaryFor(stats, persona.engagement === "new");
  const plan = reviewPlanFor(stats, persona);
  const card = (slug: string) => {
    const c = cardFor(slug);
    if (c) pages.push({ kind: "card", card: c });
  };

  card("beacon");

  // Where this location stands.
  pages.push({
    kind: "insight",
    eyebrow: `${locationName} · this month`,
    headline: summary.headline,
    segments: summary.lines[0]?.segments,
    tiles: summary.tiles.map((t) => ({ value: t.value, label: t.label })),
    art: ["review", "stars"],
  });
  if (summary.lines[1]) {
    pages.push({
      kind: "insight",
      eyebrow: "What is behind it",
      headline: "The detail underneath the number",
      segments: summary.lines[1].segments,
      art: ["idea", "tip"],
    });
  }

  // The plan.
  card("manager");
  pages.push({
    kind: "insight",
    eyebrow: "This week's goal",
    headline: plan.goal.text,
    body: plan.lede,
    tiles: [
      { value: String(stats.needReply), label: "need a reply" },
      { value: String(stats.replied), label: "replied" },
      { value: stats.oldestWaitingDays === null ? "0" : String(stats.oldestWaitingDays), label: "days the oldest has waited" },
    ],
    art: ["reply", "answer"],
  });
  for (const item of plan.items.slice(0, 2)) {
    pages.push({ kind: "insight", eyebrow: "Key tactic", headline: item.title, body: item.actionsSummary, art: ["fix", "win"] });
  }

  // The trend.
  card("tracker");
  const tracker = pageBeaconFor("tracker" as BeaconPage, stats, persona);
  pages.push({
    kind: "insight",
    eyebrow: "Review Tracker",
    headline: tracker.headline,
    segments: tracker.line,
    tiles: tracker.tiles,
    chart: "velocity",
    art: ["velocity", "spike"],
  });
  pages.push({ kind: "insight", eyebrow: "The last six months", headline: "Rating, month by month", body: tracker.more ?? "", chart: "rating", art: ["rating", "star"] });

  // Asking, and showing.
  card("builder");
  const builder = pageBeaconFor("builder" as BeaconPage, stats, persona);
  pages.push({ kind: "insight", eyebrow: "Review Builder", headline: builder.headline, segments: builder.line, tiles: builder.tiles, art: ["campaign", "email"] });
  pages.push({ kind: "fact", ...STATS.twenty, line: "Asking is the only thing that moves this. One campaign a month keeps the recent window full.", art: ["reviews", "stars"] });

  card("showcase");
  const showcase = pageBeaconFor("showcase" as BeaconPage, stats, persona);
  pages.push({ kind: "insight", eyebrow: "Review Showcase", headline: showcase.headline, segments: showcase.line, tiles: showcase.tiles, art: ["website", "widget"] });
  pages.push({ kind: "fact", ...STATS.spend, line: "The people reading reviews on your own site are the ones deciding right now.", art: ["website", "trust"] });

  card("end");
  return pages;
}
