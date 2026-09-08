"use client";

/**
 * SURFACE (Ali asked, 9 Sep): the gradient is ours, built from DS tokens
 * (green-50 to white to neutral-100) because the DS has no gradient or
 * "AI" surface. Logged as a proposal; swap for a DS surface if one ships.
 *
 * The AI summary, at the very top of the Reviews hub. Deliberately its
 * own thing (Ali, 9 Sep: "styled in its own specific way"): a soft brand
 * surface, a Poppins narrative with the numbers set as metrics, good
 * numbers on the green highlighter, bad numbers on a coral one, and
 * three metric tiles. Everything comes from lib/review-summary, which
 * reads the location profile, so the sentences agree with the pages.
 */

import * as React from "react";
import { Sparkles, Info, LoaderCircle } from "@brightlocal/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@brightlocal/ui-components/popover";
import { GlobeyCalmOpen1 } from "@brightlocal/illustrations";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { Button } from "@brightlocal/ui-components/button";
import { ArrowRight } from "@brightlocal/icons";
import { reviewSummaryFor, registerFor, type Segment } from "@/lib/review-summary";
import type { ReviewStats } from "@/lib/reviews-data";

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
  // The hint rides on hover (native title): what the number is, exactly.
  return (
    <mark
      className={`rounded-sm px-1 font-semibold text-inherit ${TONE_MARK[s.tone]} ${s.hint ? "cursor-help underline decoration-dotted decoration-1 underline-offset-4" : ""}`}
      title={s.hint}
    >
      {s.text}
    </mark>
  );
}

/**
 * "Tell me more" (Ali, 9 Sep): the info affordance on a metric opens a
 * popover that thinks for a moment, then shows a simple chart of the last
 * six months with a plain-English hover on every bar, and a sentence
 * about what it means here, for this location. Apple Health for reviews,
 * in miniature.
 */
export type Drill = "velocity" | "rating" | "fourPlus";

