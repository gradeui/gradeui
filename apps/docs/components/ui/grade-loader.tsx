"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GradeLoader — THE indeterminate loading mark.
 *
 * One branded loader for every "working, can't say how long" moment:
 * scene boundaries warming a shader, Studio panels fetching, previews
 * compiling, anywhere a spinner would otherwise appear. It's the Grade
 * G-arrow mark with a diagonal shimmer sweeping along the arrow's own
 * direction — quiet, on-brand, instantly recognisable as "Grade is
 * thinking".
 *
 * Colour: paints with `currentColor`, so it inherits the surrounding
 * text colour — set `className="text-muted-foreground"` on a light
 * surface, `text-white` over dark footage. The shimmer brightens toward
 * `oklch(var(--brand-1))` when brand pops are present (falls back to
 * plain currentColor without a theme).
 *
 * Reduced motion: the sweep is replaced by a gentle opacity pulse.
 *
 * Accessibility: renders `role="status"` with the label (default
 * "Loading…") for screen readers; pass `label=""` to silence it when a
 * parent already announces.
 */

/** The Grade mark — the same G-arrow path `<Logo />` defaults to. */
const GRADE_MARK_PATH =
  "M28 0L32 4V10L26 4H6L4 6V26L6 28H16L26 18V24L18 32H4L0 28V4L4 0H28ZM32 32H28V18H16V14H32V32Z";

export type GradeLoaderSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<GradeLoaderSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export interface GradeLoaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Mark size — token or exact pixels. Default `"md"` (24px). */
  size?: GradeLoaderSize | number;
  /** Accessible status text (and the optional visible caption).
   *  Default "Loading…"; pass "" to silence. */
  label?: string;
  /** Show the label visually under the mark (it's always announced). */
  showLabel?: boolean;
}

export const GradeLoader = React.forwardRef<HTMLDivElement, GradeLoaderProps>(
  (
    { size = "md", label = "Loading…", showLabel = false, className, style, ...rest },
    ref,
  ) => {
    const px = typeof size === "number" ? size : SIZE_PX[size];
    const id = React.useId().replace(/[^a-zA-Z0-9-]/g, "");

    return (
      <div
        ref={ref}
        data-gds-part="grade-loader"
        role="status"
        aria-label={label || undefined}
        className={cn(
          "gds-grade-loader inline-flex flex-col items-center gap-2",
          className,
        )}
        style={style}
        {...rest}
      >
        <style>{`
          @keyframes gdsLoaderSweep { from { transform: translate(-48px, 48px) } to { transform: translate(48px, -48px) } }
          @keyframes gdsLoaderPulse { 0%, 100% { opacity: 0.35 } 50% { opacity: 0.9 } }
          @media (prefers-reduced-motion: reduce) {
            .gds-grade-loader [data-sweep] { display: none }
            .gds-grade-loader [data-mark] { animation: gdsLoaderPulse 2.2s ease-in-out infinite }
          }
        `}</style>
        <svg
          width={px}
          height={px}
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden
          style={{ display: "block" }}
        >
          <defs>
            {/* The mark clips the shimmer — light only travels inside the G. */}
            <clipPath id={`${id}-clip`}>
              <path d={GRADE_MARK_PATH} />
            </clipPath>
            <linearGradient id={`${id}-shine`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0.35" stopColor="currentColor" stopOpacity="0" />
              <stop
                offset="0.5"
                stopColor="oklch(var(--brand-1, 0.7 0 0))"
                stopOpacity="0.95"
              />
              <stop offset="0.65" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* The resting mark, dimmed — the thing being "filled in". */}
          <path d={GRADE_MARK_PATH} fill="currentColor" opacity={0.28} data-mark />
          {/* The shimmer — a diagonal band riding the arrow's direction,
              clipped to the glyph. transform animates the GROUP (cheap,
              compositor-friendly). */}
          <g clipPath={`url(#${id}-clip)`}>
            <rect
              data-sweep
              x={-16}
              y={-16}
              width={64}
              height={64}
              fill={`url(#${id}-shine)`}
              style={{ animation: "gdsLoaderSweep 1.4s cubic-bezier(0.45, 0, 0.55, 1) infinite" }}
            />
          </g>
        </svg>
        {showLabel && label ? (
          <span className="text-xs text-muted-foreground">{label}</span>
        ) : null}
        {/* Screen-reader text when no visible label. */}
        {!showLabel && label ? <span className="sr-only">{label}</span> : null}
      </div>
    );
  },
);
GradeLoader.displayName = "GradeLoader";
