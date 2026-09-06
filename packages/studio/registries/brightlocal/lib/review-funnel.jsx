// @brightlocal/review-funnel — the Recharts funnel, made to actually render.
//
// WHY THIS EXISTS. The BrightLocal DS ships no Funnel: its chart module's
// set is Area / Bar / Line / Pie / Radar / Radial, so a funnel has to come
// straight from "recharts". That import resolves fine — the Studio sandbox
// maps "recharts" to the copy already on the page, so it costs no new
// dependency — but the OBVIOUS way to wrap it renders nothing at all.
//
// Measured on the probe screen (RM — Recharts funnel probe), four shapes,
// same markup, same page:
//
//   ChartContainer + FunnelChart, height/width 100%   → no <svg> at all
//   ChartContainer > ResponsiveContainer > FunnelChart → no <svg> at all
//   bare ResponsiveContainer + FunnelChart             → renders, 448x224
//   ChartContainer + FunnelChart, EXPLICIT px w/h      → renders, 420x210
//
// So a FunnelChart will not take its size from a ResponsiveContainer that
// ChartContainer owns. ChartContainer passes
// `initialDimension={{ width: 1, height: 1 }}`, and a Funnel — unlike the
// cartesian charts — computes its trapezoid geometry once and never
// recomputes it against the ResizeObserver's real measurement. It stays
// 1x1, which is indistinguishable from "the chart is broken".
//
// The two shapes that work each give up something: the bare container loses
// the DS chart context, so `ChartTooltipContent` throws
// ("useChart must be used within a <ChartContainer />") and the --color-*
// variables never get wired; the explicit-pixels version keeps all of that
// but stops being responsive.
//
// This component takes both: it measures its own width and hands FunnelChart
// explicit pixels INSIDE a ChartContainer. One ResizeObserver, and the DS
// tooltip and tokens keep working.
import * as React from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@brightlocal/ui-components/chart";
// ONE IMPORT, from "recharts", on purpose: Recharts matches children by
// component IDENTITY, so a Cell from the DS module and a Funnel from
// "recharts" would not see each other.
import { FunnelChart, Funnel, LabelList, Cell, Tooltip } from "recharts";

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

/**
 * data: [{ k: "Sent", v: 480 }, …] — step name and count, widest first.
 * labelWidth: the right margin the step labels sit in. They are drawn
 *   OUTSIDE the trapezoids because a name plus a count does not fit inside
 *   the last one, which is the narrowest by definition.
 */
export function ReviewFunnel({
  data = [],
  height = 224,
  labelWidth = 176,
  // CAPPED (the gauge screen found this first). Four steps given a whole
  // card's width stop reading as a funnel and become four flat ribbons —
  // the taper is the whole point of the shape. Pass maxWidth={null} for a
  // chart that genuinely should span.
  maxWidth = 448,
  dataHook = "review-funnel",
  className = "",
}) {
  const ref = React.useRef(null);
  const [width, setWidth] = React.useState(0);

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
      {/* Nothing is rendered until the first measurement: a FunnelChart
          given width 0 bakes a 0-wide geometry and never recovers. */}
      {width > 0 ? (
        <ChartContainer
          config={CONFIG}
          dataHook={dataHook}
          className="aspect-auto h-full w-full"
        >
          <FunnelChart
            width={width}
            height={height}
            margin={{ top: 4, right: labelWidth, bottom: 4, left: 4 }}
          >
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Funnel
              dataKey="v"
              nameKey="k"
              data={data}
              isAnimationActive={false}
              lastShapeType="rectangle"
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={d.k} fill={RAMP[i % RAMP.length]} />
              ))}
              <LabelList
                position="right"
                offset={12}
                fill="currentColor"
                stroke="none"
                fontSize={12}
                valueAccessor={(entry) =>
                  `${entry?.payload?.k ?? entry?.name ?? ""} · ${(
                    entry?.payload?.v ?? entry?.val ?? 0
                  ).toLocaleString()}`
                }
              />
            </Funnel>
          </FunnelChart>
        </ChartContainer>
      ) : null}
    </div>
  );
}
