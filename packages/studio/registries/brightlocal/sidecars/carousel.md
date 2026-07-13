---
name: Carousel
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/carousel"
subcomponents: [CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - opts? — Embla carousel options
  - plugins? — Embla carousel plugins
  - orientation? — Carousel orientation (default "horizontal")
  - setApi? — Callback to receive the carousel API instance
  - lazyLoad?: boolean — Enable lazy loading to only mount slides near the viewport. Off-screen slide children are not rendered until they scroll into view. (default false)
  - overscan?: number — Number of off-screen slides to pre-render on each side of the viewport. Only applies when `lazyLoad` is enabled. (default 1)
  - variant? — CarouselPrevious: Visual style variant of the button (default "outline")
  - size? — CarouselPrevious: Size variant of the button (default "default")
  - hideWhenDisabled?: boolean — CarouselPrevious: Hide the button instead of disabling it when there are no previous slides (default false)
  - ariaLabel?: string — CarouselPrevious: Accessible label for the previous slide button. (default "Previous) slide"
---

```jsx
<Carousel dataHook="my-carousel">
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
    <CarouselItem>Slide 3</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselDots className="mt-4" />
</Carousel>
```
```jsx
<Carousel dataHook="gallery" lazyLoad overscan={1}>
  <CarouselContent>
    {images.map((src) => (
      <CarouselItem key={src}>
        <img src={src} loading="lazy" />
      </CarouselItem>
    ))}
  </CarouselContent>
</Carousel>
```
```jsx
<CarouselPrevious ariaLabel={t("carousel.prev")} />
<CarouselNext ariaLabel={t("carousel.next")} />
<CarouselDots
  ariaLabel={t("carousel.dotNav")}
  slideAriaLabel={t("carousel.goToSlide", { slide: 1 })}
/>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-carousel--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
