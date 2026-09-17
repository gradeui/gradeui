"use client";

/**
 * Review performance for ONE campaign: the Review Tracker's card, scoped to
 * the reviews a campaign brought in.
 *
 * Ali, 17 Sep: the campaign page "should probably use the same display from
 * Review Performance - so then we can drop Reviews gained". So this is the
 * Tracker's card, piece for piece: a sticky header band holding the title,
 * the All sources and All ratings filters and the chart/table switch
 * ("We are also missing filters?"), ratings bars on the left, a sources donut
 * on the right, and provider logos in the legend and the tables ("I want
 * logos on the Trackers page also"). No period filter: a campaign's reviews
 * carry no dates here, and the Timeline card owns the when.
 *
 * THE NUMBERS ARE THE CAMPAIGN'S. The per-site split keeps Reviews gained's
 * own shares (55 / 25 / 20, the last site taking the remainder), so a site's
 * count is the number the old card showed. Each site then splits into rating
 * buckets: Facebook into recommendations, because it has no stars, and every
 * other site over the star buckets. That grid, site by bucket, is what the
 * two filters cut, so each one narrows the other exactly as on the Tracker.
 */

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@brightlocal/ui-components/card";
import { Progress } from "@brightlocal/ui-components/progress";
import { Rating } from "@brightlocal/ui-components/rating";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@brightlocal/ui-components/table";
import { ChartContainer, PieChart, Pie, Cell } from "@brightlocal/ui-components/chart";
import { Star, ThumbsUp, ThumbsDown } from "@brightlocal/icons";
import { FacetedFilterMenu } from "@brightlocal/facet-menu";
import { REVIEW_SOURCES, SourceMark } from "@brightlocal/review-sources";
import { ViewToggle, type ChartView } from "@/components/view-toggle";

// Colour follows RANK, as on the Tracker: the biggest source is --chart-1.
const SLICE_COLOURS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

// The Tracker's sticky card header: pinned under the page header, card
// background so rows scroll behind it, a rule under it, the Tracker's padding.
const STICKY_HEADER =
  "bg-card sticky top-[var(--gds-page-header-height,0px)] z-[5] -mt-3 rounded-t-[inherit] border-b px-6 pt-4 pb-4";
// One child, so no second grid row and no row gap under it (see the Tracker).
const STICKY_HEADER_STYLE = { gridTemplateRows: "auto", rowGap: 0 };

type BucketId = "5" | "4" | "3" | "2" | "1" | "up" | "down";
const BUCKETS: { id: BucketId; label: string; kind: "star" | "up" | "down" }[] = [
  { id: "5", label: "5 star", kind: "star" },
  { id: "4", label: "4 star", kind: "star" },
  { id: "3", label: "3 star", kind: "star" },
  { id: "2", label: "2 star", kind: "star" },
  { id: "1", label: "1 star", kind: "star" },
  { id: "up", label: "Recommended", kind: "up" },
  { id: "down", label: "Not recommended", kind: "down" },
];
const STAR_SHAPE = [70, 17, 5, 3, 5];

/** Whole reviews in proportion to `shape`, rounding pushed onto the largest. */
function spread(shape: number[], total: number) {
  const sum = shape.reduce((a, x) => a + x, 0) || 1;
  const out = shape.map((x) => Math.floor((x / sum) * total));
  const biggest = shape.indexOf(Math.max(...shape));
  out[biggest] += total - out.reduce((a, x) => a + x, 0);
  return out;
}

const nameOf = (id: string) => (REVIEW_SOURCES as Record<string, { name: string }>)[id]?.name ?? id;

function glyph(kind: "star" | "up" | "down", id: string) {
  if (kind === "up") return <ThumbsUp className="text-muted-foreground size-3.5" />;
  if (kind === "down") return <ThumbsDown className="text-muted-foreground size-3.5" />;
  return (
    <>
      <span className="text-sm">{id}</span>
      <Star className="text-muted-foreground size-3.5 fill-current" />
    </>
  );
}

