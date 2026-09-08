/**
 * The AI summary for the Reviews hub: a few sentences about what happened
 * lately, with the numbers that matter set as metrics and coloured by
 * whether they are good news. Built from the location profile's `recent`
 * block, so every figure is authored per location and checkable.
 *
 * Bad numbers are promoted, not hidden (Ali, 9 Sep: "promote bad numbers
 * to say why"): a run of two-star reviews leads the summary when there is
 * one, and the reason follows in the same breath.
 */

import type { ReviewStats } from "@/lib/reviews-data";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "metric"; text: string; tone: "good" | "bad" | "neutral" };

/** Beacon's register for a line (see notes/beacon-voice.md): bad news in
 *  Brian, the warm default in Bea, a real win in Ray. Derived from tone
 *  today; the examples file will drive the wording later. */
export type Register = "brian" | "bea" | "ray";

export interface SummaryLine {
  segments: Segment[];
  tone: "good" | "bad" | "neutral";
  register?: Register;
}

export const registerFor = (tone: SummaryLine["tone"]): Register => (tone === "bad" ? "brian" : tone === "good" ? "ray" : "bea");

export interface ReviewSummary {
  headline: string;
  lines: SummaryLine[];
  tiles: { value: string; label: string; tone: "good" | "bad" | "neutral" }[];
}

const t = (text: string): Segment => ({ kind: "text", text });
const m = (text: string, tone: "good" | "bad" | "neutral" = "neutral"): Segment => ({ kind: "metric", text, tone });