export function DrillChart({ stats, kind }: { stats: ReviewStats; kind: Drill }) {
  const months = stats.months;
  const values = months.map((mo) => (kind === "velocity" ? mo.count : kind === "rating" ? Number(mo.rating || 0) : mo.fourPlusPct));
  const max = Math.max(1, ...values);
  const min = kind === "rating" ? 1 : 0;
  const explain = (mo: ReviewStats["months"][number]) =>
    kind === "velocity"
      ? `${mo.label}: ${mo.count} review${mo.count === 1 ? "" : "s"} came in.`
      : kind === "rating"
        ? `${mo.label}: reviews that month averaged ${mo.rating || "no rating"}.`
        : `${mo.label}: ${mo.fourPlusPct}% of that month's reviews were four stars or above.`;
  return (
    <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Last six months">
      {months.map((mo, i) => {
        const v = values[i];
        const h = Math.max(4, Math.round(((v - min) / (max - min || 1)) * 80));
        const last = i === months.length - 1;
        return (
          <div key={mo.label} className="group flex flex-1 flex-col items-center gap-1" title={explain(mo)}>
            <div
              className={`w-full rounded-t-md transition-colors ${last ? "bg-[var(--ds-tailwind-colors-green-500)]" : "bg-[var(--ds-tailwind-colors-green-200)] group-hover:bg-[var(--ds-tailwind-colors-green-300)]"}`}
              style={{ height: `${h}px` }}
            />
            <span className="text-body-xs text-muted-foreground">{mo.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function drillCopy(stats: ReviewStats, kind: Drill): string {
  const m = stats.months;
  const last = m[m.length - 1];
  const prev = m[m.length - 2];
  const peak = m.reduce((a, b) => (b.count > a.count ? b : a), m[0]);
  if (kind === "velocity") {
    return `${last.count} reviews so far this month against ${prev.count} in ${prev.label}. Your busiest month was ${peak.label} with ${peak.count}${stats.spike ? `, and this month's spike on ${stats.spike.date} came from your ${stats.spike.campaign} ${stats.spike.channel}` : ""}. Volume and cadence over time is the number that tells you whether asking is working.`;
  }
  if (kind === "rating") {
    return `Month by month, new reviews averaged ${m.map((x) => x.rating || "none").join(", ")}. The lifetime average hardly moves; this is where you see change first.`;
  }
  return `The share of four-star-and-above reviews was ${m.map((x) => `${x.fourPlusPct}%`).join(", ")} across the six months. A dip here shows up in the rating weeks later.`;
}

function TellMeMore({ stats, kind, label, lines }: { stats: ReviewStats; kind: Drill; label: string; lines: { segments: Segment[] }[] }) {
  const [open, setOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!open) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t);
  }, [open]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-hook={`review-summary-more-${kind}`}
          aria-label={`Tell me more about ${label}`}
          className="text-muted-foreground hover:text-foreground inline-flex size-6 items-center justify-center rounded-full"
        >
          <Info className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent dataHook={`review-summary-more-${kind}-content`} align="end" className="w-80 p-4">
        {ready ? (
          <div className="flex flex-col gap-3">
            <p className="text-heading-subsection">{label.charAt(0).toUpperCase() + label.slice(1)}, last six months</p>
            {lines.map((line, i) => (
              <p key={i} className="text-body-sm font-display">
                {line.segments.map((sg, j) => (
                  <Seg key={j} s={sg} />
                ))}
              </p>
            ))}
            <DrillChart stats={stats} kind={kind} />
            <p className="text-body-sm text-muted-foreground">{drillCopy(stats, kind)}</p>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center gap-2 py-6 text-body-sm">
            <LoaderCircle className="size-4 animate-spin" />
            Looking at your reviews for {stats.compare?.self ?? "this location"}...
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function ReviewSummary({ full = false }: { full?: boolean }) {
  const persona = usePersona();
  const location = useLocationKey();
  const stats = statsFor(location, persona);
  const summary = reviewSummaryFor(stats, persona.engagement === "new");
  const cardLines = full ? summary.lines : summary.lines.filter((line) => !line.slot).slice(0, 2);
  const drillFor = (label: string): Drill | null =>
    label.startsWith("rating") ? "rating" : label.includes("velocity") ? "velocity" : label.includes("four stars") ? "fourPlus" : null;
  return (
    <section
      data-hook="review-summary"
      className="relative overflow-hidden rounded-[20px] border border-[var(--ds-tailwind-colors-green-200)] bg-[var(--ds-tailwind-colors-green-50)] px-6 py-6 lg:px-8 lg:py-7"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
        {/* Globey, the DS mascot, so this reads as Beacon speaking rather
            than a stat block. Same illustration family the empty states use. */}
        <div className="hidden shrink-0 lg:block" aria-hidden>
          <GlobeyCalmOpen1 className="h-28 w-auto" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="text-label-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--ds-tailwind-colors-green-700)]" data-hook="review-summary-label">
            <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-1.5 py-0.5 text-white">
              <span aria-hidden>✦</span> Beacon
            </span>
            <span>AI summary of your reviews, updated today</span>
          </p>
          <h2 className="text-heading-page font-display" data-hook="review-summary-headline">
            {summary.headline}
          </h2>
          <div className="flex flex-col gap-3">
            {cardLines.map((line, i) => (
              <p key={i} className="text-body font-display text-foreground max-w-[60ch]" data-hook={`review-summary-line-${i}`} data-register={line.register ?? registerFor(line.tone)}>
                {line.segments.map((s, j) => (
                  <Seg key={j} s={s} />
                ))}
              </p>
            ))}
          </div>
          <p className="text-body-xs text-muted-foreground" data-hook="review-summary-disclosure">
            Written by Beacon from this location's reviews. Hover a number for what it counts; the info icons hold the rest.
          </p>
        </div>
        <dl className="grid shrink-0 grid-cols-3 gap-3 lg:w-[22rem] lg:grid-cols-1" data-hook="review-summary-tiles">
          {summary.tiles.map((tile) => {
            const drill = drillFor(tile.label);
            return (
              <div key={tile.label} className="relative flex flex-col gap-0.5 rounded-xl bg-[var(--ds-tailwind-colors-base-white)]/80 px-4 py-3 backdrop-blur">
                <dd className={`text-metric font-display ${TONE_TEXT[tile.tone]}`}>{tile.value}</dd>
                <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
                {drill && !full && !persona.engagement.startsWith("new") ? (
                  <span className="absolute right-2 top-2">
                    <TellMeMore stats={stats} kind={drill} label={tile.label} lines={summary.lines.filter((l) => l.slot === drill)} />
                  </span>
                ) : null}
              </div>
            );
          })}
        </dl>
      </div>
      {full && !persona.engagement.startsWith("new") ? (
        <div className="mt-6 grid gap-4 border-t border-[var(--ds-tailwind-colors-green-200)] pt-6 md:grid-cols-3" data-hook="review-summary-charts">
          {(["rating", "velocity", "fourPlus"] as Drill[]).map((kind) => (
            <div key={kind} className="flex flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-base-white)]/80 p-4">
              <p className="text-heading-subsection">
                {kind === "rating" ? "Rating" : kind === "velocity" ? "Review velocity" : "Four stars or above"}, last six months
              </p>
              <DrillChart stats={stats} kind={kind} />
              <p className="text-body-xs text-muted-foreground">{drillCopy(stats, kind)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/**
 * The compact strip for a page: Beacon badge, the headline, the one line,
 * three small metrics, and a button into the modal for the full thing.
 */
export function ReviewSummaryStrip() {
  const persona = usePersona();
  const location = useLocationKey();
  const { show } = useBeaconModal();
  const stats = statsFor(location, persona);
  const summary = reviewSummaryFor(stats, persona.engagement === "new");
  const lead = summary.lines.find((line) => !line.slot);
  return (
    <section
      data-hook="review-summary-strip"
      className="flex flex-col gap-4 rounded-[20px] border border-[var(--ds-tailwind-colors-green-200)] bg-[var(--ds-tailwind-colors-green-50)] px-5 py-4 lg:flex-row lg:items-center lg:gap-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-label-sm flex items-center gap-2 text-[var(--ds-tailwind-colors-green-700)]">
          <span className="inline-flex items-center gap-1 rounded-sm bg-[var(--ds-tailwind-colors-neutral-950)] px-1.5 py-0.5 text-white">
            <span aria-hidden>✦</span> Beacon
          </span>
          <span>AI summary, updated today</span>
        </p>
        <p className="text-heading-subsection font-display" data-hook="review-summary-strip-headline">{summary.headline}</p>
        {lead ? (
          <p className="text-body-sm font-display text-foreground max-w-[70ch]">
            {lead.segments.map((sg, j) => (
              <Seg key={j} s={sg} />
            ))}
          </p>
        ) : null}
      </div>
      <dl className="flex shrink-0 flex-wrap gap-x-5 gap-y-1" data-hook="review-summary-strip-tiles">
        {summary.tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col">
            <dd className={`text-heading-section font-display ${TONE_TEXT[tile.tone]}`}>{tile.value}</dd>
            <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
          </div>
        ))}
      </dl>
      <Button variant="outline" size="sm" dataHook="review-summary-strip-open" className="shrink-0" onClick={() => show("summary")}>
        Read the full summary
        <ArrowRight className="size-4" />
      </Button>
    </section>
  );
}

/**
 * The smallest size: a chip of a few words with the Beacon sigil, for a
 * card or a row. `what` picks the plan's goal or the summary's lead fact.
 * Informational on purpose: inside a card that navigates, the card's own
 * link wins, and the Manager and the modal carry the rest.
 */
export function BeaconChip({ text, tone = "neutral", dataHook = "beacon-chip" }: { text: string; tone?: "good" | "bad" | "neutral"; dataHook?: string }) {
  const bg = tone === "bad" ? "bg-[var(--ds-tailwind-colors-red-100)]" : tone === "good" ? "bg-[var(--ds-tailwind-colors-green-200)]" : "bg-[var(--ds-tailwind-colors-neutral-100)]";
  return (
    <span data-hook={dataHook} className={`text-label-sm inline-flex w-fit items-center gap-1.5 rounded-sm px-2 py-0.5 font-display ${bg} text-[var(--ds-tailwind-colors-neutral-950)]`}>
      <span aria-hidden className="text-[var(--ds-tailwind-colors-green-700)]">✦</span>
      {text}
    </span>
  );
}
