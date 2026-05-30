/**
 * GradeLogo — the Grade pixel "G" mark, inlined as SVG.
 *
 * Uses `fill="currentColor"` so it inherits the surrounding text colour
 * — white on dark surfaces, black on light — from one source instead of
 * shipping separate white/black files. Set the colour via `className`
 * (e.g. `text-foreground`) and the size via width/height (default 1em so
 * it scales with font-size).
 *
 * Raw white/black SVGs also live in `public/brand/` if you ever need an
 * <img> / external reference, but prefer this component in-app.
 */

import * as React from "react";

export function GradeLogo({
  size = "1em",
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Grade"
      className={className}
      {...props}
    >
      <rect y="4" width="4" height="4" />
      <rect y="8" width="4" height="4" />
      <rect y="12" width="4" height="4" />
      <rect y="16" width="4" height="4" />
      <rect y="20" width="4" height="4" />
      <rect y="24" width="4" height="4" />
      <rect x="4" y="28" width="4" height="4" />
      <rect x="8" y="28" width="4" height="4" />
      <rect x="12" y="28" width="4" height="4" />
      <rect x="16" y="28" width="4" height="4" />
      <rect x="24" y="20" width="4" height="4" />
      <rect x="20" y="24" width="4" height="4" />
      <path d="M20 28H24L22 30L20 32V28Z" />
      <path d="M24 24H28L26 26L24 28V24Z" />
      <path d="M4 4H8L6 6L4 8V4Z" />
      <path d="M22 22L24 20V24H20L22 22Z" />
      <path d="M2 2L4 0V4H0L2 2Z" />
      <path d="M18 26L20 24V28H16L18 26Z" />
      <rect x="28" y="28" width="4" height="4" />
      <rect x="28" y="24" width="4" height="4" />
      <rect x="28" y="20" width="4" height="4" />
      <rect x="28" y="16" width="4" height="4" />
      <rect x="24" y="16" width="4" height="4" />
      <path d="M24 4H28V8L26 6L24 4Z" />
      <path d="M0 28H4V32L2 30L0 28Z" />
      <rect x="20" y="16" width="4" height="4" />
      <rect x="16" y="16" width="4" height="4" />
      <rect x="28" y="4" width="4" height="4" />
      <path d="M28 0L30 2L32 4H28V0Z" />
      <path d="M4 24L6 26L8 28H4V24Z" />
      <rect x="24" width="4" height="4" />
      <rect x="20" width="4" height="4" />
      <rect x="16" width="4" height="4" />
      <rect x="12" width="4" height="4" />
      <rect x="8" width="4" height="4" />
      <rect x="4" width="4" height="4" />
    </svg>
  );
}
