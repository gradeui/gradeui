"use client";

/**
 * Glint metal price card (Ali, 11 Aug 2026), ported from the Studio
 * shared component "MetalPriceCard" (cmsotthrj7ma4q). Keep the two in
 * sync: a change here needs the same change in Studio, and vice versa.
 *
 * EXTRACTED because the gold and silver wallet screens each carried
 * their own copy of this card, and the silver one was a paste of the
 * gold one: it inherited gold's header comment, gold's Y-axis padding
 * and gold's chart id. Componentising is the fix for that whole class
 * of bug, so anything metal-specific here derives from the `metal` prop
 * and nothing is typed twice.
 *
 * OPENS ON 5Y (Ali, 11 Aug). The long view is the one that shows gold
 * doing what the product is sold on; 1M opens on a squiggle. The
 * headline price is unaffected either way, because latest() always
 * reads the 1M tail, the only range guaranteed to end on the last
 * settled auction.
 *
 * NO CHART ANIMATION (Ali, 11 Aug: "animation is very sow"). Recharts
 * animates an Area over 1500ms by default and replays the whole line on
 * every range change, so toggling 1M to 5Y felt like the app was
 * thinking. isAnimationActive={false} makes range switching instant.
 * Put a short animationDuration back if it ever wants a little motion;
 * do not just shorten the default, because the cost here is on every
 * toggle, not on first paint.
 *
 * PROPORTIONAL Y DOMAIN, the bug this extraction fixes. The old pages
 * both hardcoded domain={["dataMin - 2", "dataMax + 1"]}, which is sized
 * for gold at 128 to 139 USD/g. Against silver at 1.78 to 2.07 that same
 * padding gives a domain of -0.22 to 3.07, so the silver line rendered
 * as a near-flat squiggle in the lower tenth of the card with the axis
 * running below zero. The padding is now a fraction of the series' own
 * range, computed here, so it is correct for either metal, either unit
 * and any range. Recharts' string form ("dataMin - 2") cannot express
 * this: its parser only takes a literal number, so the bounds are
 * computed and passed as numbers.
 *
 * RANGE CONTROL LIVES IN THE HEADER, top right, opposite the title
 * (Ali, 11 Aug). Below the price it sat between two things it was not
 * about, and pushed the chart down; in the header it reads as the card's
 * own control. The card header is therefore a Row, not just a title.
 *
 * NO SOURCE CAPTION (Ali, 11 Aug). This first read "LBMA PM auction ·
 * 2026-08-10", then lost the date, and is now gone entirely. The price is
 * the point of the card and the provenance was a footnote nobody needed
 * on screen. lib/market's header still records where the numbers come
 * from, which is where that belongs.
 *
 * COLOUR comes from metalSolid(metal), the single flat metal colour, so
 * no screen hand-picks a ladder step. The gradient id is per-metal: two
 * of these cards on one page with a shared id would both draw the first
 * one's fill.
 */

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Stack,
  Row,
  ToggleGroup,
  ToggleGroupItem,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@gradeui/ui";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { fmtMoney, usePreference, DEFAULT_PERSONA } from "@/lib/persona";
import {
  OZ,
  RANGES,
  RANGE_LABEL,
  latest,
  series,
  type MetalKey,
  type Range,
} from "@/lib/market";
import { metalSolid } from "@/components/wordmark";

export interface MetalPriceCardProps {
  metal?: MetalKey;
  /** The screen sets the grid span. */
  className?: string;
}

