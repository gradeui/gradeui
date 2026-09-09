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
import Link from "next/link";
import { Sparkles, Info, LoaderCircle } from "@brightlocal/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@brightlocal/ui-components/popover";
import { GlobeyCalmOpen1 } from "@brightlocal/illustrations";
import { ChartContainer, ChartTooltip, ChartTooltipContent, Bar, BarChart, XAxis, Cell } from "@brightlocal/ui-components/chart";
import { LabelList, YAxis } from "recharts";
import { usePersona } from "@/lib/demo";
import { useLocationKey } from "@/lib/location";
import { statsFor } from "@/lib/reviews-data";
import { useBeaconModal } from "@/lib/beacon-modal";
import { reviewsFor } from "@/lib/reviews-data";
import { STATS } from "@/lib/first-run";
import { pickIllustration } from "@/lib/illustrations";
import { Rating } from "@brightlocal/ui-components/rating";
import { SITE_MARK, SITE_LABEL } from "@/components/site-marks";
import { Lightbulb } from "@brightlocal/icons";
import { FirstRunBand } from "@/components/first-run";
import { Button } from "@brightlocal/ui-components/button";
import { ArrowRight } from "@brightlocal/icons";
import { reviewSummaryFor, registerFor, type Segment } from "@/lib/review-summary";
import type { ReviewStats } from "@/lib/reviews-data";
import { pageBeaconFor, type BeaconPage } from "@/lib/beacon-pages";
import { hrefFor } from "@/lib/screens";
import { useRouter } from "next/navigation";

// NEUTRAL ONLY (Ali, 9 Sep: "stop highlighting numbers with red and
// green"). The words carry the judgement; the marks just say "this is a
// number". Tone stays on the data for anything that wants it later.
const TONE_MARK: Record<string, string> = {
  good: "bg-[var(--ds-tailwind-colors-neutral-200)]",
  bad: "bg-[var(--ds-tailwind-colors-neutral-200)]",
  neutral: "bg-[var(--ds-tailwind-colors-neutral-200)]",
};
const TONE_TEXT: Record<string, string> = {
  good: "text-foreground",
  bad: "text-foreground",
  neutral: "text-foreground",
};

/** THE Beacon badge, one shape everywhere: outlined, the word alone. A badge can be a link (Ali, 9 Sep):
 *  with `beta` it carries a "Beta" tail and opens the Beacon notes, where
 *  "learn more" and "give us feedback" live. */
export function BeaconBadge({ dataHook = "beacon-badge", beta = false }: { dataHook?: string; beta?: boolean }) {
  // No icon (Ali, 9 Sep): the word is the mark.
  const inner = (
    <>
      Beacon
      {beta ? <span className="text-muted-foreground border-l pl-1.5">Beta</span> : null}
    </>
  );
  const cls = "text-label-sm inline-flex items-center gap-1.5 rounded-sm border bg-[var(--ds-tailwind-colors-base-white)] px-1.5 py-0.5 text-foreground";
  if (beta) {
    return (
      <Link href="/docs/beacon-notes" data-hook={dataHook} className={`${cls} hover:bg-[var(--ds-tailwind-colors-neutral-50)]`} title="What Beacon is, and how to give feedback">
        {inner}
      </Link>
    );
  }
  return (
    <span data-hook={dataHook} className={cls}>
      {inner}
    </span>
  );
}

