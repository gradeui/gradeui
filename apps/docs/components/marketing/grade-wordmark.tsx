"use client";

/**
 * GradeWordmark — the pixel-art GRADE wordmark, inlined as a component.
 *
 * Source: brand SVG (352×64). Inlined rather than served from /public so
 * it can paint with `currentColor` — it follows whatever text colour the
 * surrounding context sets (foreground on dark marketing pages, etc.).
 *
 * Size it with className (`h-4 w-auto` in the header lozenge, large on
 * the homepage hero). clipPath ids are generated with useId so multiple
 * instances can coexist on one page without DOM id collisions.
 */

import * as React from "react";

export interface GradeWordmarkProps extends React.SVGProps<SVGSVGElement> {
  /** Accessible name. Pass "" + aria-hidden for decorative use. */
  title?: string;
}

export function GradeWordmark({ title = "Grade", ...props }: GradeWordmarkProps) {
  const uid = React.useId();
  const clip = (n: number) => `grade-wm-${uid}-${n}`;

  return (
    <svg
      viewBox="0 0 352 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      <g clipPath={`url(#${clip(0)})`}>
        <path
          d="M56 0L64 8V20L52 8H12L8 12V52L12 56H32L52 36V48L36 64H8L0 56V8L8 0H56ZM64 64H56V36H32V28H64V64Z"
          fill="currentColor"
        />
      </g>
      <g clipPath={`url(#${clip(1)})`}>
        <rect x="72" y="8" width="8" height="8" fill="currentColor" />
        <rect x="72" y="16" width="8" height="8" fill="currentColor" />
        <rect x="72" y="24" width="8" height="8" fill="currentColor" />
        <rect x="72" y="32" width="8" height="8" fill="currentColor" />
        <rect x="72" y="40" width="8" height="8" fill="currentColor" />
        <rect x="72" y="48" width="8" height="8" fill="currentColor" />
        <path d="M80 8H84L82 10L80 12V8Z" fill="currentColor" />
        <path d="M76 4L80 0V8H72L76 4Z" fill="currentColor" />
        <rect x="128" y="52" width="8" height="8" fill="currentColor" />
        <rect x="128" y="56" width="8" height="8" fill="currentColor" />
        <rect x="128" y="44" width="8" height="8" fill="currentColor" />
        <rect x="128" y="36" width="8" height="8" fill="currentColor" />
        <rect x="128" y="28" width="8" height="8" fill="currentColor" />
        <rect x="120" y="28" width="8" height="8" fill="currentColor" />
        <path d="M124 8H128V12L126 10L124 8Z" fill="currentColor" />
        <path d="M128 12H132V16L130 14L128 12Z" fill="currentColor" />
        <path d="M72 56H80V64L76 60L72 56Z" fill="currentColor" />
        <rect x="104" y="28" width="8" height="8" fill="currentColor" />
        <rect x="112" y="28" width="8" height="8" fill="currentColor" />
        <rect x="128" y="8" width="4" height="4" fill="currentColor" />
        <rect x="132" y="12" width="4" height="4" fill="currentColor" />
        <rect x="132" y="8" width="4" height="4" fill="currentColor" />
        <path d="M128 0L132 4L136 8H128V0Z" fill="currentColor" />
        <rect x="120" width="8" height="8" fill="currentColor" />
        <rect x="112" width="8" height="8" fill="currentColor" />
        <rect x="104" width="8" height="8" fill="currentColor" />
        <rect x="96" width="8" height="8" fill="currentColor" />
        <rect x="88" width="8" height="8" fill="currentColor" />
        <rect x="80" width="8" height="8" fill="currentColor" />
        <path d="M84 28H92V36L88 32L84 28Z" fill="currentColor" />
        <rect x="96" y="28" width="8" height="8" fill="currentColor" />
        <rect x="92" y="28" width="4" height="8" fill="currentColor" />
        <rect x="130" y="18" width="2" height="2" fill="currentColor" />
        <rect x="126" y="20" width="2" height="4" fill="currentColor" />
        <rect x="122" y="24" width="2" height="4" fill="currentColor" />
        <rect x="124" y="24" width="4" height="4" fill="currentColor" />
        <path d="M126 20L130 16V20H126V20Z" fill="currentColor" />
        <path d="M128 18L132 14V18H128V18Z" fill="currentColor" />
        <path d="M122 24L126 20V24H122V24Z" fill="currentColor" />
        <path d="M118 28L122 24V28H118V28Z" fill="currentColor" />
        <path d="M128 20H136L132 24L128 28V20Z" fill="currentColor" />
        <rect x="132" y="16" width="4" height="4" fill="currentColor" />
      </g>
      <g clipPath={`url(#${clip(2)})`}>
        <path
          d="M224 64H216V0H268L280 12V20L272 12V16L264 8H224V64ZM280 56H272V24H280V56Z"
          fill="currentColor"
        />
        <path d="M272 56H280L276 60L272 64V56Z" fill="currentColor" />
        <rect x="232" y="56" width="8" height="8" fill="currentColor" />
        <rect x="224" y="56" width="8" height="8" fill="currentColor" />
        <rect x="240" y="56" width="8" height="8" fill="currentColor" />
        <rect x="248" y="56" width="8" height="8" fill="currentColor" />
        <rect x="256" y="56" width="8" height="8" fill="currentColor" />
        <rect x="264" y="56" width="8" height="8" fill="currentColor" />
        <path d="M268 56L272 52V56H268V56Z" fill="currentColor" />
        <rect x="272" y="20" width="8" height="8" fill="currentColor" />
        <rect x="272" y="12" width="8" height="8" fill="currentColor" />
      </g>
      <g clipPath={`url(#${clip(3)})`}>
        <path
          d="M200 0L208 8V20L196 8H156L152 12V64L144 56V8L152 0H200ZM208 64H200V36H176V28H208V64Z"
          fill="currentColor"
        />
        <rect x="168" y="28" width="8" height="8" fill="currentColor" />
        <rect x="160" y="28" width="8" height="8" fill="currentColor" />
        <rect x="152" y="28" width="8" height="8" fill="currentColor" />
        <rect x="200" y="24" width="8" height="4" fill="currentColor" />
      </g>
      <g clipPath={`url(#${clip(4)})`}>
        <path
          d="M344 0L352 8V20L340 8H300L296 12V64L288 56V8L296 0H344ZM352 56L344 64H300V56H344V48H352V56ZM336 36H300V28H336V36Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id={clip(0)}>
          <rect width="64" height="64" fill="white" />
        </clipPath>
        <clipPath id={clip(1)}>
          <rect width="64" height="64" fill="white" transform="translate(72)" />
        </clipPath>
        <clipPath id={clip(2)}>
          <rect width="64" height="64" fill="white" transform="translate(216)" />
        </clipPath>
        <clipPath id={clip(3)}>
          <rect width="64" height="64" fill="white" transform="translate(144)" />
        </clipPath>
        <clipPath id={clip(4)}>
          <rect width="64" height="64" fill="white" transform="translate(288)" />
        </clipPath>
      </defs>
    </svg>
  );
}
