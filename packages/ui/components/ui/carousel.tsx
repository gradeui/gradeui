"use client";

/**
 * Carousel — token-driven slideshow primitive built on embla-carousel.
 *
 * Compound API:
 *
 *   <Carousel autoplay loop>
 *     <Carousel.Slide>{...}</Carousel.Slide>
 *     <Carousel.Slide duration={15000}>{...}</Carousel.Slide>
 *     <Carousel.VideoSlide src="…" poster="…" alt="…" />
 *
 *     <Carousel.Arrows />
 *     <Carousel.Dots />
 *   </Carousel>
 *
 * Design-system contract:
 *   - All visual dimensions are CSS variables (`--rds-carousel-*`) so the
 *     control surface, dot size, gap, arrow look etc. are themable per
 *     consumer without prop drilling. Defaults live in `styles/globals.css`.
 *   - Root stamps `data-gds-part="carousel"` so Studio's selection agent
 *     can target the whole carousel as one unit, with sub-parts on
 *     `Carousel.Slide` (`carousel-slide`), `Carousel.Dots` (`carousel-dots`),
 *     `Carousel.Arrows` (`carousel-arrows`).
 *   - Autoplay is hand-rolled (no `embla-carousel-autoplay` plugin) so per-
 *     slide duration overrides and "advance when the video ends" behaviour
 *     fall out cleanly. The plugin's fixed `delay` would have made both of
 *     those fight the library.
 *
 * Video slide behaviour (the one the user asked for):
 *   - Poster image is rendered until the slide becomes active.
 *   - On activation the <video> autoplays muted + loop (= browser-friendly)
 *     with no controls — chosen default.
 *   - When the loop is short (`<video loop>` re-fires onEnded continuously
 *     in some browsers but never in others), we ALSO use the same per-slide
 *     `duration` mechanism as still slides: if the slide author passes
 *     `duration={15000}` we advance after 15s regardless of the video
 *     length. Without a duration the slide stays put until the carousel
 *     stops being autoplayed — that matches "play this video forever
 *     while it's on screen".
 *
 * Library: embla-carousel-react. Headless, ~6kb gzip, no opinionated CSS.
 */

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EmblaApi = NonNullable<UseEmblaCarouselType[1]>;
type EmblaOptions = Parameters<typeof useEmblaCarousel>[0];

// ─────────────────────────────────────────────────────────────────────
// Context — every subcomponent talks to embla via this.
// ─────────────────────────────────────────────────────────────────────