function Seg({ s }: { s: Segment }) {
  if (s.kind === "text") return <>{s.text}</>;
  // The hint rides on hover (native title): what the number is, exactly.
  // Short marks (a number, a date) never wrap: "3 Sep" split across lines
  // reads wrong (Ali, 9 Sep). Phrases still wrap.
  const nowrap = s.text.length <= 16 ? "whitespace-nowrap" : "";
  return (
    <mark
      className={`rounded-sm px-1 font-semibold text-inherit ${TONE_MARK[s.tone]} ${nowrap} ${s.hint ? "cursor-help underline decoration-dotted decoration-1 underline-offset-4" : ""}`}
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

export function DrillChart({ stats, kind, onTint = false }: { stats: ReviewStats; kind: Drill; onTint?: boolean }) {
  // The DS Chart (recharts underneath), the same one the Tracker draws
  // with (Ali, 9 Sep: "are those charts recharts?"). Neutral bars, the
  // current month in the accent, a plain-English tooltip per bar.
  const data = stats.months.map((mo) => ({
    month: mo.label,
    value: kind === "velocity" ? mo.count : kind === "rating" ? Number(mo.rating || 0) : mo.fourPlusPct,
    explain:
      kind === "velocity"
        ? `${mo.count} review${mo.count === 1 ? "" : "s"} came in.`
        : kind === "rating"
          ? `Reviews that month averaged ${mo.rating || "no rating"}.`
          : `${mo.fourPlusPct}% of that month's reviews were four stars or above.`,
  }));
  const config = { value: { label: kind === "velocity" ? "Reviews" : kind === "rating" ? "Rating" : "Four stars or above" } };
  // THE NUMBERS SIT ON THE BARS, not in the prose (Ali, 11 Sep). A floor on
  // the rating and four-plus axes so six near-identical months show their
  // differences: ratings live between 3 and 5, four-plus between 50 and 100.
  const domain: [number, number] | undefined = kind === "rating" ? [3, 5] : kind === "fourPlus" ? [50, 100] : undefined;
  const fmt = (v: unknown) => (kind === "rating" ? Number(v).toFixed(1) : kind === "fourPlus" ? `${v}%` : String(v));
  return (
    <ChartContainer config={config} className="h-32 w-full" dataHook={`beacon-chart-${kind}`}>
      <BarChart data={data} margin={{ top: 18, right: 0, left: 0, bottom: 0 }} barCategoryGap={6}>
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} fontSize={12} />
        <YAxis hide domain={domain} />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(label: unknown, payload: unknown[]) => `${String(label)}: ${(payload?.[0] as { payload?: { explain?: string } } | undefined)?.payload?.explain ?? ""}`}
              formatter={() => null}
            />
          }
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={d.month} fill={i === data.length - 1 ? "var(--ds-tailwind-colors-green-500)" : onTint ? "var(--ds-tailwind-colors-base-white)" : "var(--ds-tailwind-colors-neutral-200)"} />
          ))}
          <LabelList dataKey="value" position="top" fontSize={12} formatter={fmt} className="fill-foreground" />
        </Bar>
      </BarChart>
    </ChartContainer>
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
    const first = m.find((x) => x.rating);
    const dir = first && last.rating ? (Number(last.rating) < Number(first.rating) - 0.1 ? "has slipped since" : Number(last.rating) > Number(first.rating) + 0.1 ? "has climbed since" : "has held steady since") : "is";
    return `The average of each month's new reviews ${dir} ${first?.label ?? "the spring"}. The lifetime average hardly moves. This is where you see change first.`;
  }
  const lowest = m.reduce((a, b) => (b.fourPlusPct < a.fourPlusPct ? b : a), m[0]);
  return `${lowest.label} was the weakest month for four-star-and-above reviews. A dip here shows up in the rating weeks later.`;
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
              <p key={i} className="text-body-sm">
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

