---
name: Card
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/card"
subcomponents: [CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardMedia, CardContent]
variants: [filled, transparent, border, transparent-flush]
props:
  - density? (default | condensed)
  - align? (left | center | right)
  - maxWidth? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - maxWidth — DEPRECATED since 2.16.0: Use Tailwind max-width utilities via className instead (DS-578)
when_to_use: Grouping related content with a visual boundary (form sections, detail panels, stat cards) Page-level content containers that need consistent padding and border styling Nested sub-sections within a parent card — use density='condensed' for compact inline panels (e.g., stat summaries, ranking grids, metric tiles) Do NOT use for: clickable list items (use List); modal content (use Dialog). LAYOUT RULE: CardHeader is a grid (title 1fr, CardAction natural-width) — keep CardAction SMALL (one or two buttons, a badge). NEVER put a search input, filter bar, or toolbar in CardAction; the wide action column squeezes the title into a sliver. Toolbars and search rows belong in CardContent, above the data they control.
aliases: [container, panel, box, wrapper, content card]
---

```jsx
<Card variant="filled" dataHook="example-card">
  <CardHeader dataHook="example-card-header">
    <CardTitle dataHook="example-card-title">Card Title</CardTitle>
    <CardDescription dataHook="example-card-description">Card description text.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button dataHook="action-button">Action</Button>
  </CardFooter>
</Card>
```
```jsx
import { AspectRatio } from "@brightlocal/ui-components/aspect-ratio";

<Card variant="filled" dataHook="product-card">
  <CardMedia>
    <AspectRatio ratio={4 / 3} dataHook="product-image">
      <img src="product.jpg" alt="Product" className="size-full object-cover" />
    </AspectRatio>
  </CardMedia>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Product description here.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Details...</p>
  </CardContent>
  <CardFooter>
    <Button dataHook="buy-button">Buy Now</Button>
  </CardFooter>
</Card>
```
```jsx
<Card variant="filled" dataHook="narrow-card" className="max-w-sm">
  <CardContent>Constrained to max-w-sm (384px)</CardContent>
</Card>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-card--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
