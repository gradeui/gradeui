"use client";

/**
 * The AI summary, at the very top of the Reviews hub. Deliberately its
 * own thing (Ali, 9 Sep: "styled in its own specific way"): a soft brand
 * surface, a Poppins narrative with the numbers set as metrics, good
 * numbers on the green highlighter, bad numbers on a coral one, and
 * three metric tiles. Everything comes from lib/review-summary, which
 * reads the location profile, so the sentences agree with the pages.
 */

import { Sparkles } from "@brightlocal/icons";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { reviewSummaryFor, type Segment } from "@/lib/review-summary";

const TONE_MARK: Record<string, string> = {
  good: "bg-[var(--ds-tailwind-colors-green-200)]",
  bad: "bg-[var(--ds-tailwind-colors-red-100)]",
  neutral: "bg-[var(--ds-tailwind-colors-neutral-100)]",
};
const TONE_TEXT: Record<string, string> = {
  good: "text-[var(--ds-tailwind-colors-green-700)]",
  bad: "text-[var(--ds-tailwind-colors-red-600)]",
  neutral: "text-foreground",
};

function Seg({ s }: { s: Segment }) {
  if (s.kind === "text") return <>{s.text}</>;
  return (
    <mark className={`rounded-sm px-1 font-semibold text-inherit ${TONE_MARK[s.tone]}`}>{s.text}</mark>
  );
}

export function ReviewSummary() {
  const persona = usePersona();
  const location = useLocationKey();
  const summary = reviewSummaryFor(statsFor(location, persona), persona.engagement === "new");
  return (
    <section
      data-hook="review-summary"
      className="relative overflow-hidden rounded-[20px] border border-[var(--ds-tailwind-colors-green-200)] bg-[linear-gradient(135deg,var(--ds-tailwind-colors-green-50),var(--ds-tailwind-colors-base-white)_55%,var(--ds-tailwind-colors-violet-100))] px-6 py-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="text-label-sm flex items-center gap-1.5 text-[var(--ds-tailwind-colors-violet-600)]" data-hook="review-summary-label">
            <Sparkles className="size-3.5" />
            AI summary, updated today
          </p>
          <h2 className="text-heading-page font-display" data-hook="review-summary-headline">
            {summary.headline}
          </h2>
          <div className="flex flex-col gap-3">
            {summary.lines.map((line, i) => (
              <p key={i} className="font-display text-lg leading-8 text-foreground max-w-[60ch]" data-hook={`review-summary-line-${i}`}>
                {line.segments.map((s, j) => (
                  <Seg key={j} s={s} />
                ))}
              </p>
            ))}
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-3 gap-3 lg:w-[22rem] lg:grid-cols-1" data-hook="review-summary-tiles">
          {summary.tiles.map((tile) => (
            <div key={tile.label} className="flex flex-col gap-0.5 rounded-xl bg-[var(--ds-tailwind-colors-base-white)]/80 px-4 py-3 backdrop-blur">
              <dd className={`text-metric font-display ${TONE_TEXT[tile.tone]}`}>{tile.value}</dd>
              <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
