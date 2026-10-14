// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// MetalPriceCardV2 (2 Oct 2026, REDRAWN 14 Oct): the price card on the
// business portal v2's Gold and Silver pages. A FORK of MetalPriceCard, so
// the live demo's wallet screens keep that one exactly as it is.
//
// TWIN: the Studio shared component "MetalPriceCardV2" (cmuqwdkwwesmee). Editing one does
// not touch the other. Keep the pair in sync.
// not touch the other. Keep the pair in sync.
//
// 14 OCT, AS "Glint - Web Portal - Full New" DRAWS IT (Gold · 2 vaults and
// the Charts slides: Up, Down, Neutral, Hover), measured off the slides:
//   - THE CARD: card with a border, 16 corners, 20 all round.
//   - THE HEADER, 36 tall: "Gold price" in Raleway Bold 20/28 on the
//     left; on the right the Web DS segmented control, 264 wide, 1M 1Y 2Y
//     5Y sharing it equally. OPENS ON 1Y, as every slide shows it.
//   - 4 under it, the price: the Web DS DisplayNumber md, "$131.82" with
//     "/g" in muted-foreground; then the change line, Chivo 12/16 in
//     muted-foreground after a 12 arrow: "0.65% ($0.86) past year". The
//     arrow is the state: UP (higher than the start of the range) is
//     arrow-up-right in success, DOWN is arrow-down-right in destructive,
//     NEUTRAL (under 1% either way) is a flat arrow-right, muted. Those
//     are the Charts slides' own words.
//   - 16 under that, the chart, 104 tall: a 1.5 line in the silver token
//     for both metals (silver/300 Dark, silver/500 Light, as the slides
//     paint it), a dot on the last point, and a dashed 1px rule in
//     muted-foreground (4 on, 4 off) at the range's FIRST price, so the
//     line reads as above or below where it started. No fill, no axes.
//   - HOVER (Charts · Hover): Recharts' tooltip, cursor and active dot.
//     The cursor is a 1px border-coloured rule, the active dot the line's
//     colour, the tooltip a popover card (border, 8 corners, 12 in) with
//     the date and "Price : $139.25", Chivo 12/16.
//   - 16 under the chart, the legend in Chivo 14/20 muted-foreground:
//     "USD per g • $125.39 to $179.95", the low and high of the range.
//
// 2Y: Market has 1M, 3M, 1Y and 5Y. Figma's 2Y is the last two years of
// the 5Y series (monthly points), cut here so Market stays as it is.
//
// ?trend=down | neutral (StagingSwitches) reshapes the drawn series so the
// Down and Neutral slides can be seen: the real prices only rise over these
// ranges. Off by default; not real prices.
//
// ASSUMPTIONS: the figures are Market's LBMA series, not Figma's samples
// ($131.82, $125.39 to $179.95), so the state a range shows depends on
// the real prices; the change line's "past 2 years" and "past 5 years"
// extend Figma's "past month" and "past year".
import * as React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTip, ReferenceLine, ResponsiveContainer } from "recharts";
import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Persona } from "@/lib/persona";
import { Market } from "@/lib/market";
import { DisplayNumber } from "@/components/display-number";
import { StagingSwitches } from "@/lib/staging-switches";
import { WebDsV2 } from "@/components/web-ds-v2";

const RANGES = ["1M", "1Y", "2Y", "5Y"];
const PAST = { "1M": "past month", "1Y": "past year", "2Y": "past 2 years", "5Y": "past 5 years" };
const LINE = "var(--wds-silver)";

/** The rows for a range, oldest first: Market's, and 2Y cut from 5Y. */
function rowsFor(metal, range) {
  if (range !== "2Y") return Market.series(metal, range);
  const all = Market.series(metal, "5Y");
  const last = new Date(all[all.length - 1][0]);
  const from = new Date(last.getFullYear() - 2, last.getMonth(), last.getDate()).getTime();
  return all.filter(([d]) => new Date(d).getTime() >= from);
}

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Charts · Hover's tooltip: a popover card, the date over "Price : $x". */
function PriceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="flex flex-col gap-1 rounded-[8px] border border-[color:var(--wds-border)] bg-[var(--wds-popover)] p-3 text-xs leading-4 text-[color:var(--wds-popover-foreground)] shadow-sm">
      <span>{fmtDate(p.d)}</span>
      <span>Price : {Persona.fmtMoney(p.price)}</span>
    </div>
  );
}

