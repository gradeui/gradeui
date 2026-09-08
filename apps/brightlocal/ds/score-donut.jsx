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
 *  `label` renders the muted caption above ("Location Score").
 *  `color` / `trackColor` override the score-band arc + neutral track
 *  (v2 status-tinted rings — e.g. red-900 arc on red-200 track); omit
 *  for the classic scoreColor treatment. */
export function ScoreDonut({
  value,
  size = 110,
  // Ring fatness matched to the Figma donut (17 Jul): ~15% of size,
  // not the skinny 10px hand-roll it replaced.
  stroke = Math.round((size ?? 110) * 0.15),
  color,
  trackColor,
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
          stroke={trackColor ?? "var(--ds-tailwind-colors-neutral-100)"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={color ?? scoreColor(value)}
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      {size >= 60 ? (
        // Font SCALES with the ring so the value never overflows the
        // inner circle — a fixed text-4xl overran the smaller mini rings
        // (esp. a 3-digit "100"). ~0.3× diameter fits 2–3 digits with
        // room for "/100" beneath (Ali, 20 Jul). Poppins — the score is
        // DISPLAY type, matching the live product's donuts (Ali, 22 Jul).
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-semibold leading-none"
            style={{
              fontSize: Math.round(size * 0.3),
              fontFamily: "var(--ds-font-font-display, Poppins)",
            }}
          >
            {value}
          </span>
          <span
            className="leading-none text-[var(--ds-tailwind-colors-neutral-500)]"
            style={{ fontSize: Math.max(10, Math.round(size * 0.13)) }}
          >
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