interface CarouselContextValue {
  api: EmblaApi | undefined;
  selectedIndex: number;
  slideCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  /** Slide indices → per-slide duration (ms). Populated by `Carousel.Slide`
   *  when it mounts so autoplay can read it without prop-drilling. */
  durationsRef: React.MutableRefObject<Map<number, number>>;
  /** Slide indices that are video slides and need an "advance now" signal
   *  when the video calls `onEnded`. */
  advanceFromSlide: (slideIndex: number) => void;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel(componentName: string): CarouselContextValue {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) {
    throw new Error(
      `<${componentName}> must be rendered inside a <Carousel> root.`,
    );
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Loop back to slide 0 after the last one. Default true. */
  loop?: boolean;
  /** Slide alignment within the viewport when not all slides are full-width.
   *  `"start"` (default) lines slides up to the left edge; `"center"` is the
   *  classic "current slide centered, peek of neighbours" treatment. */
  align?: "start" | "center" | "end";
  /** How many slides to show at once. Default `1` (full-bleed slides).
   *  For responsive multi-slide layouts (e.g. 1 mobile / 3 desktop) leave
   *  this and use the `--rds-carousel-slide-basis` CSS var on `Slide`
   *  instead — it accepts media-query-driven values. */
  slidesPerView?: number;
  /** Autoplay config. Pass `true` for defaults (5s delay, pause on hover,
   *  pause when offscreen). Pass an object to override; pass `false` /
   *  omit to disable. */
  autoplay?: boolean | AutoplayConfig;
  /** Drag-to-swipe. Default `true`. Disable when the carousel is being
   *  driven entirely by Dots/Arrows and drag would conflict with chrome
   *  inside the slides. */
  draggable?: boolean;
  /** Fired whenever the active slide changes — programmatic, autoplay,
   *  or user swipe. The value is the zero-based slide index. */
  onSlideChange?: (index: number) => void;
}

export interface AutoplayConfig {
  /** Default delay per slide in ms. Overridden by `<Carousel.Slide duration>`
   *  on a per-slide basis. Default 5000. */
  delay?: number;
  /** Pause the autoplay while the pointer is over the carousel. Default true. */
  pauseOnHover?: boolean;
  /** Pause when the carousel scrolls out of the viewport — saves work and
   *  matches the MediaSurface "play when visible" convention. Default true. */
  pauseWhenOffscreen?: boolean;
}

const DEFAULT_AUTOPLAY_DELAY = 5000;

interface CarouselRootComponent
  extends React.ForwardRefExoticComponent<
    CarouselProps & React.RefAttributes<HTMLDivElement>
  > {
  Slide: typeof CarouselSlide;
  VideoSlide: typeof CarouselVideoSlide;
  Dots: typeof CarouselDots;
  Arrows: typeof CarouselArrows;
  Prev: typeof CarouselPrev;
  Next: typeof CarouselNext;
}

const CarouselRoot = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      loop = true,
      align = "start",
      slidesPerView = 1,
      autoplay = false,
      draggable = true,
      onSlideChange,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const options: EmblaOptions = React.useMemo(
      () => ({
        loop,
        align,
        slidesToScroll: 1,
        watchDrag: draggable,
        containScroll: loop ? false : "trimSnaps",
      }),
      [loop, align, draggable],
    );

    const [viewportRef, api] = useEmblaCarousel(options);

    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [slideCount, setSlideCount] = React.useState(0);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    const durationsRef = React.useRef<Map<number, number>>(new Map());
    const onSlideChangeRef = React.useRef(onSlideChange);
    onSlideChangeRef.current = onSlideChange;

    // Resolve autoplay config once.
    const autoplayConfig = React.useMemo<AutoplayConfig | null>(() => {
      if (!autoplay) return null;
      if (autoplay === true) return {};
      return autoplay;
    }, [autoplay]);

    // Sync state from embla. `reInit` re-fires when the slide DOM changes
    // (e.g. a video slide swaps poster→video), so the snap count + bounds
    // stay accurate without us having to track DOM mutations manually.
    React.useEffect(() => {
      if (!api) return;
      const sync = () => {
        setSelectedIndex(api.selectedScrollSnap());
        setSlideCount(api.scrollSnapList().length);
        setCanScrollPrev(api.canScrollPrev());
        setCanScrollNext(api.canScrollNext());
        onSlideChangeRef.current?.(api.selectedScrollSnap());
      };
      sync();
      api.on("select", sync);
      api.on("reInit", sync);
      return () => {
        api.off("select", sync);
        api.off("reInit", sync);
      };
    }, [api]);

    // Hand-rolled autoplay — reads per-slide durations from the ref.
    // Lives here (not in a plugin) so VideoSlide can call
    // `advanceFromSlide(idx)` to skip on `onEnded` without fighting
    // the plugin's internal timer.
    const advanceFromSlide = React.useCallback(
      (slideIndex: number) => {
        if (!api) return;
        // Only advance if we're STILL on that slide — guards against
        // a stale `onEnded` firing after the user already swiped away.
        if (api.selectedScrollSnap() !== slideIndex) return;
        api.scrollNext();
      },
      [api],
    );