export function MetalPriceCard({
  metal = "gold",
  className,
}: MetalPriceCardProps) {
  const [range, setRange] = React.useState<Range>("5Y");
  const [unit] = usePreference(`unit.${metal}`);
  const label = DEFAULT_PERSONA.balances[metal].label;
  const lastAuction = latest(metal);
  const price = unit === "oz" ? lastAuction.usdPerOz : lastAuction.usdPerG;

  /* Chart the range in the preferred unit, in the metal's own colour. */
  const data = series(metal, range).map(([d, usdPerG]) => ({
    d,
    price: Math.round((unit === "oz" ? usdPerG * OZ : usdPerG) * 100) / 100,
  }));

  /* Bounds from the series itself, so the line fills the card whatever
     the metal, unit or range. The || guard covers a hypothetical flat
     series, where hi - lo is 0 and the domain would collapse. */
  const values = data.map((p) => p.price);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.12 || hi * 0.02;

  const config: ChartConfig = {
    price: { label: "USD", color: metalSolid(metal) },
  };
  const fillId = `fill-${metal}-price`;
  const stroke = metalSolid(metal);

  /* THE LEGEND (Ali, 11 Aug). Both axes are hidden, so without this the
     chart is a shape with no reference: no scale, and no way to tell
     whether the line ended up above or below where it started. The key
     names the series, the low to high gives the scale, and the change is
     the one number a price chart exists to show.
     Read off the SAME `data` the line draws, so the legend can never
     describe a different range than the chart. */
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const changePct = first ? ((last - first) / first) * 100 : 0;
  const up = changePct >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        {/* HEADER HEIGHT IS A CONTRACT BETWEEN THE TWO CARDS (Ali, 11 Aug:
            "could do with the card titles and the big numbers lining up
            visually"). These two sit side by side, so whichever header is
            taller pushes its whole card down and the pair stops reading as
            a row. The price card's header holds a size="sm" ToggleGroup, and
            that control measures 36px, not the 28px of its items: the
            segmented track wraps them in p-0.5. Taller than the wallet card's 20px mark, which left the titles
            8px apart and the big figures 16px apart. min-h-9 is that 36px,
            floored in BOTH headers so neither can drift. Change one, change
            the other. */}
        <Row justify="between" align="center" gap="md" className="min-h-9">
          <CardTitle>{label} price</CardTitle>
          {/* RANGE (Ali, 11 Aug): 1M is the floor because LBMA publishes
              one auction price a day, so the app's 1D and 1W would be
              invented; 5Y is the ceiling he asked for. lib/market thins
              the points per range. */}
          <ToggleGroup
            type="single"
            variant="segmented"
            size="sm"
            value={range}
            onValueChange={(v) => v && setRange(v as Range)}
            className="w-fit shrink-0"
          >
            {RANGES.map((r) => (
              <ToggleGroupItem key={r} value={r} className="min-w-11">
                {RANGE_LABEL[r]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Row>
      </CardHeader>
      <CardContent>
        <Stack gap="md">
          {/* HEADLINE SIZE IS DELIBERATE AND SHARED (Ali, 11 Aug: "on the
              cards we need the numbers to be bigger"). text-4xl is the
              figure size on all three wallet screens, Gold, Silver and
              USD, so it matches the balance sitting beside this card.
              Change one, change all three. The unit suffix went text-sm
              to text-base with it: against a 36px figure, 14px stopped
              reading as an attached suffix and started reading as debris,
              so it scales with the number while staying clearly
              subordinate to it. */}
          <span className="text-4xl font-semibold tabular-nums text-foreground">
            {fmtMoney(price)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              /{unit}
            </span>
          </span>
          <ChartContainer config={config} className="h-[180px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" hide />
              <YAxis hide domain={[lo - pad, hi + pad]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="price"
                type="monotone"
                stroke="var(--color-price)"
                strokeWidth={2}
                fill={`url(#${fillId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
          <Row justify="between" align="center" gap="sm" className="text-xs">
            <Row gap="xs" align="center">
              {/* The swatch is the metal's own flat colour, the same value
                  the line is stroked with, read from one place so the key
                  cannot drift from the chart. */}
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: stroke }}
              />
              <span className="tabular-nums text-muted-foreground">
                USD per {unit}, {fmtMoney(lo)} to {fmtMoney(hi)}
              </span>
            </Row>
            <span
              className={`tabular-nums ${up ? "text-success" : "text-destructive"}`}
            >
              {up ? "+" : ""}
              {changePct.toFixed(1)}% over {RANGE_LABEL[range]}
            </span>
          </Row>
        </Stack>
      </CardContent>
    </Card>
  );
}
