---
name: Carousel
import: "@gradeui/ui"
subcomponents: [Carousel.Slide, Carousel.VideoSlide, Carousel.Dots, Carousel.Arrows]
props:
  - Carousel: loop?: boolean — wrap last → first (default true)
  - Carousel: align?: "start" | "center" | "end" — slide alignment (default start)
  - Carousel: slidesPerView?: number — how many slides visible at once (default 1)
  - Carousel: autoplay?: boolean | { delay?: number; pauseOnHover?: boolean; pauseWhenOffscreen?: boolean } — true for defaults (5s, hover/offscreen aware)
  - Carousel: draggable?: boolean — drag-to-swipe (default true)
  - Carousel: onSlideChange?: (index: number) => void
  - Carousel.Slide: duration?: number — per-slide autoplay duration in ms; overrides the carousel default for this slide only
  - Carousel.VideoSlide: src: string — video URL
  - Carousel.VideoSlide: poster?: string — image shown until the slide is active
  - Carousel.VideoSlide: alt?: string — accessible label for the video
  - Carousel.VideoSlide: loop?: boolean — default true (the chosen video-default behaviour)
  - Carousel.VideoSlide: controls?: boolean — default false (chosen default = no controls)
  - Carousel.VideoSlide: fit?: "cover" | "contain" — object-fit (default cover)
  - Carousel.VideoSlide: duration?: number — same as Carousel.Slide; overrides autoplay timing for THIS slide
  - Carousel.Dots: position?: "below" | "overlay"
  - Carousel.Arrows: position?: "overlay" | "outside"
when_to_use: Anywhere a horizontal stack of slides cycles automatically or on user input — marketing hero rotations, featured rails on a TV / streaming app, onboarding tours, image galleries, product carousels, testimonial cycles. Mixed video + still slides are a first-class case; the VideoSlide handles muted-autoplay + poster swap on activation.
composes_with: [MediaSurface, Card, Stack, Row]
aliases: [carousel, slideshow, slider, hero rotation, image gallery, featured row, swipe deck, paged view, page tabview, page view, swiper, react native swiper, page control]
---

```jsx
<Carousel autoplay={{ delay: 6000 }} loop>
  <Carousel.Slide duration={15000}>
    <MediaSurface aspect="wide" hint="poster" alt="Featured: Severance S2" />
  </Carousel.Slide>

  <Carousel.VideoSlide
    src="/trailers/the-studio.mp4"
    poster="/posters/the-studio.jpg"
    alt="The Studio — official trailer"
  />

  <Carousel.Slide>
    <MediaSurface aspect="wide" hint="poster" alt="Coming soon: Foundation S3" />
  </Carousel.Slide>

  <Carousel.Arrows />
  <Carousel.Dots position="overlay" />
</Carousel>
```

### Anti-patterns

DO NOT confuse `<Carousel>` with `<Slider>`. `Slider` is the range input (a draggable thumb on a track) — the colloquial "slider" you'd put on a marketing page is a `Carousel`. When the user says "add a slider", check whether they want a range control or a slideshow before reaching for either.

DO NOT pass real `<img>` or `<video>` tags directly as `Carousel.Slide` children when the slide is meant to be a hero media tile. Use `<MediaSurface>` (still slots) or `<Carousel.VideoSlide>` (video slots) so themes, aspect ratios, and the future image-generation pipeline stay consistent. Raw `<img>` inside a slide is fine for fully-authored content (logo strips, certificates), but for "media that might get regenerated" the surface primitive is mandatory.

DO NOT set very short `duration` values (sub-2000ms) on still slides — the autoplay timer ignores the request implicitly when the carousel is paused (hover, offscreen) but very fast cycles read as broken to users. 5-15 seconds per slide is the natural range.

DO NOT mount the autoplay timer inside individual slides via `setInterval` and forget to clean up — use `<Carousel.Slide duration>` instead. The carousel root owns the single timer; per-slide overrides feed into it through a context-shared ref.
