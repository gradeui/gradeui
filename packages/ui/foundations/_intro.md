---
title: Grade Design System — read this first
audience: any AI agent or developer consuming @gradeui/ui
---

# Grade Design System (@gradeui/ui)

This package is **self-describing**. Everything an agent needs to generate correct
Grade UI ships inside the installed npm package — you do not need the source repo,
the website, or any external docs. Treat this document as the single comprehensive
design spec: read it before generating markup.

## The non-negotiable page scaffold

**A page is an ordered stack of `Section` bands, and every `Section` wraps a `Container`.**

```jsx
<Section scope="inverse" pad="xl">
  <Container maxW="lg">
    {/* content */}
  </Container>
</Section>
```

- `Section` = the full-width themeable band (colour `scope` + vertical `pad`). It is
  ALWAYS full width and never sets a max width.
- `Container` = the measure (centred `maxW` + gutters). For an edge-to-edge band use
  `<Container maxW="full">` — that is how you go full-bleed. **You never omit the Container.**
- This holds for app content regions too, not just marketing pages. `AppShell` is only
  the outer chrome; the regions inside it are still `Section` → `Container`.

**Never hand-roll** `<section className="py-20">` or `<div className="max-w-7xl mx-auto px-6">`.
That raw markup is exactly what `Section` + `Container` replace. Reaching for div-soup
instead of the primitives is the single most common mistake — don't make it.

## How the system is organised

1. **Foundations** (this folder / the sections below) — the *rules* that aren't components:
   themes, colour scopes, expressive accents, typography, spacing & layout.
2. **Components** — every component ships a sidecar (`when_to_use`, `composes_with`,
   `props`, worked examples + anti-patterns). The component reference follows the foundations.
3. **Machine-readable contracts** — `import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts"`
   gives programmatic prop schemas (zod), descriptions, aliases, and composition data.
4. **Theme engine** — `import { generateTheme, GradeThemeProvider } from "@gradeui/ui"`.
5. **Styles** — `import "@gradeui/ui/styles.css"` (precompiled) or wire the source
   `@gradeui/ui/styles/globals.css` into your own Tailwind v4 build.

## Token namespace

Runtime tokens live under `--gds-*` (CSS custom properties), `gds-*` (class prefix),
`--ramp-*` (per-step OKLCH colour ramps), and the active theme is set via the
`data-grade-theme` attribute on `<html>`.
