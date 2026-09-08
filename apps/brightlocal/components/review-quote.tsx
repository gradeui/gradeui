"use client";

/**
 * A review as a testimonial band, the anatomy of brightlocal.com's own
 * quote bands (Ali, 10 Sep): a tinted surface, one of the DS
 * illustrations top-left, the quote big and bold, then who said it and
 * where. Three picks from the location's own rows, so it is always
 * true: the best recent review, the worst recent review, and the one
 * that has waited longest for a reply. Every band ends with the thing
 * to do about it.
 */

import { SpeechBubbleReviewsStarsComment, HandThumbsDownBad, ClockTimeAlarm } from "@brightlocal/illustrations";
import { Button } from "@brightlocal/ui-components/button";
import { ArrowRight } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { reviewsFor, type Review } from "@/lib/reviews-data";

export type QuoteKind = "best" | "worst" | "waiting";

const SOURCE_LABEL: Record<string, string> = { google: "Google", facebook: "Facebook", tripadvisor: "TripAdvisor", yelp: "Yelp", trustpilot: "Trustpilot", yahoo: "Yahoo", apple: "Apple Maps", bing: "Bing" };

function stars(r: Review): number {
  return typeof r.rating === "number" ? r.rating : r.rating === "up" ? 5 : 1;
}

export function pickQuote(reviews: Review[], kind: QuoteKind): Review | null {
  const worded = reviews.filter((r) => r.text.length > 40);
  if (kind === "waiting") {
    const waiting = worded.filter((r) => r.status === "needs");
    return waiting.sort((a, b) => b.daysAgo - a.daysAgo)[0] ?? null;
  }
  const recent = worded.filter((r) => r.daysAgo <= 60);
  const pool = recent.length ? recent : worded;
  const sorted = [...pool].sort((a, b) =>
    kind === "best" ? stars(b) - stars(a) || b.text.length - a.text.length : stars(a) - stars(b) || b.text.length - a.text.length,
  );
  return sorted[0] ?? null;
}

const META: Record<QuoteKind, { label: string; Art: React.ComponentType<{ className?: string }>; surface: string; cta: string }> = {
  best: { label: "Your best recent review", Art: SpeechBubbleReviewsStarsComment, surface: "bg-[var(--ds-tailwind-colors-sky-100)]", cta: "Put it on your website" },
  worst: { label: "The review that needs you most", Art: HandThumbsDownBad, surface: "bg-[var(--ds-tailwind-colors-yellow-100)]", cta: "Reply to it" },
  waiting: { label: "Waiting longest for a reply", Art: ClockTimeAlarm, surface: "bg-[var(--ds-tailwind-colors-yellow-100)]", cta: "Reply now" },
};

export function ReviewQuoteBand({ kind, goto }: { kind: QuoteKind; goto: string }) {
  const persona = usePersona();
  const location = useLocationKey();
  const review = pickQuote(reviewsFor(location, persona), kind);
  if (!review) return null;
  const { label, Art, surface, cta } = META[kind];
  const when = review.daysAgo === 0 ? "today" : review.daysAgo === 1 ? "yesterday" : `${review.daysAgo} days ago`;
  const rating = typeof review.rating === "number" ? `${review.rating} star${review.rating === 1 ? "" : "s"}` : review.rating === "up" ? "Recommends" : "Does not recommend";
  return (
    <figure data-hook={`review-quote-${kind}`} className={`flex flex-col gap-6 rounded-[20px] px-8 py-8 lg:px-10 ${surface}`}>
      <div className="flex items-center gap-3">
        <Art className="size-14 shrink-0" />
        <figcaption className="text-label-sm text-muted-foreground">{label}</figcaption>
      </div>
      <blockquote className="text-heading-section font-display max-w-[60ch] text-balance">“{review.text}”</blockquote>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-body font-semibold">{review.name}</p>
          <p className="text-body-sm text-muted-foreground">{rating} on {SOURCE_LABEL[review.source] ?? review.source}, {when}</p>
        </div>
        <span data-grade-goto={goto}>
          <Button variant="outline" size="sm" dataHook={`review-quote-${kind}-cta`}>
            {cta}
            <ArrowRight className="size-4" />
          </Button>
        </span>
      </div>
    </figure>
  );
}
