"use client";

/**
 * Review performance for ONE campaign: the Review Tracker's display, scoped to
 * the reviews a campaign brought in.
 *
 * Ali, 17 Sep: the campaign page "should probably use the same display from
 * Review Performance - so then we can drop Reviews gained". Reviews gained
 * was a line of per-site counts; this is the same numbers drawn the way the
 * Tracker draws them, ratings bars on the left and a sources donut on the
 * right, with the chart/table switch.
 *
 * Provider logos in the sources legend and table (Ali, 17 Sep: "I wonder
 * actually if we include provider logos on here by default?"). The Tracker's
 * legend is colour swatch and name only; here the mark sits between them.
 *
 * THE NUMBERS ARE THE CAMPAIGN'S. The per-site split keeps Reviews gained's
 * own shares (55 / 25 / 20, the last site taking the remainder), so a site's
 * count is the same number the old card showed. Facebook's share becomes
 * recommendations, because Facebook has no stars; the rest spread over the
 * star buckets. Every split pushes its rounding onto the largest bucket, so
 * the halves always sum to the campaign's Reviews gained.
 */

import * as React from "react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@brightlocal/ui-components/card";
import { Progress } from "@brightlocal/ui-components/progress";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@brightlocal/ui-components/table";
import { ChartContainer, PieChart, Pie, Cell } from "@brightlocal/ui-components/chart";
import {
  GoogleOriginal,
  FacebookOriginal,
  YelpOriginal,
  TrustpilotOriginal,
  Globe,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "@brightlocal/icons";
import { ViewToggle, type ChartView } from "@/components/view-toggle";

const SITE: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  google: { label: "Google", Icon: GoogleOriginal },
  facebook: { label: "Facebook", Icon: FacebookOriginal },
  yelp: { label: "Yelp", Icon: YelpOriginal },
  trustpilot: { label: "Trustpilot", Icon: TrustpilotOriginal },
};
const siteOf = (id: string) => SITE[id] ?? { label: id, Icon: Globe };

function Mark({ id }: { id: string }) {
  const { Icon } = siteOf(id);
  return <Icon className={`size-4 shrink-0 ${SITE[id] ? "" : "text-muted-foreground"}`} />;
}

// Colour follows RANK, as on the Tracker: the biggest source is --chart-1.
const SLICE_COLOURS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/** Whole reviews in proportion to `shape`, rounding pushed onto the largest. */
function spread(shape: number[], total: number) {
  const sum = shape.reduce((a, x) => a + x, 0) || 1;
  const out = shape.map((x) => Math.floor((x / sum) * total));
  const biggest = shape.indexOf(Math.max(...shape));
  out[biggest] += total - out.reduce((a, x) => a + x, 0);
  return out;
}

const STARS = [5, 4, 3, 2, 1];
const STAR_SHAPE = [70, 17, 5, 3, 5];

