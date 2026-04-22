---
name: Stack
import: "@gradeui/ui"
role: layout
props:
  - gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" (default "md") — vertical gap between children
  - align?: "start" | "center" | "end" | "stretch" (default "stretch") — cross-axis (horizontal) alignment of children
  - asChild?: boolean (default false) — render as the child element via Slot, so `<Stack asChild><section>…</section></Stack>` stamps Stack's classes onto the `<section>` rather than nesting a wrapper div
  - className?: string
  - children: React.ReactNode
when_to_use: Default top-level layout inside the main slot when composing two or more stacked regions (hero + content + footer, auth card + subtext, etc.). Prefer Stack over hand-rolled `flex flex-col gap-*` so the vertical rhythm is editable through the settings panel.
composes_with: [Section, Row, Split, Hero, any content component]
aliases: [stack, vstack, vertical, column, vertical layout]
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
