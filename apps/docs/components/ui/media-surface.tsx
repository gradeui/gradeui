"use client";

/**
 * MediaSurface — the shared shell used by VideoPlayer, RivePlayer,
 * and ThreeScene. Not exported publicly.
 *
 * Handles the surface area that's identical across all media types:
 *   - aspect ratio / radius / border (driven by CSS variables for theming)
 *   - loading skeleton
 *   - intersection-observer (for pause-when-offscreen)
 *   - reduced-motion query
 *
 * Design-system note: all visual dimensions are backed by CSS vars so
 * consumers can retheme via `--rds-media-radius`, `--rds-media-border`, etc.
 * (These will rename to `--gds-*` when the broader codebase rename lands.)
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type MediaAspect = "video" | "square" | "portrait" | "wide" | "auto";
export type MediaRadius = "none" | "sm" | "md" | "lg" | "xl";

const aspectClass: Record<MediaAspect, string> = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
  auto: "",
};

const radiusVar: Record<MediaRadius, string> = {
  none: "0",
  sm: "var(--radius, 0.25rem)",
  md: "calc(var(--radius, 0.375rem) * 1.25)",
  lg: "calc(var(--radius, 0.5rem) * 1.5)",
  xl: "calc(var(--radius, 0.75rem) * 2)",
};

export interface MediaSurfaceProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  aspect?: MediaAspect;
  radius?: MediaRadius;
  border?: boolean;
  loading?: boolean;
  /** Callback fires when the surface enters / leaves the viewport. */
  onVisibilityChange?: (visible: boolean) => void;
  /** Fallback shown before `onReady` is signalled by the child. */
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export const MediaSurface = React.forwardRef<HTMLDivElement, MediaSurfaceProps>(
  (
    {
      className,
      aspect = "video",
      radius = "lg",
      border = false,
      loading = false,
      onVisibilityChange,
      fallback,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLDivElement | null>(null);

    // merge forwarded + internal refs
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (!onVisibilityChange || !innerRef.current) return;
      const el = innerRef.current;
      const io = new IntersectionObserver(
        ([entry]) => onVisibilityChange(entry.isIntersecting),
        { threshold: 0.05 },
      );
      io.observe(el);
      return () => io.disconnect();
    }, [onVisibilityChange]);

    return (
      <div
        ref={innerRef}
        data-gds-part="media-surface"
        className={cn(
          "rds-media-surface relative overflow-hidden bg-muted",
          aspectClass[aspect],
          border && "border border-border",
          className,
        )}
        style={{
          borderRadius: `var(--rds-media-radius, ${radiusVar[radius]})`,
          ...style,
        }}
        {...props}
      >
        {children}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse"
            aria-hidden
          >
            {fallback}
          </div>
        )}
      </div>
    );
  },
);
MediaSurface.displayName = "MediaSurface";

/** Shared prop interface extended by each media primitive. */
export interface BaseMediaProps {
  /** src for the media — url or path. */
  src?: string;
  /** Show native-ish play/pause/scrubber controls. Default: `true` for video, `false` for Rive/three. */
  controls?: boolean;
  /** Autoplay when mounted (respects reduced-motion). */
  autoPlay?: boolean;
  /** Loop on end. */
  loop?: boolean;
  /** Pause rendering / playback when offscreen. Default `true` (big perf win for WebGL). */
  pauseOffscreen?: boolean;
  /** Aspect ratio of the surface. */
  aspect?: MediaAspect;
  /** Corner radius. */
  radius?: MediaRadius;
  /** Draw a subtle border around the surface. */
  border?: boolean;
  /** Poster / fallback image while loading. */
  poster?: string;
  /** Accessible label — used as `aria-label` on the surface. */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** Hook — returns `true` when the OS reports reduced-motion preference. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}