    // Pause-on-hover state (controlled here so the timer can read it).
    const hoveredRef = React.useRef(false);
    // Pause-when-offscreen via IntersectionObserver on the viewport.
    const visibleRef = React.useRef(true);

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    // Compose the consumer's ref with our internal one for IO + hover.
    React.useImperativeHandle(ref, () => rootRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (!autoplayConfig?.pauseWhenOffscreen) {
        visibleRef.current = true;
        return;
      }
      const node = rootRef.current;
      if (!node || typeof IntersectionObserver === "undefined") return;
      const io = new IntersectionObserver(
        (entries) => {
          visibleRef.current = entries.some((e) => e.isIntersecting);
        },
        { threshold: 0.25 },
      );
      io.observe(node);
      return () => io.disconnect();
    }, [autoplayConfig?.pauseWhenOffscreen]);

    // The timer itself.
    React.useEffect(() => {
      if (!api || !autoplayConfig) return;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const schedule = () => {
        if (timer) clearTimeout(timer);
        const idx = api.selectedScrollSnap();
        const delay =
          durationsRef.current.get(idx) ??
          autoplayConfig.delay ??
          DEFAULT_AUTOPLAY_DELAY;
        timer = setTimeout(() => {
          if (hoveredRef.current || !visibleRef.current) {
            // Reschedule and check again next tick — keeps the loop
            // alive without advancing.
            schedule();
            return;
          }
          api.scrollNext();
          // The "select" listener below will call schedule() again
          // for the next slide's delay.
        }, delay);
      };

      const onSelect = () => schedule();
      const onPointerDown = () => {
        if (timer) clearTimeout(timer);
      };
      const onSettle = () => schedule();

      api.on("select", onSelect);
      api.on("pointerDown", onPointerDown);
      api.on("settle", onSettle);
      schedule();

      return () => {
        if (timer) clearTimeout(timer);
        api.off("select", onSelect);
        api.off("pointerDown", onPointerDown);
        api.off("settle", onSettle);
      };
    }, [api, autoplayConfig]);

    const handleMouseEnter = () => {
      if (autoplayConfig?.pauseOnHover !== false) hoveredRef.current = true;
    };
    const handleMouseLeave = () => {
      hoveredRef.current = false;
    };

    const ctx = React.useMemo<CarouselContextValue>(
      () => ({
        api,
        selectedIndex,
        slideCount,
        canScrollPrev,
        canScrollNext,
        durationsRef,
        advanceFromSlide,
      }),
      [
        api,
        selectedIndex,
        slideCount,
        canScrollPrev,
        canScrollNext,
        advanceFromSlide,
      ],
    );

    // Inline CSS variable for slidesPerView so consumers can do
    // ` style={{ "--rds-carousel-slide-basis": "33%" }}` on individual
    // slides — but the default basis falls out of slidesPerView so the
    // common case is prop-driven.
    const basis = `calc(100% / ${slidesPerView})`;

    return (
      <CarouselContext.Provider value={ctx}>
        <div
          ref={rootRef}
          data-gds-part="carousel"
          className={cn("relative", className)}
          style={{
            ["--rds-carousel-slide-basis" as string]: basis,
            ...style,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...rest}
        >
          <div
            ref={viewportRef}
            data-gds-part="carousel-viewport"
            className="overflow-hidden"
            style={{
              borderRadius: "var(--rds-carousel-radius, var(--rds-media-radius, 0.5rem))",
            }}
          >
            <div
              data-gds-part="carousel-track"
              className="flex"
              style={{
                gap: "var(--rds-carousel-gap, 0)",
                touchAction: "pan-y pinch-zoom",
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </CarouselContext.Provider>
    );
  },
) as CarouselRootComponent;
CarouselRoot.displayName = "Carousel";

// ─────────────────────────────────────────────────────────────────────
// Slide
// ─────────────────────────────────────────────────────────────────────

export interface CarouselSlideProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Per-slide autoplay duration in ms. Overrides the carousel's default
   *  delay for this slide only. e.g. `duration={15000}` keeps a hero
   *  still on screen for 15s while the rest cycle at 5s. */
  duration?: number;
}