export function reviewSummaryFor(s: ReviewStats, isStarter: boolean): ReviewSummary {
  const r = { lastN: s.lastN, lowCount: s.lowCount, lowStar: s.lowStar, monthChangePct: s.monthChangePct, fourPlusPct: s.fourPlusPct, spike: s.spike, theme: s.theme };
  const h = { rating: s.rating, allTime: s.inbox, fiveStar: String(s.fiveStar), reviews: s.total.toLocaleString("en-GB"), needReply: s.needReply };
  const lines: SummaryLine[] = [];

  if (isStarter) {
    return {
      headline: "Your first reviews are in, and they're good.",
      lines: [
        { tone: "good", segments: [t("Out of your first "), m(String(h.allTime)), t(" reviews, "), m(h.fiveStar, "good"), t(" were five stars. Nobody has had a reply yet. Did you know a reply within a day is the thing the next customer notices?")] },
        { tone: "neutral", segments: [t("You haven't asked anyone for a review yet. Businesses that ask get several times more than businesses that wait.")] },
      ],
      tiles: [
        { value: h.rating, label: "average rating", tone: "good" },
        { value: String(h.allTime), label: "reviews so far", tone: "neutral" },
        { value: "0", label: "replies sent", tone: "bad" },
      ],
    };
  }

  const win = s.recent;
  const winLabel = win.kind === "days" ? `last ${win.size} days` : `last ${win.size} reviews`;
  const drop = s.ratingValue - win.ratingValue;

  // Bad news first, with the why. The recent window is the number that
  // can move; the lifetime average barely does.
  if (drop >= 0.3 && win.ratingValue < 4.3) {
    lines.push({
      tone: "bad",
      segments: [t(`Your ${winLabel} average `), m(win.rating, "bad"), t(" against "), m(s.rating), t(" all time. That gap is the number to watch, and the one you can move.")],
    });
  }
  if (s.compare && s.compare.mentions > 0) {
    lines.push({
      tone: "bad",
      segments: [
        m(String(s.compare.mentions), "bad"), t(` of your last ${s.lastN} reviews compare ${s.compare.self} with your ${s.compare.label} branch, and not kindly. ${s.compare.label} is on `), m(s.compare.siblingRecentRating, "good"), t(` for the same period; ${s.compare.self} is on `), m(win.rating, "bad"), t(". Same brand, different experience: that is worth a visit."),
      ],
    });
  }
  if (r.lowCount >= 3) {
    lines.push({
      tone: "bad",
      segments: [
        t("Out of your last "), m(String(r.lastN)), t(" reviews, "), m(String(r.lowCount), "bad"), t(` were ${r.lowStar} stars or lower.`),
        ...(r.theme && !r.theme.good ? [t(" The thing they keep mentioning is "), m(r.theme.text, "bad"), t(".")] : []),
      ],
    });
    // The softener, which is also the instruction (Ali, 9 Sep: "did you
    // know things soften the blow as well as another way to say do this").
    lines.push({
      tone: "neutral",
      segments: [t("Did you know a calm reply reassures the next reader more than the review worried them? Answer those "), m(String(r.lowCount)), t(" this week and the rating follows.")],
    });
  } else if (r.lowCount > 0) {
    lines.push({
      tone: "neutral",
      segments: [t("Out of your last "), m(String(r.lastN)), t(" reviews, "), m(String(r.lowCount), "bad"), t(` ${r.lowCount === 1 ? "was" : "were"} ${r.lowStar} stars or lower`), ...(r.theme && !r.theme.good ? [t(", about "), m(r.theme.text, "bad"), t(".")] : [t(".")])],
    });
  }

  // The trend, and the spike if a campaign caused one.
  if (r.monthChangePct > 0) {
    lines.push({
      tone: "good",
      segments: [
        t("Your review velocity is up: "), m(`${r.monthChangePct}% more`, "good"), t(" reviews this month than last."),
        ...(r.spike
          ? [t(" You had a great spike on "), m(r.spike.date), t(`, the day your `), m(r.spike.campaign), t(` ${r.spike.channel} went out`), ...(r.spike.incentive ? [t(` with ${r.spike.incentive}`)] : []), t(".")]
          : []),
        t(" "), m(`${r.fourPlusPct}%`, r.fourPlusPct >= 70 ? "good" : "neutral"), t(" of them were four stars or above."),
        ...(r.fourPlusPct >= 70 ? [t(" Great work.")] : []),
      ],
    });
  } else if (r.monthChangePct < 0) {
    lines.push({
      tone: "bad",
      segments: [
        t("Your review velocity has dropped: "), m(`${Math.abs(r.monthChangePct)}% fewer`, "bad"), t(" reviews this month than last."),
        ...(r.spike
          ? [t(" Your last spike was on "), m(r.spike.date), t(`, when your `), m(r.spike.campaign), t(` ${r.spike.channel} went out`), ...(r.spike.incentive ? [t(` with ${r.spike.incentive}`)] : []), t(". Nothing has gone out since.")]
          : [t(" Nothing has gone out to ask for any.")]),
        t(" Only "), m(`${r.fourPlusPct}%`, "bad"), t(" of them were four stars or above."),
      ],
    });
  } else {
    lines.push({ tone: "neutral", segments: [t("Reviews received are level with last month. "), m(`${r.fourPlusPct}%`, r.fourPlusPct >= 70 ? "good" : "neutral"), t(" were four stars or above.")] });
  }

  if (r.theme?.good) {
    lines.push({ tone: "good", segments: [t("The thing customers keep praising is "), m(r.theme.text, "good"), t(". Worth saying in your replies, and on your website.")] });
  }

  const headline =
    s.compare && s.compare.mentions > 0
      ? `${s.compare.self} is falling behind ${s.compare.label}, and customers are saying so.`
      : r.lowCount >= 3
      ? "A run of low reviews needs your attention this week."
      : r.monthChangePct > 0
        ? "Reviews are up, and mostly for the right reasons."
        : "A quiet month. Time to ask.";

  return {
    headline,
    lines,
    tiles: [
      { value: win.rating, label: `rating, ${winLabel}`, tone: win.ratingValue >= 4.5 ? "good" : win.ratingValue < 4.0 ? "bad" : "neutral" },
      { value: `${r.monthChangePct > 0 ? "+" : ""}${r.monthChangePct}%`, label: "review velocity vs last month", tone: r.monthChangePct > 0 ? "good" : r.monthChangePct < 0 ? "bad" : "neutral" },
      { value: `${r.fourPlusPct}%`, label: "four stars or above", tone: r.fourPlusPct >= 70 ? "good" : r.fourPlusPct < 55 ? "bad" : "neutral" },
    ],
  };
}
