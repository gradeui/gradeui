---
name: SectionBlock
import: "@gradeui/ui"
props:
  - padding? (none | sm | md | lg | xl) — vertical rhythm. Defaults to `lg`.
  - background? (transparent | muted | card | primary | gradient) — tonal direction of the section bg.
  - surface? (solid | translucent | glass | glass-strong) — what the section is *made of*. Orthogonal to `background`. Use `glass` for hero sections that float over a generative backdrop / image / dot grid.
  - container? (default | wide | narrow | full) — max-width of the inner content.
  - alignment? (left | center | right) — header / CTA alignment.
  - titleSize? (sm | md | lg | xl)
  - title?: string
  - subtitle?: string
  - cta1? / cta2? — string or `{ text, variant, href, onClick }` config
  - backgroundImage?: string — direct CSS background image url
  - as? "section" | "div" | "article" — semantic root
  - fullBleed?: boolean
when_to_use: The top-level container for a marketing page section — hero, feature row, pricing table, testimonial strip, FAQ section. Always reach for SectionBlock over a hand-rolled `<section>` so vertical rhythm, container width, and tonal background stay consistent across the page. Pair `background="gradient"` + `surface="glass"` inner Cards for the "modern marketing hero" pattern.
composes_with: [Card (the most common child — especially with surface="glass"), Grid (feature rows), Stack (hero column), MediaSurface (hero imagery), Code (developer hero), Carousel (logo strips)]
aliases: [section, section block, hero section, marketing section, page section, content section, container section, feature section, hero, page hero, marketing hero, glass section, gradient section, mesh hero]
---

SectionBlock is the **container axis** of a marketing page; Card is the **content axis** inside it. Three Presence axes still apply to SectionBlock: `background` (tonal direction), `surface` (material), `padding` (depth of vertical rhythm).

---

### Scenario 1 — Standard feature row (default)

You're laying out a feature section on a marketing page — a row of cards explaining capabilities. Calm tonal background, generous padding, default container width.

```jsx
<SectionBlock
  padding="lg"
  background="muted"
  title="Built for production"
  subtitle="The hard primitives every team eventually needs."
  alignment="center"
>
  <Grid cols="3" gap="md">
    <Card>
      <CardHeader>
        <Database className="h-5 w-5" />
        <CardTitle>Data tables</CardTitle>
        <CardDescription>Sorting, filtering, virtualisation.</CardDescription>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <Map className="h-5 w-5" />
        <CardTitle>Maps</CardTitle>
        <CardDescription>MapLibre default. Mapbox + Google adapters.</CardDescription>
      </CardHeader>
    </Card>
    <Card>
      <CardHeader>
        <MoveVertical className="h-5 w-5" />
        <CardTitle>Drag and drop</CardTitle>
        <CardDescription>dnd-kit underneath, themed against tokens.</CardDescription>
      </CardHeader>
    </Card>
  </Grid>
</SectionBlock>
```

No `surface` prop. The default `solid` is the right answer for in-flow feature rows — the muted background sets the section apart from neighbouring sections cleanly.

---

### Scenario 2 — Gradient hero with glass cards (modern marketing pattern)

The canonical "shadcn-killer marketing hero" pattern. SectionBlock supplies the gradient mesh; Card children opt into glass; the two compose without either having to know about the other.

```jsx
<SectionBlock
  padding="xl"
  background="gradient"
  alignment="center"
  title="Open the markup. Tell me which one you would merge."
  subtitle="GradeUI produces code you would actually integrate."
  cta1={{ text: "Open Studio", href: "/studio" }}
  cta2={{ text: "Install the library", variant: "outline" }}
>
  <Grid cols="2" gap="md" className="mt-8">
    <Card surface="glass" className="shadow-elevation-4">
      <CardHeader>
        <CardTitle>v0 — sidebar component</CardTitle>
        <CardDescription>~300 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={v0Code} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>

    <Card surface="glass" className="shadow-elevation-4 gds-aura-ring">
      <CardHeader>
        <CardTitle>GradeUI — sidebar component</CardTitle>
        <CardDescription>6 lines</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Code source={gradeCode} language="tsx" bare className="p-4 text-xs max-h-72" />
      </CardContent>
    </Card>
  </Grid>
</SectionBlock>
```

This is the pattern the home-diff-hero scaffold uses. `background="gradient"` paints the mesh; the Cards float through it via `surface="glass"`; `gds-aura-ring` on the second card draws the eye to the recommended path. No Tailwind soup anywhere.

---

### Scenario 3 — Glass section over a backgroundImage (image hero)

You're using a hero image as the section background. A solid section panel over it would defeat the image. A glass section keeps the image visible while focusing the eye on the content overlay.

```jsx
<SectionBlock
  padding="xl"
  surface="glass"
  backgroundImage="/hero/teams-shipping.jpg"
  alignment="center"
  title="For teams shipping software"
  subtitle="The primitive layer modern product teams actually use."
  cta1={{ text: "Open Studio" }}
  container="narrow"
>
  <Row justify="center" gap="lg" className="text-sm text-muted-foreground">
    <span>Linear</span><span>Vercel</span><span>Stripe</span><span>Anthropic</span>
  </Row>
</SectionBlock>
```

`background` stays at the default `transparent` so the image shows through; `surface="glass"` paints the frosted overlay on top with edge highlight + theme-tuned blur. The narrow container caps content width so the hero stays readable over the image.

---

### Anti-patterns

**DO NOT roll glass by hand at the section level.**

```jsx
{/* ❌ */}
<section className="py-20 bg-card/40 backdrop-blur-md">

{/* ✅ */}
<SectionBlock surface="glass" padding="xl">
```

**DO NOT use `background="primary"` + `surface="glass"`.** The primary fill is intentionally opaque (it's a brand statement). Layering glass on top makes the brand colour read as washed-out. Pick one signal.

**DO NOT skip SectionBlock for marketing rows.** Hand-rolling `<section className="py-20">` means every section gets a slightly different vertical rhythm and container width — the page reads as drift. SectionBlock is the rhythm primitive.

**DO NOT use `padding="xl"` for in-app sections.** xl padding is marketing-page territory. In-app section breaks should use `sm` or `md` — anything more and your dashboard reads as a marketing page.

**DO NOT use `surface="glass-strong"` on SectionBlock unless the section is acting as a full-page overlay.** It's tuned for very heavy de-emphasis of what's underneath; on a regular section it just looks washed-out.
