# Using @gradeui/ui (for AI agents)

You are generating UI with the Grade Design System. This package is **self-describing** —
everything you need ships in the installed package. Read the comprehensive spec first:

- **`@gradeui/ui/DESIGN.md`** — the whole design system in one file: foundations
  (themes, colour scopes, expressive accents, typography, spacing) + every component
  sidecar (when_to_use, props, examples). **Read this before generating markup.**
- **`@gradeui/ui/contracts`** — programmatic prop schemas: `import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts"`.
- **`@gradeui/ui/styles.css`** — precompiled styles (or wire `@gradeui/ui/styles/globals.css` into Tailwind v4).

## The one rule you must not break

A page is an ordered stack of `Section` bands, and **every `Section` wraps a `Container`**:

```jsx
<Section scope="inverse" pad="xl">
  <Container maxW="lg">{/* content */}</Container>
</Section>
```

Full-bleed = `<Container maxW="full">`, never omitting the Container. This holds for
app content regions too, not just marketing. **Never** hand-roll
`<section className="py-20">` or `<div className="max-w-7xl mx-auto px-6">` — that
div-soup is exactly what `Section` + `Container` replace.