function MetalPriceCardV2({ metal = "gold", className }) {
  const [range, setRange] = React.useState("1Y");
  const [unit] = Persona.usePreference(`unit.${metal}`);
  const label = Persona.DEFAULT.balances[metal].label;
  const latest = Market.latest(metal);
  const price = unit === "oz" ? latest.usdPerOz : latest.usdPerG;

  const trend = StagingSwitches.useTrend();
  /* The range in the preferred unit, reshaped by ?trend= (see above). */
  const raw = rowsFor(metal, range).map(([d, usdPerG]) => [d, unit === "oz" ? usdPerG * Market.OZ : usdPerG]);
  const start = raw[0]?.[1] ?? 0;
  const end = raw[raw.length - 1]?.[1] ?? 0;
  const k = trend === "neutral" && end !== start ? Math.abs((0.005 * start) / (end - start)) : 1;
  const shape = (v) => (trend === "down" ? 2 * start - v : start + (v - start) * k);
  const data = raw.map(([d, v]) => ({ d, price: Math.round(shape(v) * 100) / 100 }));
  const values = data.map((p) => p.price);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  /* Bounds from the series itself, so the line fills the chart whatever
     the metal, unit or range; the || covers a flat series. */
  const pad = (hi - lo) * 0.1 || hi * 0.02;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const change = last - first;
  const pct = first ? (change / first) * 100 : 0;
  const state = Math.abs(pct) < 1 ? "neutral" : pct > 0 ? "up" : "down";
  const Arrow = state === "up" ? ArrowUpRight : state === "down" ? ArrowDownRight : ArrowRight;
  const arrowInk =
    state === "up"
      ? "text-[color:var(--wds-success)]"
      : state === "down"
        ? "text-[color:var(--wds-destructive)]"
        : "text-[color:var(--wds-muted-foreground)]";

  return (
    <div
      className={`flex flex-col rounded-[16px] border border-[color:var(--wds-border)] bg-[var(--wds-card)] p-5 ${className ?? ""}`}
    >
      {/* Below sm the range takes its own row, full width (ASSUMPTION:
          Full New draws no phone price card). */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:h-9 sm:flex-nowrap">
        <span className="wds-display text-xl font-bold leading-7 text-[color:var(--wds-card-foreground)]">
          {label} price
        </span>
        <div className="w-full shrink-0 sm:w-[264px]">
          <WebDsV2.Segmented
            aria-label="Chart range"
            stretch
            value={range}
            onValueChange={setRange}
            options={RANGES.map((r) => ({ value: r, label: r }))}
          />
        </div>
      </div>
      <DisplayNumber
        value={price}
        currency
        suffix={unit === "oz" ? "/oz t" : "/g"}
        suffixColor="var(--wds-muted-foreground)"
        size="md"
        className="mt-1 text-[color:var(--wds-foreground)]"
      />
      <span className="flex items-center gap-1 text-xs leading-4 text-[color:var(--wds-muted-foreground)]">
        <Arrow aria-hidden className={`size-3 shrink-0 ${arrowInk}`} strokeWidth={2} />
        {Math.abs(pct).toFixed(2)}% ({Persona.fmtMoney(change)}) {PAST[range]}
      </span>
      <div className="mt-4 h-[104px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="d" hide />
            <YAxis hide domain={[lo - pad, hi + pad]} />
            <ReferenceLine y={first} stroke="var(--wds-muted-foreground)" strokeDasharray="4 4" strokeWidth={1} />
            {/* Recharts' Tooltip, aliased: the contract validator reads a bare
                <Tooltip> as the DS one. */}
            <ChartTip
              content={<PriceTooltip />}
              cursor={{ stroke: "var(--wds-border)", strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="price"
              type="linear"
              stroke={LINE}
              strokeWidth={1.5}
              isAnimationActive={false}
              activeDot={{ r: 3, fill: LINE, stroke: "none" }}
              dot={(props) =>
                props.index === data.length - 1 ? (
                  <circle key="last" cx={props.cx} cy={props.cy} r={3} fill={LINE} />
                ) : (
                  <g key={props.index} />
                )
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <span className="mt-4 text-sm leading-5 text-[color:var(--wds-muted-foreground)]">
        USD per {unit === "oz" ? "oz t" : unit} • {Persona.fmtMoney(lo)} to {Persona.fmtMoney(hi)}
      </span>
    </div>
  );
}

/* Exported untyped: the body is plain JSX (see the header). */
const __MetalPriceCardV2: any = MetalPriceCardV2;
export { __MetalPriceCardV2 as MetalPriceCardV2 };