const CarouselSlide = React.forwardRef<HTMLDivElement, CarouselSlideProps>(
  ({ duration, className, style, children, ...rest }, ref) => {
    const { durationsRef } = useCarousel("Carousel.Slide");
    // Position is supplied by the parent track's flex order. We need the
    // slide's index to write the per-slide duration into the ref. Use a
    // sibling-count effect to find it — cheap and avoids requiring a
    // controlled prop.
    const slideRef = React.useRef<HTMLDivElement | null>(null);
    React.useImperativeHandle(ref, () => slideRef.current as HTMLDivElement);

    React.useEffect(() => {
      if (duration == null) return;
      const el = slideRef.current;
      if (!el?.parentElement) return;
      const idx = Array.from(el.parentElement.children).indexOf(el);
      if (idx < 0) return;
      const map = durationsRef.current;
      map.set(idx, duration);
      return () => {
        map.delete(idx);
      };
    }, [duration, durationsRef]);

    return (
      <div
        ref={slideRef}
        data-gds-part="carousel-slide"
        className={cn("min-w-0 shrink-0 grow-0", className)}
        style={{
          flexBasis: "var(--rds-carousel-slide-basis, 100%)",
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
CarouselSlide.displayName = "Carousel.Slide";

// ─────────────────────────────────────────────────────────────────────
// VideoSlide — poster + muted-autoplay-on-activate
// ─────────────────────────────────────────────────────────────────────

export interface CarouselVideoSlideProps
  extends Omit<CarouselSlideProps, "children"> {
  src: string;
  /** Poster shown until the slide becomes active. Reuses the
   *  `--rds-media-placeholder-bg/-fg` tokens as a fallback. */
  poster?: string;
  alt?: string;
  /** Override default behaviour and show native controls. Default false —
   *  the chosen default ("muted autoplay + loop, no controls"). */
  controls?: boolean;
  /** Override the default loop behaviour. Default true (the chosen
   *  default). When `false` and no `duration` is set, the carousel
   *  advances when the video ends. */
  loop?: boolean;
  /** Object-fit for the video. Default `"cover"`. */
  fit?: "cover" | "contain";
}

const CarouselVideoSlide = React.forwardRef<HTMLDivElement, CarouselVideoSlideProps>(
  (
    {
      src,
      poster,
      alt,
      controls = false,
      loop = true,
      fit = "cover",
      duration,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { api, selectedIndex, advanceFromSlide } =
      useCarousel("Carousel.VideoSlide");
    const slideRef = React.useRef<HTMLDivElement | null>(null);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    React.useImperativeHandle(ref, () => slideRef.current as HTMLDivElement);

    // Find this slide's index by sibling position — same approach as
    // CarouselSlide. Stored in state so we can compare against
    // `selectedIndex` cheaply.
    const [slideIndex, setSlideIndex] = React.useState<number | null>(null);
    React.useEffect(() => {
      const el = slideRef.current;
      if (!el?.parentElement) return;
      setSlideIndex(Array.from(el.parentElement.children).indexOf(el));
    }, [api]);

    const isActive = slideIndex != null && slideIndex === selectedIndex;

    // Activate / deactivate the video as the slide enters / exits.
    React.useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isActive) {
        // play() returns a promise that rejects if the browser blocks
        // it (rare for muted videos but defensive — swallow).
        const p = video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }, [isActive]);

    return (
      <CarouselSlide
        ref={slideRef}
        duration={duration}
        className={cn(
          "relative overflow-hidden bg-[var(--rds-media-placeholder-bg)]",
          className,
        )}
        style={style}
        data-gds-part="carousel-video-slide"
        {...rest}
      >
        {/* Poster — visible until activated. Always rendered (no
            opacity flicker on swap) and stacked behind the video. */}
        {poster && (
          <img
            src={poster}
            alt={alt ?? ""}
            aria-hidden={isActive}
            className="absolute inset-0 h-full w-full"
            style={{
              objectFit: fit,
              opacity: isActive ? 0 : 1,
              transition: "opacity var(--rds-carousel-fade-ms, 200ms) ease-out",
            }}
          />
        )}
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          loop={loop}
          controls={controls}
          preload="metadata"
          aria-label={alt}
          className="block h-full w-full"
          style={{
            objectFit: fit,
            opacity: isActive ? 1 : 0,
            transition: "opacity var(--rds-carousel-fade-ms, 200ms) ease-out",
          }}
          onEnded={() => {
            // Only relevant when loop=false. Advance the carousel so the
            // video doesn't end-state freeze on the user.
            if (loop) return;
            if (slideIndex == null) return;
            advanceFromSlide(slideIndex);
          }}
        />
      </CarouselSlide>
    );
  },
);
CarouselVideoSlide.displayName = "Carousel.VideoSlide";

// ─────────────────────────────────────────────────────────────────────
// Dots
// ─────────────────────────────────────────────────────────────────────

export interface CarouselDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Position the dots relative to the viewport. Default `"below"` puts
   *  them in flow underneath; `"overlay"` floats them at the bottom of
   *  the carousel area on top of the slides. */
  position?: "below" | "overlay";
  /** Custom render function for one dot. Receives `{ index, active, onClick }`
   *  and should return a button — for when the default rounded-pill look
   *  doesn't fit (e.g. thumbnail strips, numeric pagination). */
  renderDot?: (state: {
    index: number;
    active: boolean;
    onClick: () => void;
  }) => React.ReactNode;
}

const CarouselDots = React.forwardRef<HTMLDivElement, CarouselDotsProps>(
  ({ position = "below", renderDot, className, style, ...rest }, ref) => {
    const { api, selectedIndex, slideCount } = useCarousel("Carousel.Dots");

    if (slideCount <= 1) return null;

    const dots = Array.from({ length: slideCount }, (_, i) => i);

    const overlayStyles =
      position === "overlay"
        ? {
            position: "absolute" as const,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            bottom: "var(--rds-carousel-dots-inset, 0.75rem)",
            zIndex: 1,
          }
        : { marginBlockStart: "var(--rds-carousel-dots-gap, 0.75rem)" };

    return (
      <div
        ref={ref}
        data-gds-part="carousel-dots"
        className={cn("flex items-center justify-center", className)}
        style={{
          gap: "var(--rds-carousel-dots-spacing, 0.5rem)",
          ...overlayStyles,
          ...style,
        }}
        {...rest}
      >
        {dots.map((i) => {
          const active = i === selectedIndex;
          const onClick = () => api?.scrollTo(i);
          if (renderDot) return renderDot({ index: i, active, onClick });
          return (
            <button
              key={i}
              type="button"
              onClick={onClick}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={active ? "true" : undefined}
              data-active={active || undefined}
              className="rounded-full transition-all"
              style={{
                width: active
                  ? "var(--rds-carousel-dot-active-width, 1.25rem)"
                  : "var(--rds-carousel-dot-size, 0.5rem)",
                height: "var(--rds-carousel-dot-size, 0.5rem)",
                background: active
                  ? "var(--rds-carousel-dot-active-color, oklch(var(--primary)))"
                  : "var(--rds-carousel-dot-color, oklch(var(--muted-foreground) / 0.4))",
              }}
            />
          );
        })}
      </div>
    );
  },
);
CarouselDots.displayName = "Carousel.Dots";

// ─────────────────────────────────────────────────────────────────────
// Arrows
// ─────────────────────────────────────────────────────────────────────

export interface CarouselArrowsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Position relative to the viewport. `"overlay"` (default) floats the
   *  arrows over the slides; `"outside"` places them in flow alongside
   *  the carousel (useful when the viewport is full-bleed). */
  position?: "overlay" | "outside";
}

const CarouselArrows = React.forwardRef<HTMLDivElement, CarouselArrowsProps>(
  ({ position = "overlay", className, style, ...rest }, ref) => {
    if (position === "outside") {
      return (
        <div
          ref={ref}
          data-gds-part="carousel-arrows"
          className={cn("flex items-center justify-end gap-2 pt-2", className)}
          style={style}
          {...rest}
        >
          <CarouselPrev />
          <CarouselNext />
        </div>
      );
    }
    return (
      <div
        ref={ref}
        data-gds-part="carousel-arrows"
        className={cn("pointer-events-none absolute inset-0 z-[1]", className)}
        style={style}
        {...rest}
      >
        <CarouselPrev className="pointer-events-auto absolute left-[var(--rds-carousel-arrow-inset,0.75rem)] top-1/2 -translate-y-1/2" />
        <CarouselNext className="pointer-events-auto absolute right-[var(--rds-carousel-arrow-inset,0.75rem)] top-1/2 -translate-y-1/2" />
      </div>
    );
  },
);
CarouselArrows.displayName = "Carousel.Arrows";

export interface CarouselNavButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const CarouselPrev = React.forwardRef<HTMLButtonElement, CarouselNavButtonProps>(
  ({ className, style, children, ...rest }, ref) => {
    const { api, canScrollPrev } = useCarousel("Carousel.Prev");
    return (
      <button
        ref={ref}
        type="button"
        data-gds-part="carousel-prev"
        aria-label="Previous slide"
        disabled={!canScrollPrev}
        onClick={() => api?.scrollPrev()}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition disabled:opacity-40 disabled:cursor-not-allowed",
          "hover:[background:var(--rds-carousel-arrow-hover-bg,oklch(var(--background)))]",
          className,
        )}
        style={{
          width: "var(--rds-carousel-arrow-size, 2.25rem)",
          height: "var(--rds-carousel-arrow-size, 2.25rem)",
          background:
            "var(--rds-carousel-arrow-bg, oklch(var(--background) / 0.85))",
          color: "var(--rds-carousel-arrow-fg, oklch(var(--foreground)))",
          backdropFilter: "var(--rds-carousel-arrow-backdrop, blur(6px))",
          boxShadow:
            "var(--rds-carousel-arrow-shadow, 0 2px 8px oklch(0 0 0 / 0.12))",
          ...style,
        }}
        {...rest}
      >
        {children ?? <ChevronLeft className="h-4 w-4" aria-hidden />}
      </button>
    );
  },
);
CarouselPrev.displayName = "Carousel.Prev";

