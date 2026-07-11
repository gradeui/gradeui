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

Horizontal scrollable content viewer with navigation controls.

## Guidance

Carousel displays a scrollable series of content items with navigation controls. Built on [Embla Carousel](https://www.embla-carousel.com/).

### When to Use
- Image galleries and product showcases
- Testimonial sliders and content carousels
- Multi-step wizards with slide transitions

### Features
- Horizontal and vertical orientations
- Keyboard navigation support (arrow keys)
- Responsive slide sizing with CSS
- Previous/Next navigation buttons
- Touch-enabled sliding with momentum
- API access for programmatic control

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "carousel") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
