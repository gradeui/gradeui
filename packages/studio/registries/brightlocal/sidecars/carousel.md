---
name: Carousel
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/carousel"
subcomponents: [CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselDots]
props:
  - orientation? (horizontal | vertical)
  - opts? — TODO(review): type + one-line description from src
  - plugins? — TODO(review): type + one-line description from src
  - setApi? — TODO(review): type + one-line description from src
  - lazyLoad? — TODO(review): type + one-line description from src
  - overscan? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