function Total({ value }: { value: number }) {
  return (
    <TableFooter>
      <TableRow>
        <TableCell className="font-medium">Total</TableCell>
        <TableCell align="right" className="font-medium tabular-nums">
          {value.toLocaleString("en-GB")}
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}

export function CampaignPerformance({ reviews, sites, dataHook }: { reviews: number; sites: string[]; dataHook: string }) {
  const [view, setView] = React.useState<ChartView>("chart");
  const [menu, setMenu] = React.useState<string | null>(null);
  const openMenu = (id: string) => setMenu(menu === id ? null : id);

  // SITE BY BUCKET. Reviews gained's split first, then each site's ratings.
  const grid = React.useMemo(() => {
    const total = Math.max(0, reviews);
    const shares = [0.55, 0.25, 0.2].slice(0, sites.length);
    const split = shares.map((f) => Math.round(total * f));
    if (split.length) split[split.length - 1] = total - split.slice(0, -1).reduce((a, b) => a + b, 0);
    return sites.map((id, i) => {
      const count = split[i] ?? 0;
      const cells: Partial<Record<BucketId, number>> = {};
      if (id === "facebook") {
        cells.up = Math.round(count * 0.88);
        cells.down = count - cells.up;
      } else {
        spread(STAR_SHAPE, count).forEach((n, k) => (cells[String(5 - k) as BucketId] = n));
      }
      return { id, name: nameOf(id), cells };
    });
  }, [reviews, sites]);

  const bucketsHere = BUCKETS.filter((b) => (b.kind === "star" ? grid.some((s) => s.id !== "facebook") : grid.some((s) => s.id === "facebook")));
  const [picked, setPicked] = React.useState<{ sources: string[]; buckets: BucketId[] }>({
    sources: sites,
    buckets: bucketsHere.map((b) => b.id),
  });
  const toggle = <T extends string>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const count = (siteIds: string[], bucketIds: BucketId[]) =>
    grid.filter((s) => siteIds.includes(s.id)).reduce((a, s) => a + bucketIds.reduce((b, k) => b + (s.cells[k] ?? 0), 0), 0);

  const activeBuckets = bucketsHere.filter((b) => picked.buckets.includes(b.id));
  const bySource = grid
    .filter((s) => picked.sources.includes(s.id))
    .map((s) => ({ ...s, value: count([s.id], picked.buckets) }))
    .sort((a, b) => b.value - a.value);
  const colourOf = Object.fromEntries(
    [...grid].sort((a, b) => count([b.id], bucketsHere.map((x) => x.id)) - count([a.id], bucketsHere.map((x) => x.id))).map((s, i) => [s.id, SLICE_COLOURS[i % SLICE_COLOURS.length]]),
  );
  const withReviews = bySource.filter((s) => s.value > 0);
  const byBucket = Object.fromEntries(activeBuckets.map((b) => [b.id, count(picked.sources, [b.id])]));
  const total = bySource.reduce((a, s) => a + s.value, 0);
  const peak = Math.max(1, ...activeBuckets.map((b) => byBucket[b.id]));
  const stars = activeBuckets.filter((b) => b.kind === "star");
  const starTotal = stars.reduce((a, b) => a + byBucket[b.id], 0);
  const average = starTotal ? (stars.reduce((a, b) => a + Number(b.id) * byBucket[b.id], 0) / starTotal).toFixed(1) : null;

  const sourceLabel =
    picked.sources.length === grid.length
      ? "All sources"
      : picked.sources.length === 1
        ? nameOf(picked.sources[0])
        : `${picked.sources.length} sources`;
  const ratingLabel =
    picked.buckets.length === bucketsHere.length
      ? "All ratings"
      : picked.buckets.length === 1
        ? bucketsHere.find((b) => b.id === picked.buckets[0])?.label
        : `${picked.buckets.length} ratings`;

  return (
    <Card dataHook={dataHook} density="condensed" className="max-w-none">
      <CardHeader className={STICKY_HEADER} style={STICKY_HEADER_STYLE}>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <CardTitle size="small" dataHook={`${dataHook}-title`}>
            Review performance
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <FacetedFilterMenu
              label={sourceLabel}
              open={menu === "sources"}
              onOpenChange={() => openMenu("sources")}
              options={grid.map((s) => ({
                id: s.id,
                label: s.name,
                count: count([s.id], picked.buckets),
                leading: <SourceMark source={s.id} />,
              }))}
              isAllSelected={picked.sources.length === grid.length}
              isChecked={(id: string) => picked.sources.includes(id)}
              onAll={() => setPicked((p) => ({ ...p, sources: p.sources.length === grid.length ? [] : grid.map((s) => s.id) }))}
              onOption={(id: string) => setPicked((p) => ({ ...p, sources: toggle(p.sources, id) }))}
              allLabel="All sources"
              allCount={count(grid.map((s) => s.id), picked.buckets)}
              panelWidth="w-72"
              align="right"
              dataHook={`${dataHook}-sources-filter`}
            />
            <FacetedFilterMenu
              label={ratingLabel}
              open={menu === "ratings"}
              onOpenChange={() => openMenu("ratings")}
              options={bucketsHere.map((b) => ({
                id: b.id,
                label: b.label,
                count: count(picked.sources, [b.id]),
                leading: b.kind === "star" ? <Rating value={Number(b.id)} dataHook={`${dataHook}-bucket-stars-${b.id}`} /> : glyph(b.kind, b.id),
              }))}
              isAllSelected={picked.buckets.length === bucketsHere.length}
              isChecked={(id: string) => picked.buckets.includes(id as BucketId)}
              onAll={() => setPicked((p) => ({ ...p, buckets: p.buckets.length === bucketsHere.length ? [] : bucketsHere.map((b) => b.id) }))}
              onOption={(id: string) => setPicked((p) => ({ ...p, buckets: toggle(p.buckets, id as BucketId) }))}
              allLabel="All ratings"
              allCount={count(picked.sources, bucketsHere.map((b) => b.id))}
              panelWidth="w-72"
              align="right"
              dataHook={`${dataHook}-ratings-filter`}
            />
            <div className="bg-border mx-1 h-6 w-px" />
            <ViewToggle view={view} onChange={setView} idPrefix={dataHook} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-2 pb-6">
        {total === 0 ? (
          <p className="text-muted-foreground text-sm" data-hook={`${dataHook}-empty`}>
            {reviews > 0 ? "No reviews match these filters." : "No reviews from this campaign yet."}
          </p>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-14">
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
                  {activeBuckets.map((b, i) => (
                    <React.Fragment key={b.id}>
                      {b.kind !== "star" && activeBuckets[i - 1]?.kind !== b.kind && activeBuckets[i - 1]?.kind !== "up" ? (
                        <p className={`text-muted-foreground text-xs font-medium ${i > 0 ? "mt-2" : ""}`}>Facebook recommendations</p>
                      ) : null}
                      <div className="flex items-center gap-3">
                        <span className="flex w-9 shrink-0 items-center justify-start gap-1">{glyph(b.kind, b.id)}</span>
                        {/* The Tracker's bars: --chart-1 on a sky-100 track. */}
                        <Progress
                          dataHook={`${dataHook}-bar-${b.id}`}
                          value={byBucket[b.id]}
                          max={peak}
                          indicatorClassName="bg-chart-1"
                          ariaLabel={`${byBucket[b.id]} reviews`}
                          className="h-2 flex-1 bg-[var(--ds-tailwind-colors-sky-100)]"
                        />
                        <span className="w-10 shrink-0 text-right text-sm tabular-nums">{byBucket[b.id]}</span>
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
                    {activeBuckets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.label}</TableCell>
                        <TableCell align="right" className="tabular-nums">
                          {byBucket[b.id]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <Total value={total} />
                </Table>
              )}
            </div>

            {/* SOURCES. One source draws no donut, as on the Tracker: a single
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
                        config={Object.fromEntries(withReviews.map((s) => [s.id, { label: s.name, color: colourOf[s.id] }]))}
                        dataHook={`${dataHook}-donut`}
                        width="100%"
                        height="100%"
                        className="aspect-square"
                      >
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie
                            data={withReviews}
                            dataKey="value"
                            nameKey="name"
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
                    {bySource.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-4" data-hook={`${dataHook}-source-${s.id}`}>
                        <span className="flex items-center gap-2">
                          {withReviews.length > 1 ? (
                            <span className="size-2.5 rounded-[2px]" style={{ background: colourOf[s.id] }} />
                          ) : null}
                          <SourceMark source={s.id} />
                          <span className="text-sm">{s.name}</span>
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
                    {bySource.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <SourceMark source={s.id} />
                            {s.name}
                          </span>
                        </TableCell>
                        <TableCell align="right" className="tabular-nums">
                          {s.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <Total value={total} />
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
