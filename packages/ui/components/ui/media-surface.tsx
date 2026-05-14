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
 * consumers can retheme via `--rds-media-radius`, `--rds-media-border`,
 * `--rds-media-placeholder-bg`, `--rds-media-placeholder-fg`. The
 * placeholder pair drives the empty-state treatment — it's the
 * canonical "image not yet loaded" surface across Grade until the
 * image-generation pipeline replaces empty slots with real pictures.
 * Custom placeholder UI elsewhere in the product should consume the
 * same vars so we stay visually coherent.
 * (These will rename to `--gds-*` when the broader codebase rename lands.)
 */

import * as React from "react";
import { ImageIcon } from "lucide-react";
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
  /**
   * Controls the empty-state placeholder shown when no `children` and no
   * `loading` state are provided. Default `"icon"` renders a subtle
   * image-icon centered on the muted surface so the slot reads as
   * "media goes here" rather than blank. Use `"none"` for cases where
   * the consumer wants a truly empty surface (e.g. a custom decorative
   * overlay that needs the surface clean), or pass a node to fully
   * override.
   */
  emptyState?: "icon" | "none" | React.ReactNode;
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
      emptyState = "icon",
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
          // `w-full` is the default so the surface fills its parent — without
          // it, a flex parent (e.g. items-center justify-center) collapses the
          // surface to the intrinsic width of its children, which for Rive /
          // WebGL canvases is 0. Override via `className="w-96"` etc.
          "rds-media-surface relative w-full overflow-hidden bg-muted",
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
        {/* Empty-state placeholder — only shown when there's no media
            content to render and no loading skeleton is active. Without
            this the surface defaults to a flat `bg-muted` that blends
            into nearby `bg-card` surfaces (e.g. when MediaSurface sits
            inside a Card list-item) and reads as transparent.

            Surface and icon colours come from a token pair —
            `--rds-media-placeholder-bg` and `--rds-media-placeholder-fg`
            (declared in `packages/ui/styles/globals.css`). This is the
            canonical "image not yet loaded" treatment across Grade —
            consumers rolling their own placeholder UI should use the
            same vars so we stay coherent until the image-generation
            pipeline replaces every empty slot with a real picture. */}
        {!children && !loading && emptyState !== "none" && (
          <div
            data-gds-part="media-surface-placeholder"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              background: "var(--rds-media-placeholder-bg)",
              color: "var(--rds-media-placeholder-fg)",
            }}
            aria-hidden
          >
            {emptyState === "icon" ? (
              <ImageIcon className="h-1/3 w-1/3 max-h-10 max-w-10" />
            ) : (
              emptyState
            )}
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
