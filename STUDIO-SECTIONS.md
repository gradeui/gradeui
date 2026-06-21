# Studio Sections — the page scaffold

How a page is built in Grade: as an ordered stack of **sections**. The system
constrains the *scaffold* — one section per distinct idea — and leaves the
content inside each one free. Structure and design intent for every piece; no
constraint on what fills it.

> Status: design direction, drafted 2026-06-20. Sibling of
> [`STUDIO-COLOR.md`](./STUDIO-COLOR.md) (the colour scopes a section wears) and
> [`STUDIO-TYPOGRAPHY.md`](./STUDIO-TYPOGRAPHY.md).

---

## The opinion

A page is a list of sections. Each distinct piece of content — hero, logos,
features, a metrics band, a testimonial, a CTA — gets **its own section**. The
test: a 15-section homepage where every section is independent of the others,
independently themeable. That's how most mature design systems work, and it's
what gives every band structure and design intent.

This is a deliberate constraint on the *scaffold*, not the *content*. Inside a
section you can put anything (it's usually finite, but it's free). The system's
opinion is only: **distinct idea → new section**, and **every section is themeable
and laid out on purpose.**

## Scaffold vs content

The single most important boundary:

- **Section = scaffold.** It owns three things: a colour **scope** (subtheme),
  a **width** (containment), and **vertical padding** (rhythm). Nothing else.
- **Content = free.** The children are whatever the section is about. Standard
  content *blocks* (below) are offered out of the box but never required.

Today's `SectionBlock` conflates the two — it bakes `title` / `subtitle` /
`cta1` / `cta2` props, which constrains the output. The lean `Section` drops all
of that. `SectionBlock` can stay as an opinionated convenience (or be rebuilt on
top of `Section`); `Section` is the primitive pages are authored from.

## The primitives: `Section` + `Container`

Convention splits the band from the measure. **`Section` is the full-width band**
(it never constrains width); **`Container` is the measure** you drop inside it
when you want a max-width. Omit the Container for a full-bleed band.

```tsx
<Section scope="inverse" pad="xl">      {/* full-width band */}
  <Container maxW="lg">                   {/* the measure */}
    <SectionTitle>Use the agent you prefer.</SectionTitle>
    <SectionActions><Button>Open Studio</Button></SectionActions>
  </Container>
</Section>
```

**Section** — the band. Full width, always.

| prop    | values                                              | default      | does |
| ------- | --------------------------------------------------- | ------------ | ---- |
| `scope` | `default · inverse · brand · accent · muted · card` (+ authored) | unset (page) | applies `scope-*` — re-tones the subtree (bg/fg/card/muted/border), action colours stay vivid. See STUDIO-COLOR.md. |
| `pad`   | `none · sm · md · lg · xl`                           | `lg`         | vertical rhythm (responsive `py`). |
| `as`    | `section · header · footer · div`                   | `section`    | semantic element. |

**Container** — the measure. Drop inside a Section to constrain content; omit for full-bleed.

| prop   | values                             | default | does |
| ------ | ---------------------------------- | ------- | ---- |
| `maxW` | `sm · md · lg · xl · prose · full` | `lg`    | centred max-width + gutters. |
| `grid` | boolean                            | `false` | snap children to a 12-column grid. |
| `as`   | `div · section`                    | `div`   | semantic element. |

Container is generic — reach for it anywhere you'd hand-roll `max-w-7xl mx-auto px-6`.

A page is then literally:

```tsx
<Section scope="inverse" pad="xl"><Container>…hero…</Container></Section>
<Section scope="muted" pad="md"><Container>…logos…</Container></Section>
<Section><Container>…features…</Container></Section>
<Section scope="card">…full-bleed media…</Section>
<Section scope="brand"><Container maxW="md">…testimonial…</Container></Section>
<Section as="footer" scope="card"><Container>…footer…</Container></Section>
```

Each band is one decision: a scope and its rhythm. Contain the content or let it
bleed. The scope class paints the band and re-tones everything inside, so a
section moved into a dark band re-themes by itself.

## Section parts (the known vocabulary)

A section is free, but the *recurring* pieces are known, named, and styled — so
they carry design intent and are selectable/editable in Studio without being
required. Composable parts, not baked props:

```tsx
<Section scope="inverse" pad="xl">
  <SectionEyebrow>New</SectionEyebrow>
  <SectionTitle>Use the agent you prefer.</SectionTitle>
  <SectionSubtitle>Own the components. Ship on your subscription.</SectionSubtitle>
  <SectionDescription>Longer supporting copy…</SectionDescription>
  <SectionActions>
    <Button>Open Studio</Button>
    <Button variant="outline">Docs</Button>
  </SectionActions>
  <SectionMedia>{/* carousel · image · video · embed · full app UI */}</SectionMedia>
</Section>
```

| part                 | is                              |
| -------------------- | ------------------------------- |
| `SectionEyebrow`     | small label above the title (badge/kicker). |
| `SectionTitle`       | the section heading (`h2`). |
| `SectionSubtitle`    | the lead line under the title. |
| `SectionDescription` | supporting body copy. |
| `SectionActions`     | the CTA group (wraps Buttons; alignment-aware). |
| `SectionMedia`       | a **slot** — holds *any* media: single image (MediaSurface), Carousel, VideoPlayer, an embed, or a full app UI. The section doesn't care what's inside. |

Parts are offered, never required — drop raw JSX instead whenever the section
wants something the vocabulary doesn't cover. They give the 80% case (heading +
copy + CTAs + media) consistent type scale, rhythm, and Studio selection, while
the section stays open underneath.

## Content blocks (the next layer)

Sections hold content; **content blocks** are the standard, out-of-the-box
contents — opinionated but optional primitives that live *inside* a section:

- **Bento** — asymmetric tile grid.
- **Marquee** — auto-scrolling logo / proof strip.
- **Metrics** — big-number stat row.
- **MediaSurface** (shipped) — image / video slot.
- **Logos** — proof strip (static).
- **FeatureGrid**, **PricingTiers**, **Testimonial** — recurring marketing shapes
  (already surfacing as DS gaps across the playground scaffolds).

These are a later layer. The boundary stays clean: **Section owns theme + layout
+ rhythm; blocks own content.** A block never sets a scope or a band width — it's
content, dropped into a section that does.

## Why this shape

- **Section-first generation.** Once `Section` is the one page-building primitive
  in the allowlist, generated pages come out section-first by construction —
  every distinct band already independent and themeable.
- **Theming is per-section, free.** The scope lives on the section, so re-skinning
  band-by-band is a single prop, not a refactor.
- **Editable scaffold.** Scope / width / pad are enum props, so the Studio
  inspector exposes them as the section's controls — the design intent is
  visible and adjustable, the content is free underneath.

## Open / next

- Ship lean `Section` (scope · width · pad · maxW · as) + allowlist it. *(now)*
- `grid` width: define the column model children snap to (12-col? token gap?).
- Authored scopes (STUDIO-COLOR.md #33) flow straight into `scope`.
- Content-block library: start with the shapes the playground keeps hand-rolling
  (Bento, Metrics, Marquee, FeatureGrid, PricingTiers).
- Decide `SectionBlock`'s fate: rebuild on `Section`, or keep as a convenience.
