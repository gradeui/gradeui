---
foundation: typography
font_roles: [display, body, mono, accent]
steps: [display, h1, h2, h3, h4, h5, h6, body, small, caption]
tokens: ["--text-display", "--text-h1..--text-h6", "--text-body", "--text-small", "--text-caption", "--text-label", "--text-overline", "--font-display", "--font-body", "--font-mono", "--font-accent"]
---

# Typography

Type is theme-owned and token-bound. A style never names a raw font family or a
`tracking-*` utility — it picks a **role** and rides the theme's scale, so it stays
portable and re-themeable.

## Font roles

- **display** — headings / large type (`--font-display`, `font-display` utility).
- **body** — the workhorse (`--font-body`).
- **mono** — code / tabular (`--font-mono`).
- **accent** — supplementary display face for eyebrows, pull quotes, stylised bits
  (`--font-accent`, `font-accent` utility); defaults to Instrument Serif, overridable.

## The step ladder

Named steps that screens actually use, each emitted as a `--text-*` token with its
companion line-height / letter-spacing / weight:

```
display · h1 · h2 · h3 · h4 · h5 · h6 · body · small · caption
```

Plus the supporting tokens `--text-label`, `--text-overline`, and the raw size ladder
(`--text-2xs … --text-7xl`). Size always comes from the modular scale; weight,
leading, and tracking cascade **base default → base style → step override**.

Base styles (the mixers each step inherits from): **Body / Header / Mono / Prose**.
`h*` steps inherit Header; the rest inherit Body. Prose is the typography of a
markdown/rich-text tree (the Tailwind `prose` surface) and reuses the base styles, so
restyling the Header base restyles both app headings and prose headings.

## Usage

Prefer the Section heading parts and semantic elements over hand-sized text:

```jsx
<Section pad="xl">
  <Container maxW="lg">
    <SectionEyebrow>New</SectionEyebrow>      {/* overline / accent */}
    <SectionTitle>Own the components.</SectionTitle>   {/* display / h1 */}
    <SectionSubtitle>Ship on your subscription.</SectionSubtitle>
  </Container>
</Section>
```

## Rules

- **Token-bound, never raw.** Reference roles and `--text-*` steps; don't emit literal
  `font-family`, px sizes, or `tracking-[...]` values.
- **Weight is per style**, not a single global heading knob.
- The modular scale can differ per breakpoint (mobile drops a step); only sizes change,
  leading/tracking/weight ride along.
