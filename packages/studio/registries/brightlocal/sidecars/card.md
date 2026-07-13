---
name: Card
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/card"
subcomponents: [CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardMedia, CardContent]
variants: [filled, transparent, border, transparent-flush]
props:
  - variant? (filled | transparent | border | transparent-flush) — Visual style variant of the card (default "filled")
  - density? (default | condensed) — Spacing density of the card (default "default")
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - maxWidth? — DEPRECATED: Use Tailwind max-width utilities via className instead (e.g., className="max-w-sm"). (Maximum width of the card (e.g., "420px", "600px", "100%"). Cards are full-width by default — use className="max-w-[400px]" instead.)
  - align? (left | center | right) — CardHeader: Content alignment within the header. Use `"center"` for status screens with an illustration above heading and description. (default "left")
  - size? (small | default) — CardTitle: Title text size. (default "default")
when_to_use: Grouping related content with a visual boundary (form sections, detail panels, stat cards) Page-level content containers that need consistent padding and border styling Nested sub-sections within a parent card — use density='condensed' for compact inline panels (e.g., stat summaries, ranking grids, metric tiles) Do NOT use for: clickable list items (use List); modal content (use Dialog). LAYOUT RULE: CardHeader is a grid (title 1fr, CardAction natural-width) — keep CardAction SMALL (one or two buttons, a badge). NEVER put a search input, filter bar, or toolbar in CardAction; the wide action column squeezes the title into a sliver. Toolbars and search rows belong in CardContent, above the data they control.
aliases: [container, panel, box, wrapper, content card]
---

```jsx
// STAT-SUMMARY CARD (from the Location Dashboard lab composition):
// an outer Card with a grid of NESTED density="condensed" Cards as
// metric tiles — label, big value, delta Badge. This is the canonical
// "nested sub-sections within a parent card" pattern from when_to_use.
<Card variant="filled" dataHook="customer-actions-card" className="max-w-md">
  <CardHeader dataHook="customer-actions-header">
    <CardTitle>Customer actions</CardTitle>
    <CardDescription>This month vs last month</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid gap-3">
      <Card density="condensed" variant="filled" dataHook="call-clicks-tile">
        <CardContent>
          <p className="text-sm text-muted-foreground">Call clicks</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">312</span>
            <Badge dataHook="call-clicks-delta">↑ 8%</Badge>
          </div>
        </CardContent>
      </Card>
      <Card density="condensed" variant="filled" dataHook="website-clicks-tile">
        <CardContent>
          <p className="text-sm text-muted-foreground">Website clicks</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">1,847</span>
            <Badge dataHook="website-clicks-delta">↑ 14%</Badge>
          </div>
        </CardContent>
      </Card>
      <Card density="condensed" variant="filled" dataHook="direction-requests-tile">
        <CardContent>
          <p className="text-sm text-muted-foreground">Direction requests</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold">428</span>
            <Badge variant="destructive" dataHook="direction-requests-delta">↓ 3%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  </CardContent>
</Card>
```
```jsx
// ENTITY CARD (Location Dashboard lab): identity header with a status
// Badge in CardAction (keep CardAction SMALL — see the LAYOUT RULE),
// meta rows in CardContent, photo in CardMedia.
<Card variant="filled" dataHook="location-card" className="max-w-sm">
  <CardHeader dataHook="location-card-header">
    <CardTitle>Bailiffscourt Hotel &amp; Spa</CardTitle>
    <CardDescription>★ 4.4 (764 reviews)</CardDescription>
    <CardAction>
      <Badge dataHook="location-status">Active</Badge>
    </CardAction>
  </CardHeader>
  <CardContent>
    <div className="grid gap-1 text-sm text-muted-foreground">
      <span>Littlehampton, BN17 5RW</span>
      <span>Hotel</span>
      <span>+44 1903 723511</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" dataHook="view-location-button">View location</Button>
  </CardFooter>
</Card>
```
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