export function ReviewSummary({ full = false, bare = false, tilesRow = false }: { full?: boolean; bare?: boolean; tilesRow?: boolean }) {
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
      className={bare ? "relative" : "relative overflow-hidden rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] px-6 py-6 shadow-sm lg:px-8 lg:py-7"}
    >
      <div className={tilesRow ? "flex flex-col gap-5" : "flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10"}>
        {/* Globey, the DS mascot, so this reads as Beacon speaking rather
            than a stat block. Same illustration family the empty states use. */}
        {/* No body illustration in the dialog: its header carries one (the
            trial recap's format, Ali's preferred one, 10 Sep). */}
        {bare ? null : (
          <div className="hidden shrink-0 lg:block" aria-hidden>
            <GlobeyCalmOpen1 className="h-28 w-auto" />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {/* In the dialog the header already carries the badge and the
              title, so no eyebrow line at all (Ali, 11 Sep). */}
          {bare ? null : (
            <p className="text-label-sm flex flex-wrap items-center gap-x-2 gap-y-1" data-hook="review-summary-label">
              <BeaconBadge beta />
              <span className="text-muted-foreground">AI summary of your reviews, updated today</span>
            </p>
          )}
          <h2 className="text-metric font-display text-balance" data-hook="review-summary-headline">
            {summary.headline}
          </h2>
          <div className="flex flex-col gap-3">
            {cardLines.map((line, i) => (
              <p key={i} className="text-body text-foreground max-w-[60ch] text-pretty" data-hook={`review-summary-line-${i}`} data-register={line.register ?? registerFor(line.tone)}>
                {line.segments.map((s, j) => (
                  <Seg key={j} s={s} />
                ))}
              </p>
            ))}
          </div>
          <p className={tilesRow ? "hidden" : "text-body-xs text-muted-foreground"} data-hook="review-summary-disclosure">
            Written by Beacon from this location's reviews. Hover a number for what it counts; the info icons hold the rest.
          </p>
        </div>
        {tilesRow ? null : (
        <dl className="grid shrink-0 grid-cols-3 gap-3 lg:w-[22rem] lg:grid-cols-1" data-hook="review-summary-tiles">
          {summary.tiles.map((tile) => {
            const drill = drillFor(tile.label);
            return (
              <div key={tile.label} className="relative flex flex-col gap-0.5 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] px-4 py-3">
                <dd className={`text-metric ${TONE_TEXT[tile.tone]}`}>{tile.value}</dd>
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
        )}
      </div>
      {full && !bare && !persona.engagement.startsWith("new") ? <SummaryCharts stats={stats} /> : null}
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
  if (persona.engagement === "empty") return <FirstRunBand page="hub" />;
  // A small data set gets the guide and the nugget, not a summary strip
  // on top (Ali, 11 Sep: "a bit much, just the getting started with a small
  // did you know").
  if (persona.engagement === "new") return null;
  return (
    <section
      data-hook="review-summary-strip"
      className="flex flex-col gap-6 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] p-8 shadow-sm lg:flex-row lg:items-stretch lg:gap-10"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-label-sm flex items-center gap-2">
          <BeaconBadge beta />
          <span className="text-muted-foreground">AI summary, updated today</span>
        </p>
        <p className="text-metric font-display max-w-[40ch] text-balance" data-hook="review-summary-strip-headline">{summary.headline}</p>
        {lead ? (
          <p className="text-body text-foreground max-w-[60ch] text-pretty">
            {lead.segments.map((sg, j) => (
              <Seg key={j} s={sg} />
            ))}
          </p>
        ) : null}
        {/* "Tell me more" first, the CTA second (Ali, 10 Sep). */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <Button variant="outline" size="sm" dataHook="review-summary-strip-open" onClick={() => show("summary")}>
            Tell me more
          </Button>
          <span data-grade-goto={stats.needReply > 0 ? "screen:dmsxf5zjggd0n" : "screen:dmt094j963aye"}>
            <Button variant="primary" size="sm" dataHook="review-summary-strip-cta">
              {stats.needReply > 0 ? `Reply to your ${stats.needReply} waiting ${stats.needReply === 1 ? "review" : "reviews"}` : "Create a campaign"}
              <ArrowRight className="size-4" />
            </Button>
          </span>
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-3 gap-6 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] p-6 lg:w-72 lg:grid-cols-1 lg:gap-5" data-hook="review-summary-strip-tiles">
        {summary.tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col">
            <dd className={`text-metric ${TONE_TEXT[tile.tone]}`}>{tile.value}</dd>
            <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
          </div>
        ))}
      </dl>
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
  const persona = usePersona();
  if (persona.engagement === "empty") return null; // nothing to say yet: the first-run band carries the page
  const bg = "bg-[var(--ds-tailwind-colors-base-white)]"; // neutral whatever the tone (Ali, 9 Sep); same outline as the badge
  return (
    <span data-hook={dataHook} className={`text-label-sm inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 ${bg} text-foreground`}>
      <Sparkles aria-hidden className="size-3.5 text-[var(--ds-tailwind-colors-green-500)]" />
      {text}
    </span>
  );
}

/**
 * The medium strip for a working page (Tracker, Builder, Showcase): the
 * page's own Beacon line and three metrics, same modal behind it.
 */
export function BeaconPageStrip({ page }: { page: BeaconPage }) {
  const persona = usePersona();
  const location = useLocationKey();
  const router = useRouter();
  const { show } = useBeaconModal();
  const stats = statsFor(location, persona);
  const b = pageBeaconFor(page, stats, persona);
  if (persona.engagement === "empty") return <FirstRunBand page={page} />;
  return (
    <section
      data-hook={`beacon-strip-${page}`}
      className="flex flex-col gap-6 rounded-[20px] border bg-[var(--ds-tailwind-colors-base-white)] p-8 shadow-sm lg:flex-row lg:items-stretch lg:gap-10"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-label-sm flex items-center gap-2">
          <BeaconBadge beta />
          <span className="text-muted-foreground">From this location's reviews, updated today</span>
        </p>
        <p className="text-metric font-display max-w-[40ch] text-balance" data-hook={`beacon-strip-${page}-headline`}>{b.headline}</p>
        <p className="text-body text-foreground max-w-[60ch] text-pretty">
          {b.line.map((sg, j) => (
            <Seg key={j} s={sg} />
          ))}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <Button variant="outline" size="sm" dataHook={`beacon-strip-${page}-open`} onClick={() => show("summary", page)}>
            Tell me more
          </Button>
          {b.cta ? (
            <Button variant="primary" size="sm" dataHook={`beacon-strip-${page}-cta`} onClick={() => router.push(hrefFor({ path: b.cta!.path, scope: "location" }, location))}>
              {b.cta.label}
              <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <dl className="grid shrink-0 grid-cols-3 gap-6 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] p-6 lg:w-72 lg:grid-cols-1 lg:gap-5">
        {b.tiles.map((tile) => (
          <div key={tile.label} className="flex flex-col">
            <dd className="text-metric text-foreground">{tile.value}</dd>
            <dt className="text-body-xs text-muted-foreground">{tile.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The page's own Beacon block, leading the modal when it was opened
 *  from that page: headline and line, no chrome. */
export function BeaconPageBlock({ page }: { page: BeaconPage }) {
  const persona = usePersona();
  const location = useLocationKey();
  const b = pageBeaconFor(page, statsFor(location, persona), persona);
  return (
    <div className="flex flex-col gap-3" data-hook={`beacon-page-block-${page}`}>
      {/* No eyebrow (Ali, 11 Sep: "classic AI eyebrows"); the header names the page. */}
      <p className="text-metric font-display text-balance max-w-[40ch]">{b.headline}</p>
      <p className="text-body text-foreground max-w-[60ch] text-pretty">
        {b.line.map((sg, j) => (
          <Seg key={j} s={sg} />
        ))}
      </p>
    </div>
  );
}

/** The three six-month charts, on their own so the modal can show them
 *  under a page's block without the general summary. */
/** True when the location has fewer than three months of reviews: the
 *  dialog then runs a Did you know up its right side instead of charts. */
export function isEarlyDays(stats: ReviewStats): boolean {
  return stats.months.filter((m) => m.count > 0).length < 3;
}

export function SummaryCharts({ stats, kinds = ["rating", "velocity", "fourPlus"], stacked = false }: { stats: ReviewStats; kinds?: Drill[]; stacked?: boolean }) {
  // A six-month chart needs six months. With fewer than three months of
  // data (Ali, 10 Sep: "if you only have one month of data, think what
  // timeline is worthy of it") the dialog shows the reviews it actually
  // has, and a sourced "Did you know" with the ask, instead of empty bars.
  const monthsWithData = stats.months.filter((m) => m.count > 0).length;
  if (monthsWithData < 3) return <EarlyReviewsList stats={stats} />;
  // STACKED: the dialog's right column, an infographic on a tint (Ali, 11
  // Sep: "stack those charts vertically on some kind of background, treat
  // that stuff like an additional infographic insight").
  if (stacked) {
    return (
      <div className="flex flex-col gap-6 rounded-xl bg-[var(--ds-tailwind-colors-sky-100)] p-6" data-hook="review-summary-charts">
        <p className="text-heading-subsection">The last six months</p>
        {kinds.map((kind) => (
          <div key={kind} className="flex flex-col gap-2">
            <p className="text-label-sm font-semibold uppercase tracking-wide">{kind === "rating" ? "Rating" : kind === "velocity" ? "Review velocity" : "Four stars or above"}</p>
            {/* Past months in white on the tint (Ali, 11 Sep: grey on blue "looks awful"). */}
            <DrillChart stats={stats} kind={kind} onTint />
            <p className="text-body-sm text-pretty">{drillCopy(stats, kind)}</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`mt-6 grid gap-4 border-t pt-6 ${kinds.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`} data-hook="review-summary-charts">
      {kinds.map((kind) => (
        <div key={kind} className="flex flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-neutral-50)] p-4">
          <p className="text-heading-subsection">
            {kind === "rating" ? "Rating" : kind === "velocity" ? "Review velocity" : "Four stars or above"}, last six months
          </p>
          <DrillChart stats={stats} kind={kind} />
          <p className="text-body-xs text-muted-foreground">{drillCopy(stats, kind)}</p>
        </div>
      ))}
    </div>
  );
}


function SiteCell({ source }: { source: string }) {
  const Mark = SITE_MARK[source];
  return (
    <span className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
      {Mark ? <Mark className="size-3.5 shrink-0" /> : null}
      {SITE_LABEL[source] ?? source}
    </span>
  );
}

function FactArt({ keywords, large = false }: { keywords: string[]; large?: boolean }) {
  const Art = pickIllustration(keywords);
  return <Art className={large ? "size-28 shrink-0" : "size-16 shrink-0"} />;
}


/** The early-days block: every review so far as a short timeline (there
 *  are few enough to list), then one sourced fact and the thing to do. */
export function EarlyReviewsList({ stats }: { stats: ReviewStats }) {
  const persona = usePersona();
  const location = useLocationKey();
  const reviews = reviewsFor(location, persona).slice(0, 8);
  const first = reviews[reviews.length - 1];
  const spanDays = first ? first.daysAgo : 0;
  return (
    <div className="mt-6 flex flex-col gap-3 border-t pt-6" data-hook="review-summary-early">
      <p className="text-heading-subsection">
        {stats.total === 0 ? "No reviews yet" : `Your ${stats.total} ${stats.total === 1 ? "review" : "reviews"} so far, ${spanDays <= 1 ? "today" : `over ${spanDays} days`}`}
      </p>
      {reviews.length ? (
        <ol className="flex flex-col divide-y">
          {reviews.map((r) => (
            <li key={r.id} className="flex items-baseline gap-3 py-2 text-body-sm">
              <span className="w-16 shrink-0 tabular-nums text-muted-foreground">{r.daysAgo === 0 ? "Today" : `${r.daysAgo}d ago`}</span>
              <span className="flex w-24 shrink-0 items-center">
                {typeof r.rating === "number"
                  ? <Rating value={r.rating} dataHook={`early-rating-${r.id}`} />
                  : <span className="text-muted-foreground">{r.rating === "up" ? "Recommends" : "Does not"}</span>}
              </span>
              <SiteCell source={r.source} />
              <span className="min-w-0 truncate">{r.text}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-body-sm text-muted-foreground">Connect a review site and anything already written about you appears here.</p>
      )}
      <p className="text-body-xs text-muted-foreground">Month-by-month charts arrive once there are three months of reviews to compare.</p>
    </div>
  );
}

/** The Did you know column: one sourced fact chosen for the page (the
 *  Showcase's is social proof, the Builder's is the twenty-review line,
 *  the Tracker's is recency), an illustration picked by its meaning, and
 *  the thing to do. Runs the full height of the dialog's right side. */
export function DidYouKnowPanel({ stats, page }: { stats: ReviewStats; page?: BeaconPage | null }) {
  const fact = page === "showcase" ? STATS.spend : page === "tracker" ? STATS.threeMonths : stats.total < 20 ? STATS.twenty : STATS.visit;
  const need = Math.max(0, 20 - stats.total);
  const line =
    page === "showcase"
      ? "Reviews on your own site reach the people who never look at Google. Pick the best and put them where the booking happens."
      : page === "tracker"
        ? "Recent reviews are what count, so the chart to watch is the last three months, not all time."
        : stats.total < 20
          ? `You have ${stats.total}. ${need} more and you are past the line most customers draw. One email to last month's happy customers is the fastest way there.`
          : "Keep asking every month and the recent window stays full.";
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[var(--ds-tailwind-colors-yellow-100)] p-6" data-hook="review-summary-early-fact">
      <p className="flex items-center gap-2 text-heading-subsection"><Lightbulb className="size-4" />Did you know</p>
      <p className="text-display font-display leading-none">{fact.value}</p>
      <p className="text-heading-section max-w-[24ch] text-balance">{fact.text}</p>
      <p className="text-body-sm italic text-muted-foreground">*{fact.source}</p>
      <p className="text-body text-pretty">{line}</p>
      {/* The illustration anchors the foot of the column, so the yellow never ends in empty space. */}
      <div className="mt-auto flex justify-end pt-6">
        <FactArt keywords={fact.art} large />
      </div>
    </div>
  );
}
