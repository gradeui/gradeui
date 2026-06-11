---
name: Button
import: "@gradeui/ui"
variants: [default, destructive, outline, secondary, ghost, link, raised]
sizes: [sm, md, lg, icon]
props:
  - variant? (default | destructive | outline | secondary | ghost | link | raised) — `raised` here is a back-compat alias (the raised TRAIT on a neutral key surface); prefer the `raised` prop
  - raised?: boolean — presence TRAIT: tactile elevation (bevel + drop + hover glow + pressed sink) layered onto ANY variant — raised primary, raised outline, etc. Glow tone reads --btn-glow → --accent-glow → --selected-glow; override per-button via style={{ "--btn-glow": "var(--warning)" }}
  - size? (sm | md | lg | icon) — t-shirt scale aligned with Tabs/ToggleGroup heights (sm=h-7, md=h-8, lg=h-10). `default` still works as an alias for `md`.
  - asChild?: boolean — renders as the child element (use to wrap <a>/<Link>)
  - disabled?: boolean
  - All native button HTML attrs (onClick, type, etc.)
when_to_use: Any clickable action. Use size="icon" for square icon-only buttons, variant="link" for inline links that should look like Button, the `raised` prop for high-commitment / weighty actions where the chrome can afford a tactile "physical key" treatment (composes with any variant; variant="raised" remains the neutral-key alias). A Button placed next to a TabsList of the same size lines up edge-to-edge without per-call overrides.
composes_with: [Dialog, DropdownMenu, Tooltip, Card (in CardFooter), Row, Form controls]
aliases: [button, push button, plain button, bordered button, destructive button, capsule button, link button, action button, cta, raised button, pill button, key button]
---

```jsx
<Button>Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button size="icon" variant="ghost"><Mail /></Button>
```

```jsx
// Lined up next to a TabsList — same size = same height.
<Row gap="sm" align="center">
  <TabsList size="sm">
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="open">Open</TabsTrigger>
  </TabsList>
  <Button size="sm">New issue</Button>
</Row>
```

```jsx
// Raised TRAIT — tactile bevel + drop shadow + ambient hover glow,
// layered onto any variant (raised primary, raised outline, ...).
// Composed from the Presence elevation tokens (--elevation-3 rest,
// --elevation-hot hover, --elevation-pressed active). Tone is driven
// by --btn-glow, which defaults to --selected-glow (blue). Override
// per-button for "traffic light" semantics:
<Row gap="sm">
  <Button raised>Raised primary</Button>
  <Button variant="outline" raised>Raised outline</Button>
  <Button raised style={{ "--btn-glow": "var(--warning)" }}>
    Iterate
  </Button>
  <Button raised style={{ "--btn-glow": "var(--success)" }}>
    Ship it
  </Button>
</Row>
```

```jsx
// data-state="on" / aria-pressed="true" gives the held-down "key
// pressed" look — picks up the --selected blue stroke + heat-inner
// glow. Works as a Toggle/ToggleGroupItem child via asChild.
<Button raised data-state="on">Locked</Button>
```

```jsx
// Combine with Aura for AI-attention states. The three Aura styles
// (ring/gradient/shimmer) stack independently of the variant.
<Button raised className="gds-aura-ring">
  Studio is reviewing this
</Button>
```