export function CampaignPerformance({ reviews, sites, dataHook }: { reviews: number; sites: string[]; dataHook: string }) {
  const [view, setView] = React.useState<ChartView>("chart");
  const total = Math.max(0, reviews);

  // Reviews gained's own split, kept so its numbers carry over unchanged.
  const shares = [0.55, 0.25, 0.2].slice(0, sites.length);
  const split = shares.map((f) => Math.round(total * f));
  if (split.length) split[split.length - 1] = total - split.slice(0, -1).reduce((a, b) => a + b, 0);
  const bySite = sites.map((id, i) => ({ id, ...siteOf(id), value: split[i] ?? 0 }));
  const ranked = [...bySite].sort((a, b) => b.value - a.value);
  const colourOf = Object.fromEntries(ranked.map((s, i) => [s.id, SLICE_COLOURS[i % SLICE_COLOURS.length]]));
  const withReviews = ranked.filter((s) => s.value > 0);

  const facebook = bySite.find((s) => s.id === "facebook")?.value ?? 0;
  const recommended = Math.round(facebook * 0.88);
  const starTotal = total - facebook;
  const starCounts = spread(STAR_SHAPE, starTotal);
  const buckets = [
    ...STARS.map((n, i) => ({ id: String(n), kind: "star" as const, label: `${n} star`, value: starCounts[i] })),
    ...(sites.includes("facebook")
      ? [
          { id: "up", kind: "up" as const, label: "Recommended", value: recommended },
          { id: "down", kind: "down" as const, label: "Not recommended", value: facebook - recommended },
        ]
      : []),
  ];
  const peak = Math.max(1, ...buckets.map((b) => b.value));
  const average = starTotal
    ? (STARS.reduce((a, n, i) => a + n * starCounts[i], 0) / starTotal).toFixed(1)
    : null;

  const glyph = (b: (typeof buckets)[number]) =>
    b.kind === "up" ? (
      <ThumbsUp className="text-muted-foreground size-3.5" />
    ) : b.kind === "down" ? (
      <ThumbsDown className="text-muted-foreground size-3.5" />
    ) : (
      <>
        <span className="text-sm">{b.id}</span>
        <Star className="text-muted-foreground size-3.5 fill-current" />
      </>
    );

  return (
    <Card dataHook={dataHook} className="max-w-none">
      <CardHeader>
        <CardTitle size="small" dataHook={`${dataHook}-title`}>
          Review performance
        </CardTitle>
        <CardAction>
          <ViewToggle view={view} onChange={setView} idPrefix={dataHook} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground text-sm" data-hook={`${dataHook}-empty`}>
            No reviews from this campaign yet.
          </p>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
            {/* RATINGS, with the average beside the heading as on the Tracker. */}
            <div className="min-w-0 flex-1">
              <p className="mb-3 flex items-baseline gap-2 text-sm font-medium">
                Ratings
                {average ? (
                  <span className="text-muted-foreground font-normal" data-hook={`${dataHook}-average`}>
                    {average} average
                  </span>
                ) : null}
              </p>
              {view === "chart" ? (
                <div className="flex flex-col gap-2">
                  {buckets.map((b, i) => (
                    <React.Fragment key={b.id}>
                      {b.kind !== "star" && buckets[i - 1]?.kind === "star" ? (
                        <p className="text-muted-foreground mt-2 text-xs font-medium">Facebook recommendations</p>
                      ) : null}
                      <div className="flex items-center gap-3">
                        <span className="flex w-9 shrink-0 items-center justify-start gap-1">{glyph(b)}</span>
                        {/* The Tracker's bars: --chart-1 on a sky-100 track. */}
                        <Progress
                          dataHook={`${dataHook}-bar-${b.id}`}
                          value={b.value}
                          max={peak}
                          indicatorClassName="bg-chart-1"
                          ariaLabel={`${b.value} reviews`}
                          className="h-2 flex-1 bg-[var(--ds-tailwind-colors-sky-100)]"
                        />
                        <span className="w-10 shrink-0 text-right text-sm tabular-nums">{b.value}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <Table dataHook={`${dataHook}-ratings-table`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rating</TableHead>
                      <TableHead align="right">Reviews</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buckets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.label}</TableCell>
                        <TableCell align="right" className="tabular-nums">
                          {b.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell align="right" className="font-medium tabular-nums">
                        {total.toLocaleString("en-GB")}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </div>

            {/* SOURCES. One site draws no donut, as on the Tracker: a single
                slice says nothing, so the legend alone carries it. */}
            <div className="min-w-0 flex-1">
              <p className="mb-3 flex items-baseline gap-2 text-sm font-medium">
                Sources
                <span className="text-muted-foreground font-normal" data-hook={`${dataHook}-sources-summary`}>
                  {withReviews.length} {withReviews.length === 1 ? "source" : "sources"}
                </span>
              </p>
              {view === "chart" ? (
                <div className="flex flex-wrap items-center gap-8">
                  {withReviews.length > 1 ? (
                    <div className="relative size-[190px] shrink-0">
                      <ChartContainer
                        config={Object.fromEntries(withReviews.map((s) => [s.id, { label: s.label, color: colourOf[s.id] }]))}
                        dataHook={`${dataHook}-donut`}
                        width="100%"
                        height="100%"
                        className="aspect-square"
                      >
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={withReviews}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={92}
                            paddingAngle={1}
                            isAnimationActive={false}
                          >
                            {withReviews.map((s) => (
                              <Cell key={s.id} fill={colourOf[s.id]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-metric">{total.toLocaleString("en-GB")}</span>
                        <span className="text-muted-foreground text-xs">reviews</span>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                    {ranked.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-4" data-hook={`${dataHook}-source-${s.id}`}>
                        <span className="flex items-center gap-2">
                          {withReviews.length > 1 ? (
                            <span className="size-2.5 rounded-[2px]" style={{ background: colourOf[s.id] }} />
                          ) : null}
                          <Mark id={s.id} />
                          <span className="text-sm">{s.label}</span>
                        </span>
                        <span className="text-muted-foreground text-sm tabular-nums">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Table dataHook={`${dataHook}-sources-table`}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead align="right">Reviews</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranked.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <Mark id={s.id} />
                            {s.label}
                          </span>
                        </TableCell>
                        <TableCell align="right" className="tabular-nums">
                          {s.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-medium">Total</TableCell>
                      <TableCell align="right" className="font-medium tabular-nums">
                        {total.toLocaleString("en-GB")}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
