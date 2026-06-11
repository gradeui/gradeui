"use client";

/**
 * GradeWordmarkPen — the pen-nib GRADE wordmark (June 2026 letterforms),
 * inlined so it paints with `currentColor`.
 *
 * `animated` plays an outline-draw-then-fill, staggered G→E:
 *
 *   1. each letter's outline traces on (pathLength is normalised to 1
 *      via the SVG `pathLength` attribute, so a single dash of length 1
 *      with `stroke-dashoffset` 1→0 draws the contour without any
 *      runtime getTotalLength measuring)
 *   2. the solid fill fades up underneath as the trace completes
 *
 * CSS-only, runs once on mount, collapses to the static mark under
 * prefers-reduced-motion. All ids/classes are useId-scoped so multiple
 * instances coexist on one page.
 */

import * as React from "react";

/** Per-letter path data + the letter's x-band in the 176×32 viewBox. */
const LETTERS: Array<{ x: number; paths: string[] }> = [
  // G
  {
    x: 0,
    paths: [
      "M32 4V10L26 4H6L4 6V26L6 28H16L26 18V24L18 32H4L0 28V4L4 0H28L32 4Z",
      "M16 14V18H28V32H32V14H16Z",
    ],
  },
  // R
  {
    x: 36,
    paths: [
      "M46 18L42 14H68V32H64V18H46Z",
      "M36 28L40 32V6L42 4H62L65.5 7.5L59 14H64L68 10V4L64 0H40L36 4V28Z",
    ],
  },
  // A
  {
    x: 72,
    paths: [
      "M100 32V12H104V32H100Z",
      "M100 14H76V18H100V14Z",
      "M72 28L76 32V6L78 4H98L104 10V4L100 0H76L72 4V28Z",
    ],
  },
  // D
  {
    x: 108,
    paths: [
      "M134 0L140 6V28L136 32H108V0H134ZM112 28H134L136 26V8L132 4H112V28Z",
    ],
  },
  // E
  {
    x: 144,
    paths: [
      "M150 18V14H168V18H150Z",
      "M150 32V28H172V24H176V28L172 32H150Z",
      "M144 28L148 32V6L150 4H170L176 10V4L172 0H148L144 4V28Z",
    ],
  },
];

const LETTER_WIDTH = 32;
/** Per-letter stagger. */
const STAGGER_S = 0.35;
/** Outline trace duration. */
const DRAW_S = 1.6;
/** Fill fade duration; starts before the trace fully finishes so the
 *  letter feels "inked" rather than stamped. */
const FILL_S = 1.0;
const FILL_LAG_S = 1.1;

export interface GradeWordmarkPenProps extends React.SVGProps<SVGSVGElement> {
  /** Accessible name. Pass "" for decorative use (sets aria-hidden). */
  title?: string;
  /** Play the outline-draw + fill once on mount. Default false. */
  animated?: boolean;
}

export function GradeWordmarkPen({
  title = "Grade",
  animated = false,
  ...props
}: GradeWordmarkPenProps) {
  const rawId = React.useId();
  // useId emits characters (":") that are invalid in CSS class names.
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = (i: number) => `gwp-${uid}-clip${i}`;
  const selfClipId = (i: number, j: number) => `gwp-${uid}-self${i}-${j}`;
  const drawClass = `gwp-${uid}-draw`;
  const fillClass = `gwp-${uid}-fill`;

  return (
    <svg
      viewBox="0 0 176 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {animated && (
        <style>{`
          .${drawClass} {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: gwp-${uid}-draw ${DRAW_S}s cubic-bezier(0.45, 0, 0.2, 1) forwards;
          }
          .${fillClass} {
            opacity: 0;
            animation: gwp-${uid}-fill ${FILL_S}s ease-out forwards;
          }
          @keyframes gwp-${uid}-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes gwp-${uid}-fill {
            to { opacity: 1; }
          }
          @media (prefers-reduced-motion: reduce) {
            .${drawClass} { animation: none; stroke-dashoffset: 0; }
            .${fillClass} { animation: none; opacity: 1; }
          }
        `}</style>
      )}

      <defs>
        {LETTERS.map((letter, i) => (
          <clipPath key={i} id={clipId(i)}>
            <rect
              width={LETTER_WIDTH}
              height={32}
              transform={letter.x ? `translate(${letter.x})` : undefined}
              fill="white"
            />
          </clipPath>
        ))}
        {/* Self-clips for the INSIDE stroke: each trace path is clipped
            to its own letterform, so only the inner half of the stroke
            ever paints. A centred stroke leaves a half-pixel halo
            outside the shape that survives the fill — this kills it. */}
        {animated &&
          LETTERS.map((letter, i) =>
            letter.paths.map((d, j) => (
              <clipPath key={`${i}-${j}`} id={selfClipId(i, j)}>
                <path d={d} />
              </clipPath>
            )),
          )}
      </defs>

      {LETTERS.map((letter, i) => {
        const drawDelay = i * STAGGER_S;
        const fillDelay = drawDelay + FILL_LAG_S;
        return (
          <g key={i} clipPath={`url(#${clipId(i)})`}>
            {letter.paths.map((d, j) => (
              <React.Fragment key={j}>
                {/* Solid fill — instant when static, faded in when animated. */}
                <path
                  d={d}
                  fill="currentColor"
                  className={animated ? fillClass : undefined}
                  style={
                    animated ? { animationDelay: `${fillDelay}s` } : undefined
                  }
                />
                {/* Outline trace — only present while animating. pathLength
                    normalises every contour to length 1, so one dash unit
                    draws the whole outline regardless of real length. */}
                {animated && (
                  <path
                    d={d}
                    pathLength={1}
                    fill="none"
                    stroke="currentColor"
                    // Width 2, clipped to the letterform (see self-clips in
                    // defs): only the INNER half paints, giving a clean
                    // 1-device-px line with no outer halo artifacts.
                    // non-scaling-stroke keeps it hairline at any size.
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    clipPath={`url(#${selfClipId(i, j)})`}
                    strokeLinejoin="round"
                    className={drawClass}
                    style={{ animationDelay: `${drawDelay}s` }}
                  />
                )}
              </React.Fragment>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
