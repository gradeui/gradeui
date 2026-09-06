// @brightlocal/review-funnel — the Recharts funnel, made to actually render.
//
// WHY THIS EXISTS. The BrightLocal DS ships no Funnel: its chart module's
// set is Area / Bar / Line / Pie / Radar / Radial, so a funnel has to come
// straight from "recharts". That import resolves fine — the Studio sandbox
// maps "recharts" to the copy already on the page, so it costs no new
// dependency — but the OBVIOUS way to wrap it renders nothing at all.
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

const CONFIG = { v: { label: "People", color: "var(--ds-tailwind-colors-neutral-400)" } };

// THE BAND DRAWS ITS OWN LABEL, and that is deliberate.
//
// LabelList was the obvious way and it collides (Ali, 6 Sep: "check the
// labels they are overlapping"). Its text is one string with no line
// breaks, so "Visited a review site · 96" wraps inside the right margin and
// a wrapped label at 240px over four bands runs into the one below it. The
// shape already receives the exact geometry of its own band, so drawing the
// label here puts the name and the number on two controlled lines, anchored
// to that band's centre, and nothing can overlap.
// MEASURED, NOT ASSUMED. Recharts hands each band
//   { x, y, upperWidth, lowerWidth, height }
// where x is the LEFT EDGE of that band's own bounding box, already
// centred in the plot area — so x GROWS as the band narrows:
//
//   Sent          x=4   up=266 low=189
//   Opened        x=43  up=189 low=117
//   Left a rating x=78  up=117 low=53
//   Visited       x=110 up=53  low=53
//
// The first read of this was "x is the centre", which drew a half funnel
// whose left edge drifted right on every band. A half funnel needs a FIXED
// spine, and that is the plot's left edge — margin.left — not each band's x.
function Band(props) {
  const {
    x, y, upperWidth, lowerWidth, height,
    fill, stroke, strokeWidth, payload, half, gap, plotLeft,
  } = props;

  const L = plotLeft;
  const pts = half
    ? [[L, y], [L + upperWidth, y], [L + lowerWidth, y + height], [L, y + height]]
    : [
        [x, y],
        [x + upperWidth, y],
        [x + (upperWidth + lowerWidth) / 2, y + height],
        [x + (upperWidth - lowerWidth) / 2, y + height],
      ];

  // Off the widest edge of THIS band, so the label never crosses the shape.
  const tx = (half ? L + upperWidth : x + upperWidth) + gap;
  const cy = y + height / 2;

  return (
    <g>
      <polygon
        points={pts.map((p) => p.join(",")).join(" ")}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <text x={tx} y={cy} fill="currentColor" fontSize={12} dominantBaseline="middle">
        <tspan x={tx} dy="-0.35em" fillOpacity={0.7}>
          {payload?.k ?? ""}
        </tspan>
        <tspan x={tx} dy="1.25em" fontWeight={500}>
          {Number(payload?.v ?? 0).toLocaleString()}
        </tspan>
      </text>
    </g>
  );
}

/**
 * data: [{ k: "Sent", v: 480 }, …] — step name and count, widest first.
 * variant: "half" (default) — vertical left spine, taper on one side; or
 *   "full" for the symmetrical stack.
 */
export function ReviewFunnel({
  data = [],
  variant = "half",
  height = 240,
  // The right margin the labels live in. Two lines at 12px need ~150px for
  // "Visited a review site"; 190 leaves room without starving the shape.
  labelWidth = 190,
  labelGap = 12,
  marginLeft = 4,
  // CAPPED. Four steps given a whole card's width stop reading as a funnel
  // and become four flat ribbons — the taper is the whole point of the
  // shape. Pass maxWidth={null} for a chart that genuinely should span.
  maxWidth = 460,
  dataHook = "review-funnel",
  className = "",
}) {
  const ref = React.useRef(null);
  const [width, setWidth] = React.useState(0);
  const half = variant === "half";

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
      className={["w-full", className].filter(Boolean).join(" ")}
      style={{ height, maxWidth: maxWidth ?? undefined }}
    >
      {/* Nothing renders until the first measurement: a FunnelChart given
          width 0 bakes a 0-wide geometry and never recovers. */}
      {width > 0 ? (
        <ChartContainer config={CONFIG} dataHook={dataHook} className="aspect-auto h-full w-full">
          <FunnelChart
            width={width}
            height={height}
            margin={{ top: 8, right: labelWidth, bottom: 8, left: marginLeft }}
          >
            <Funnel
              dataKey="v"
              nameKey="k"
              data={data}
              isAnimationActive={false}
              lastShapeType="rectangle"
              stroke="var(--background)"
              strokeWidth={2}
              shape={<Band half={half} gap={labelGap} plotLeft={marginLeft} />}
            >
              {data.map((d, i) => (
                <Cell key={d.k} fill={RAMP[i % RAMP.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ChartContainer>
      ) : null}
    </div>
  );
}
