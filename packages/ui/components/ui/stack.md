---
name: Stack
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — vertical gap between children
  - align?: "start" | "center" | "end" | "stretch" (default "stretch") — cross-axis (horizontal) alignment of children
  - justify?: "start" | "center" | "end" | "between" | "around" | "evenly" (default "start") — main-axis (vertical) distribution. Reach for this on absolute-positioned overlays (`justify="end"` pins children to the bottom) and split footers (`justify="between"`).
  - asChild?: boolean (default false) — render as the child element via Slot, so `<Stack asChild><section>…</section></Stack>` stamps Stack's classes onto the `<section>` rather than nesting a wrapper div
  - className?: string
  - children: React.ReactNode
when_to_use: Default top-level layout inside the main slot when composing two or more stacked regions (hero + content + footer, auth card + subtext, etc.). Prefer Stack over hand-rolled `flex flex-col gap-*` so the vertical rhythm is editable through the settings panel.
composes_with: [Section, Row, Split, Hero, any content component]
aliases: [stack, vstack, vertical, column, vertical layout, v-stack, vertical stack, lazyvstack]
---

```jsx
<Stack gap="lg">
  <Hero>…</Hero>
  <Section>…</Section>
  <Section>…</Section>
</Stack>
```

```jsx
// Narrow centred column for auth / marketing copy.
<Stack gap="md" align="center" className="max-w-md mx-auto">
  <CardTitle>Sign in</CardTitle>
  <Input placeholder="Email" />
  <Input placeholder="Password" type="password" />
  <Button className="w-full">Continue</Button>
</Stack>
```

```jsx
// Hero overlay pinned to the bottom — use `justify="end"`, NOT
// `className="flex flex-col justify-end"`. Stack is already a flex
// column, so `flex flex-col` in className is dead weight.
<Stack justify="end" gap="md" className="absolute inset-0 p-10 max-w-2xl">
  <Badge>Featured</Badge>
  <h1 className="text-5xl font-semibold">Severance</h1>
  <Button>Play</Button>
</Stack>
```

### Anti-patterns

DO NOT add `flex flex-col` to Stack's className — Stack already applies `flex flex-col` as its base. Same for Row + `flex flex-row`. These are the literal definitions of the primitives.

DO NOT reach for `className="justify-end"` (or `justify-between`, etc.) when the new `justify` prop covers it. Inline-Tailwind layout escapes are how scaffolds slowly drift away from the design system — keep them in props so the settings panel can mutate them.
