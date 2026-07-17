// @brightlocal/score-donut — THE Location Score ring (promoted from
// per-screen hand-rolls, 17 Jul — Ali: "if not in code, put it in our
// registry proposal"). One parametric donut for every screen: the AI
// Insights landing, Location Summary, module drill-downs and the hub
// all render THIS instead of copy-pasting SVG.
//
// Bands follow the shared convention: red <40 / amber <70 / green.
// The live platform renders orange at low scores — if design settles
// on the Figma treatment instead, restyle HERE and every screen
// follows. Track uses the muted neutral token; no chart library.
import * as React from "react";

export const scoreColor = (score) =>
  score < 40
    ? "var(--ds-tailwind-colors-red-500)"
    : score < 70
      ? "var(--ds-tailwind-colors-amber-500)"
      : "var(--ds-tailwind-colors-green-500)";

/** Donut arc + centred value. `showValue` auto-hides under 60px so the
 *  same component serves hero (110–140) and inline mini (22) sizes.
 *  `label` renders the muted caption above ("Location Score"). */
export function ScoreDonut({
  value,
  size = 110,
  // Ring fatness matched to the Figma donut (17 Jul): ~15% of size,
  // not the skinny 10px hand-roll it replaced.
  stroke = Math.round((size ?? 110) * 0.15),
  label,
  className = "",
  dataHook = "score-donut",
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const donut = (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      data-hook={dataHook}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[var(--ds-tailwind-colors-neutral-100)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={scoreColor(value)}
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      {size >= 60 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-semibold leading-none">{value}</span>
          <span className="text-xs text-[var(--ds-tailwind-colors-neutral-500)]">
            /100
          </span>
        </div>
      ) : null}
    </div>
  );
  if (!label) return donut;
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-[var(--ds-tailwind-colors-neutral-500)]">
        {label}
      </span>
      {donut}
    </div>
  );
}
