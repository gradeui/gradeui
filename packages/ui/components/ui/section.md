---
name: Section
import: "@gradeui/ui"
subcomponents: [Container, SectionEyebrow, SectionTitle, SectionSubtitle, SectionDescription, SectionActions, SectionMedia]
props:
  - Section: scope? (default | inverse | brand | accent | muted | card) — colour SUBTHEME; applies the `scope-*` class so the whole band re-tones (bg/fg/card/muted/border) while action colours stay vivid. Unset = the page surface. See STUDIO-COLOR.md.
  - Section: background?: ReactNode — visual band background slot: image / video / gradient / shader (drop a <BackgroundFill> here). Renders BEHIND the content; Section owns the relative/overflow/z plumbing. Works with `scope` (which re-tones the content tokens so text stays legible over the media).
  - Section: pad? (none | sm | md | lg | xl) — vertical rhythm (responsive py); default lg. Section is ALWAYS full width — it never sets a max width.
  - Section: as? (section | header | footer | div) — semantic element; default section.
  - Container: maxW? (sm | md | lg | xl | prose | full) — centred max width + gutters; default lg. The MEASURE.
  - Container: grid?: boolean — snap children to a 12-column grid (use `col-span-*` on children); default false.
  - Container: as? (div | section) — semantic element; default div.
when_to_use: THE page scaffold. A page is an ordered stack of Sections — every distinct band (hero, logos, features, pricing, testimonial, CTA, footer) gets its OWN Section so each is independently themeable. `Section` is the full-width band (scope + vertical rhythm); drop a `Container` inside it for a measure, or omit the Container for a full-bleed band. Reach for Section/Container instead of hand-rolling `<section className="py-20"><div className="max-w-7xl mx-auto px-6">`. The content inside is free — use the parts (SectionEyebrow/Title/Subtitle/Description/Actions/Media) for the common heading+copy+CTA+media shape, or drop any JSX. SectionMedia is a slot for any media (MediaSurface image, Carousel, VideoPlayer, embed, or a whole app UI). Don't use Section for app chrome — that's AppShell.
composes_with: [Container, MediaSurface, Carousel, VideoPlayer, Button, Badge, Card, Grid, Stack]
aliases: [section, band, hero section, page section, content section, marketing section, landing section, full bleed, container, max width wrapper, page band, section block]
---

```jsx
// A page is a stack of Sections. Each band picks a scope; a Container
// holds the measure (omit it to let the band bleed full-width).
<Section scope="inverse" pad="xl">
  <Container maxW="lg">
    <SectionEyebrow>New</SectionEyebrow>
    <SectionTitle>Use the agent you prefer.</SectionTitle>
    <SectionSubtitle>Own the components. Ship on your subscription.</SectionSubtitle>
    <SectionActions>
      <Button size="lg">Open Studio</Button>
      <Button size="lg" variant="outline">Docs</Button>
    </SectionActions>
  </Container>
</Section>
```

```jsx
// Full-bleed media band — no Container, so the media spans edge to edge.
// The scope re-tones the band; the media frames itself.
<Section scope="card" pad="lg">
  <SectionMedia>
    <MediaSurface hint="Studio canvas" alt="A generated screen" className="aspect-[21/9] w-full" />
  </SectionMedia>
</Section>
```

```jsx
// Contained content on a grid — children snap to the 12-col Container grid.
<Section pad="lg">
  <Container grid>
    <div className="col-span-12 md:col-span-7">{/* lead */}</div>
    <div className="col-span-12 md:col-span-5">{/* aside */}</div>
  </Container>
</Section>
```
