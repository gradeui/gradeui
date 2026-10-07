// @ts-nocheck: a MECHANICAL twin (7 Oct 2026). The body is the Studio
// JSX byte for byte; only the imports and the export line are rewritten
// (scripts/mechanical-twin.py), so the pair cannot drift by
// hand-porting.
"use client";

// RingLattice (2 Oct 2026): the Glint ring pattern as a full-bleed
// background layer, for the business portal v2's standalone pages (Log in,
// Page not found, Server error). Web DS "Ring lattice".
//
// TWIN: the Studio shared component "RingLattice" (cmur2ntvhk0epo). Editing one does
// not touch the other. Keep the pair in sync.
//
// GEOMETRY is the brand's (Glint-Styleguide brand/pattern.ts): one unit is
// the G reduced to its two rings and one bar, outer and inner radii 12 and
// 8.68 on the G's 24 grid, on a square grid tighter than the rings so
// neighbours interlock (outer radius 0.645 x pitch).
//
// INK AND STRENGTH: primary/600 at 20% (Ali, 1 Oct: the one strength used
// everywhere). Strength is the opacity of the WHOLE layer, never of each
// ring, which is the one place DESIGN-WEB allows transparency on a colour.
// The ink is the theme's own primary 600 ramp step, so no colour is mixed.
//
// FADE (Web DS Clearing):
//   "centre"  clear in the middle, full at the edges (desktop pages)
//   "bottom"  full at the top, clear by the bottom (the mobile band)
//   "none"    flat
//
// ASSUMPTION: pitch 96 and a 1px stroke are read off the Web Portal
// exports (the units measure about 94 px on a 1440 frame). The styleguide's
// slide pitch is 130; the web pitch is not written down anywhere yet.
// 7 OCT: the ink is the Web DS primary/600 (#2d58bf, --wds-primary-600)
// wherever WebDsV2 is mounted, falling back to the theme's ramp; and
// fade="top" fades the lattice out towards the top, for the sidebar
// (Web DS Sidebar pattern: RingLattice Strength=Light, Clearing=Top fade).
import * as React from "react";

const OUTER = 12 / 18.6;
const INNER = 8.68 / 18.6;
const BAR_FROM = 3 / 18.6;
const BAR_TO = 15.5 / 18.6;

function RingLattice({
  pitch = 96,
  weight = 1,
  strength = 0.2,
  fade = "centre",
  className = "",
}) {
  const id = "rl" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const R = pitch * OUTER;
  const r = pitch * INNER;
  const units = [];
  for (const j of [-1, 0, 1]) {
    for (const i of [-1, 0, 1]) {
      const cx = pitch / 2 + i * pitch;
      const cy = pitch / 2 + j * pitch;
      units.push(
        <g key={`${i}.${j}`}>
          <circle cx={cx} cy={cy} r={R} />
          <circle cx={cx} cy={cy} r={r} />
          <line x1={cx + pitch * BAR_FROM} x2={cx + pitch * BAR_TO} y1={cy} y2={cy} />
        </g>,
      );
    }
  }
  return (
    <svg
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <defs>
        <pattern id={`${id}-p`} patternUnits="userSpaceOnUse" width={pitch} height={pitch}>
          <g fill="none" strokeWidth={weight} style={{ stroke: "var(--wds-primary-600, oklch(var(--ramp-primary-600)))" }}>
            {units}
          </g>
        </pattern>
        {fade === "centre" ? (
          <radialGradient id={`${id}-f`}>
            <stop offset="0.15" stopColor="black" />
            <stop offset="0.9" stopColor="white" />
          </radialGradient>
        ) : null}
        {fade === "top" ? (
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.08" stopColor="black" />
            <stop offset="0.78" stopColor="white" />
          </linearGradient>
        ) : null}
        {fade === "bottom" ? (
          <linearGradient id={`${id}-f`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0.08" stopColor="black" />
            <stop offset="0.78" stopColor="white" />
          </linearGradient>
        ) : null}
        {fade !== "none" ? (
          <mask id={`${id}-m`}>
            <rect width="100%" height="100%" fill={`url(#${id}-f)`} />
          </mask>
        ) : null}
      </defs>
      <rect
        width="100%"
        height="100%"
        fill={`url(#${id}-p)`}
        opacity={strength}
        mask={fade !== "none" ? `url(#${id}-m)` : undefined}
      />
    </svg>
  );
}


/* Exported untyped: the body is plain JSX (see the header). */
const __RingLattice: any = RingLattice;
export { __RingLattice as RingLattice };