const CarouselNext = React.forwardRef<HTMLButtonElement, CarouselNavButtonProps>(
  ({ className, style, children, ...rest }, ref) => {
    const { api, canScrollNext } = useCarousel("Carousel.Next");
    return (
      <button
        ref={ref}
        type="button"
        data-gds-part="carousel-next"
        aria-label="Next slide"
        disabled={!canScrollNext}
        onClick={() => api?.scrollNext()}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "transition disabled:opacity-40 disabled:cursor-not-allowed",
          "hover:[background:var(--rds-carousel-arrow-hover-bg,oklch(var(--background)))]",
          className,
        )}
        style={{
          width: "var(--rds-carousel-arrow-size, 2.25rem)",
          height: "var(--rds-carousel-arrow-size, 2.25rem)",
          background:
            "var(--rds-carousel-arrow-bg, oklch(var(--background) / 0.85))",
          color: "var(--rds-carousel-arrow-fg, oklch(var(--foreground)))",
          backdropFilter: "var(--rds-carousel-arrow-backdrop, blur(6px))",
          boxShadow:
            "var(--rds-carousel-arrow-shadow, 0 2px 8px oklch(0 0 0 / 0.12))",
          ...style,
        }}
        {...rest}
      >
        {children ?? <ChevronRight className="h-4 w-4" aria-hidden />}
      </button>
    );
  },
);
CarouselNext.displayName = "Carousel.Next";

// ─────────────────────────────────────────────────────────────────────
// Compose + export
// ─────────────────────────────────────────────────────────────────────

CarouselRoot.Slide = CarouselSlide;
CarouselRoot.VideoSlide = CarouselVideoSlide;
CarouselRoot.Dots = CarouselDots;
CarouselRoot.Arrows = CarouselArrows;
CarouselRoot.Prev = CarouselPrev;
CarouselRoot.Next = CarouselNext;

export const Carousel = CarouselRoot;

export {
  CarouselSlide,
  CarouselVideoSlide,
  CarouselDots,
  CarouselArrows,
  CarouselPrev,
  CarouselNext,
};

// Headless escape hatch for consumers that want the embla api directly
// (custom dots, thumbnail strips, programmatic control from outside the
// tree). Returns `undefined` until embla has initialised.
export function useCarouselApi(): EmblaApi | undefined {
  const ctx = React.useContext(CarouselContext);
  return ctx?.api;
}
