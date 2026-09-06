// @brightlocal/review-funnel — the Recharts funnel, made to actually render.
//
// WHY THIS EXISTS. The BrightLocal DS ships no Funnel: its chart module's
// set is Area / Bar / Line / Pie / Radar / Radial, so a funnel has to come
// straight from "recharts". That import resolves fine — the Studio sandbox
// maps "recharts" to the copy already on the page — but the OBVIOUS way to
// wrap it renders nothing at all.
//
// Measured on the probe screen (RM — Recharts funnel probe), same markup,
// same page:
//
//   ChartContainer + FunnelChart, height/width 100%    → no <svg> at all
//   ChartContainer > ResponsiveContainer > FunnelChart → no <svg> at all
//   bare ResponsiveContainer + FunnelChart             → renders, 448x224
//   ChartContainer + FunnelChart, EXPLICIT px w/h      → renders, 420x210
//
// A FunnelChart will not take its size from the ResponsiveContainer that
// ChartContainer owns. ChartContainer passes
// `initialDimension={{ width: 1, height: 1 }}`, and a Funnel computes its
// trapezoid geometry ONCE rather than recomputing it when the
// ResizeObserver reports the real width. It stays 1x1, which is
// indistinguishable from "the chart is broken".
//
// So this measures its own width and hands FunnelChart explicit pixels
// INSIDE a ChartContainer — the only shape that keeps the DS chart context
// and stays responsive.
import * as React from "react";
import { ChartContainer } from "@brightlocal/ui-components/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@brightlocal/ui-components/tooltip";
import { Info } from "@brightlocal/icons";
// ONE IMPORT, from "recharts", on purpose: Recharts matches children by
// component IDENTITY, so a Cell from the DS module and a Funnel from
// "recharts" would not see each other.
import { FunnelChart, Funnel, Cell } from "recharts";

// Greys, not the brand green (Ali, 3 Sep: the bright bars were "fighting
// for attention"). The funnel counts people falling away, which is context
// for the numbers above it rather than the headline itself.
const RAMP = [
  "var(--ds-tailwind-colors-neutral-300)",
  "var(--ds-tailwind-colors-neutral-400)",
  "var(--ds-tailwind-colors-neutral-500)",
  "var(--ds-tailwind-colors-neutral-600)",
  "var(--ds-tailwind-colors-neutral-700)",
];
// The ramp crosses from light to dark, so the count inside the band has to
// cross with it or it disappears into its own fill.
const INK = ["#111412", "#111412", "#ffffff", "#ffffff", "#ffffff"];

const CONFIG = { v: { label: "People", color: "var(--ds-tailwind-colors-neutral-400)" } };

// THE COUNT SITS INSIDE THE BAND (Ali, 6 Sep, matching legacy's Feedback
// Funnel). The band knows its own geometry, so it draws its own number;
// the LABEL is DOM, not SVG, because it carries an info tooltip and an
// <svg><text> cannot hold a DS Tooltip.
function Band(props) {
  const { x, y, upperWidth, lowerWidth, height, fill, stroke, strokeWidth, index, half, plotLeft } = props;
  const L = plotLeft;
  const pts = half
    ? [[L, y], [L + upperWidth, y], [L + lowerWidth, y + height], [L, y + height]]
    : [
        [x, y],
        [x + upperWidth, y],
        [x + (upperWidth + lowerWidth) / 2, y + height],
        [x + (upperWidth - lowerWidth) / 2, y + height],
      ];
  const cx = half ? L + Math.max(upperWidth, lowerWidth) / 2 : x + upperWidth / 2;
  return (
    <g>
      <polygon
        points={pts.map((p) => p.join(",")).join(" ")}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text
        x={cx}
        y={y + height / 2}
        fill={INK[index % INK.length]}
        fontSize={15}
        fontWeight={600}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {Number(props.payload?.v ?? 0).toLocaleString()}
      </text>
    </g>
  );
}

/**
 * data: [{ k, v, info? }] — step name, count, and the tooltip that says
 *   what the count actually counts.
 * variant: "half" (default) — vertical left spine, taper on one side; or
 *   "full" for the symmetrical stack.
 * showDrop: the step-to-step drop-off, right-aligned, as legacy shows it.
 */
export function ReviewFunnel({
  data = [],
  variant = "half",
  height = 240,
  showDrop = false,
  // The DOM label column beside the chart. 240 so "Visited Review Site"
  // sits on one line next to its info dot and the drop-off still has a
  // column of its own to sit in.
  labelWidth = 240,
  maxWidth = 480,
  marginLeft = 4,
  dataHook = "review-funnel",
  className = "",
}) {
  const ref = React.useRef(null);
  const [width, setWidth] = React.useState(0);
  const half = variant === "half";
  // The chart owns everything left of the label column.
  const chartWidth = Math.max(0, width - labelWidth);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const read = () => setWidth(Math.round(el.getBoundingClientRect().width));
    read();
    // ResizeObserver, not a window listener: the card this sits in can be
    // resized by the sidebar collapsing or a panel opening, neither of
    // which fires a window resize.
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={["flex w-full items-stretch", className].filter(Boolean).join(" ")}
      style={{ height, maxWidth: maxWidth ?? undefined }}
      data-hook={`${dataHook}-wrap`}
    >
      {/* Nothing renders until the first measurement: a FunnelChart given
          width 0 bakes a 0-wide geometry and never recovers. */}
      {chartWidth > 0 ? (
        <ChartContainer config={CONFIG} dataHook={dataHook} className="aspect-auto h-full shrink-0" style={{ width: chartWidth }}>
          <FunnelChart
            width={chartWidth}
            height={height}
            margin={{ top: 0, right: 0, bottom: 0, left: marginLeft }}
          >
            <Funnel
              dataKey="v"
              nameKey="k"
              data={data}
              isAnimationActive={false}
              lastShapeType="rectangle"
              stroke="var(--background)"
              strokeWidth={2}
              shape={<Band half={half} plotLeft={marginLeft} />}
            >
              {data.map((d, i) => (
                <Cell key={d.k} fill={RAMP[i % RAMP.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ChartContainer>
      ) : null}

      {/* LABELS AS DOM, one row per band. Equal flex rows over the same
          total height line up with the bands without measuring anything,
          and a real element is the only way the "i" can be a DS Tooltip
          that is reachable by keyboard. */}
      <TooltipProvider>
        <div className="flex flex-col" style={{ width: labelWidth }}>
          {data.map((d, i) => {
            const prev = i > 0 ? data[i - 1].v : null;
            const drop = prev ? Math.round(((prev - d.v) / prev) * 100) : null;
            return (
              <div key={d.k} className="flex flex-1 items-center gap-1.5 pl-3">
                <span className="text-sm font-medium">{d.k}</span>
                {d.info ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={`What ${d.k} counts`}
                        data-hook={`${dataHook}-info-${i}`}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex cursor-pointer items-center transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <Info className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{d.info}</TooltipContent>
                  </Tooltip>
                ) : null}
                {/* Its own column, shrink-0, so a long step name cannot
                    squeeze the drop-off onto a second line beside it. */}
                {showDrop ? (
                  <span className="text-muted-foreground ml-auto w-12 shrink-0 text-right text-xs tabular-nums">
                    {drop === null ? "" : `\u2193 ${drop}%`}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
