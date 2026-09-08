/**
 * The Reviews roadmap: BrightLocal's 12-month roadmap anatomy (a stage
 * goal, an outcome-led headline, a month rail, "Key tactics") applied to
 * one location's reviews. Three stages: this week (the plan Beacon
 * already gives on the hub), this month (what the Tracker, Builder and
 * Showcase strips ask for), and the next quarter (habits, judged against
 * the numbers the location has today). Every number comes from the rows.
 * No semicolons: high-school reading age, one idea per sentence.
 */

import type { ReviewStats } from "@/lib/reviews-data";
import type { Persona } from "@/lib/personas";
import { reviewPlanFor } from "@/lib/review-insights";
import { pageBeaconFor } from "@/lib/beacon-pages";

export interface RoadmapTactic {
  text: string;
  link?: { label: string; goto: string };
}

export interface RoadmapStage {
  id: string;
  rail: string;
  pill: string;
  goal: { text: string; mark: string };
  lede: string;
  tactics: RoadmapTactic[];
}

export function reviewRoadmapFor(stats: ReviewStats, persona: Persona): RoadmapStage[] {
  const plan = reviewPlanFor(stats, persona);
  const tracker = pageBeaconFor("tracker", stats, persona);
  const builder = pageBeaconFor("builder", stats, persona);
  const showcase = pageBeaconFor("showcase", stats, persona);
  const starter = persona.engagement === "new";

  const week: RoadmapStage = {
    id: "week",
    rail: "This week",
    pill: "Stage 1 goal",
    goal: plan.goal,
    lede: plan.lede,
    tactics: plan.items.flatMap((item) =>
      item.actions.map((a) => ({ text: a.label, link: a.links[0] })),
    ),
  };

  const month: RoadmapStage = {
    id: "month",
    rail: "This month",
    pill: "Stage 2 goal",
    goal: starter
      ? { text: "Get your first reviews coming in every week.", mark: "every week" }
      : { text: `Turn ${stats.thisMonth} reviews a month into a steady flow.`, mark: "a steady flow" },
    lede: starter
      ? "A campaign a week is enough to start. Ask the customers who left happy."
      : `You had ${stats.lastMonth} reviews last month and ${stats.thisMonth} so far this month. The aim is a number you can count on.`,
    tactics: [
      { text: builder.headline, link: builder.cta ? { label: builder.cta.label, goto: builder.cta.path } : undefined },
      { text: tracker.headline, link: tracker.cta ? { label: tracker.cta.label, goto: tracker.cta.path } : undefined },
      { text: showcase.headline, link: showcase.cta ? { label: showcase.cta.label, goto: showcase.cta.path } : undefined },
    ],
  };

  const waiting = stats.oldestWaitingDays;
  const quarter: RoadmapStage = {
    id: "quarter",
    rail: "Next quarter",
    pill: "Stage 3 goal",
    goal: { text: "Make reviews a habit, not a project.", mark: "a habit" },
    lede: "The businesses that win on reviews do the same small things every week. These are the three that matter for you.",
    tactics: [
      {
        text: waiting !== null && waiting > 2
          ? `Reply to every review within two days. Today the oldest has waited ${waiting} days.`
          : "Keep replying to every review within two days.",
      },
      {
        text: `Keep your last 30 days at ${stats.recent.rating} or better. Recent reviews are what the next customer sees first.`,
      },
      {
        text: stats.sourceCount < 3
          ? `Grow from ${stats.sourceCount} review sources to three. Customers look in more than one place.`
          : `Keep all ${stats.sourceCount} review sources connected, so nothing goes unanswered.`,
      },
    ],
  };

  return [week, month, quarter];
}
