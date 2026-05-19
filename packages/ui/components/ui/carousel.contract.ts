/**
 * Carousel — component contract.
 *
 * Hand-authored (no generator marker at the top), so it survives
 * `pnpm -F @gradeui/ui generate:contracts` reruns. Mirrors the
 * Carousel component's TS interface and exposes the props the
 * Studio settings panel can render controls for.
 *
 * Per-slide content (durations, video src/poster, alt text) lives on
 * `Carousel.Slide` / `Carousel.VideoSlide` and is intentionally NOT
 * surfaced through this top-level contract — those belong to the
 * children's own contracts (added later if/when we want per-slide
 * editing). For v1, the panel edits the carousel-wide knobs (autoplay,
 * loop, align, slides per view) and the chat handles per-slide
 * authoring.
 */

import { z } from "zod";
import { contract } from "@gradeui/contracts";

const AlignSchema = z.enum(["start", "center", "end"]);
const AutoplayConfigSchema = z.object({
  delay: z.number().int().positive().optional(),
  pauseOnHover: z.boolean().optional(),
  pauseWhenOffscreen: z.boolean().optional(),
});
const AutoplaySchema = z.union([z.boolean(), AutoplayConfigSchema]);

export const CarouselContract = contract({
  name: "Carousel",
  description:
    "Token-driven slideshow primitive. Embla under the hood, custom autoplay loop with per-slide duration overrides, and a VideoSlide variant that autoplays muted+loop with a poster fallback. Reach for it for marketing hero rotations, app onboarding tours, image galleries, TV/streaming featured rails — anywhere a horizontal stack of slides cycles automatically or on user input.",
  import: "@gradeui/ui",
  aliases: [
    "carousel",
    "slideshow",
    "slider", // colloquial — disambiguate from <Slider> (range input) at the prompt-stitching layer
    "hero rotation",
    "image gallery",
    "featured row",
    "swipe deck",
  ],
  subcomponents: [
    "Carousel.Slide",
    "Carousel.VideoSlide",
    "Carousel.Dots",
    "Carousel.Arrows",
    "Carousel.Prev",
    "Carousel.Next",
  ],
  composesWith: [
    "MediaSurface (inside Carousel.Slide for posters / album art)",
    "Card (slide content)",
    "Stack / Row (slide composition)",
  ],

  props: {
    // ── Knobs — design choices ───────────────────────────────────────
    loop: {
      schema: z.boolean().optional(),
      design: "knob",
      label: "Loop",
      default: true,
      description:
        "Wrap from the last slide back to the first. Default true — the natural fit for hero rotations. Turn off for finite onboarding sequences.",
    },
    align: {
      schema: AlignSchema.optional(),
      design: "knob",
      control: "toggle-group",
      label: "Slide alignment",
      default: "start",
      description:
        "How slides line up inside the viewport when not at 100% width. 'start' is full-bleed; 'center' gives the 'peek of neighbours' carousel look.",
    },
    slidesPerView: {
      schema: z.number().int().positive().optional(),
      design: "knob",
      label: "Slides per view",
      default: 1,
      description:
        "How many slides show at once. 1 for hero rotations; 3 for thumbnail strips; etc. For media-query responsive layouts, leave this at 1 and override `--rds-carousel-slide-basis` on each Slide via CSS.",
    },
    autoplay: {
      schema: AutoplaySchema.optional(),
      design: "structured",
      label: "Autoplay",
      default: false,
      description:
        "`true` for sensible defaults (5s, pause on hover, pause offscreen). Object form: `{ delay, pauseOnHover, pauseWhenOffscreen }`. Per-slide overrides go on `<Carousel.Slide duration={ms}>`.",
    },
    draggable: {
      schema: z.boolean().optional(),
      design: "knob",
      label: "Drag to swipe",
      default: true,
      description:
        "Disable when slide content (a Map, a chart, a draggable card) needs to swallow drag events.",
    },

    // ── Events ───────────────────────────────────────────────────────
    onSlideChange: {
      schema: z.function().optional(),
      design: "event",
      description:
        "Fires with the new slide index whenever the active slide changes (programmatic, autoplay, or user swipe).",
    },

    // ── Plumbing ─────────────────────────────────────────────────────
    className: {
      schema: z.string().optional(),
      design: "plumbing",
    },
    style: {
      schema: z.record(z.string(), z.unknown()).optional(),
      design: "plumbing",
    },
    children: {
      schema: z.unknown(),
      design: "plumbing",
      description:
        "Carousel.Slide / Carousel.VideoSlide children, plus optionally Carousel.Dots and Carousel.Arrows.",
    },
  },
});
