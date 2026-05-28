---
name: Card
import: "@gradeui/ui"
subcomponents: [CardHeader, CardTitle, CardDescription, CardContent, CardFooter]
props:
  - surface? (solid | translucent | glass | glass-strong) — what the card surface is *made of*. `solid` is the default opaque `bg-card`. `translucent` is ~82% opacity for menu sheets. `glass` is ~58% opacity + 14px blur + edge highlight for floating panels. `glass-strong` is ~42% + 24px blur for full-page overlays. Composes with `shadow-elevation-*` (depth) and `gds-aura-*` (state signal).
  - Each subcomponent accepts native div HTML attrs (className, etc.)
when_to_use: Grouped content with a distinct surface — settings panels, dashboard tiles, list-of-cards layouts, marketing hero containers, AI suggestion overlays. Pair CardHeader (title + description) with CardContent and optional CardFooter (actions). Reach for `surface="glass"` whenever the card sits over a busy backdrop (gradient mesh, dot grid, generative art, image hero).
composes_with: [Button (in CardFooter), Badge, Separator, Avatar, Code, MediaSurface, any form controls]
aliases: [card, group box, groupbox, panel, tile, surface, glass card, frosted card, floating panel, hero card, ai suggestion card, dashboard tile, settings panel]
---

Card is the most common host for the **Presence** system (PRESENCE.md). Three independent axes layer on top of every card:

- **Surface** — what it's made of (`surface` prop: solid / translucent / glass / glass-strong)
- **Elevation** — how high it sits (`shadow-elevation-1..5` utility)
- **Aura** — what it's radiating (`gds-aura-ring`, `gds-aura-gradient`, `gds-aura-shimmer`)

The four scenarios below are the canonical recipes. Match the scenario to the screen you're building.

---

### Scenario 1 — Settings panel (default opaque)

You want a grouped content surface on a normal page: a settings panel, a list-of-cards tile, a dashboard widget. The page background is calm; the card just needs to sit cleanly on it.

```jsx
<Card>
  <CardHeader>
    <CardTitle>Billing</CardTitle>
    <CardDescription>Manage your subscription.</CardDescription>
  </CardHeader>
  <CardContent>
    <Stack gap="md">
      <Row justify="between">
        <span className="text-sm">Plan</span>
        <Badge>Pro</Badge>
      </Row>
      <Row justify="between">
        <span className="text-sm">Renews</span>
        <span className="text-sm text-muted-foreground">12 Jun 2026</span>
      </Row>
    </Stack>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel plan</Button>
    <Button>Update payment</Button>
  </CardFooter>
</Card>
```

No `surface` prop — the default `solid` is the right answer for almost every in-page card. Reach for glass only when there's something behind worth blurring.

---

### Scenario 2 — Glass card over a busy backdrop (marketing hero)

You're building a marketing hero. There's a gradient mesh, a dot grid, generative art, or a hero image behind the card. The card should read as **floating chrome** — translucent enough to let the backdrop breathe through, but with a defined edge so the content stays legible.

```jsx
<SectionBlock background="gradient" padding="xl">
  <Grid cols="2" gap="md">
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

`surface="glass"` does five things at once: 58% opacity `bg-card`, 14px backdrop blur, an inner edge highlight (the "wet" rim that gives glass its boundary), a faint border, and it drops the base `bg-card` so the alpha actually shows. Layering `shadow-elevation-4` adds the floating-popover drop shadow; `gds-aura-ring` makes the second card pulse with a blue halo to signal "this is the recommended path".

---

### Scenario 3 — Translucent menu sheet (floating chrome with structure)

You want a floating panel — a command palette, a notification drawer, an AI suggestion overlay — that's visibly distinct from the canvas but doesn't need full glass blur. Translucent is for "I want presence without drama".

```jsx
<Card surface="translucent" className="shadow-elevation-5 w-80">
  <CardHeader>
    <CardTitle>Suggested action</CardTitle>
    <CardDescription>Studio noticed a layout opportunity.</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">
      Three buttons in your toolbar would line up edge-to-edge with the
      tabs below if their size matched. Apply <code>size="sm"</code>?
    </p>
  </CardContent>
  <CardFooter>
    <Button variant="ghost" size="sm">Dismiss</Button>
    <Button size="sm">Apply</Button>
  </CardFooter>
</Card>
```

82% opacity is enough to feel layered but not enough to need backdrop blur — works equally well over a busy or a calm background. `shadow-elevation-5` (dialog tier) plus `translucent` is the "floating but not glass" signature.

---

### Scenario 4 — AI is generating (aura + surface composition)

You want to signal that Studio (or any AI agent) is actively working on this card. Aura is the right axis for state signals. It composes with any surface.

```jsx
<Card
  surface="glass"
  className="shadow-elevation-4 gds-aura-ring gds-aura-shimmer"
  style={{ "--aura-color": "var(--selected-glow)" }}
>
  <CardHeader>
    <CardTitle>Generating layout</CardTitle>
    <CardDescription>About 4 seconds remaining.</CardDescription>
  </CardHeader>
  <CardContent>
    <Stack gap="xs">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </Stack>
  </CardContent>
</Card>
```

Ring (pulsing halo) + shimmer (diagonal sweep) together = "actively generating". For "Studio is reviewing this", use ring alone. For "ready to ship", swap tone to `--success`. The skeletons inside are the content's own loading state — orthogonal to the card-level aura.

---

### Scenario 5 — Glass-strong for a full-page overlay backdrop

`surface="glass-strong"` is tuned for a different job than the other three: it's the **backdrop** behind a modal sheet, not the modal itself. Heavy blur (24px), 42% opacity. Use it to de-emphasise the page underneath while keeping it readable.

```jsx
<Card surface="glass-strong" className="fixed inset-4 z-50">
  <CardContent className="grid place-items-center h-full">
    <Stack gap="md" align="center">
      <Spinner />
      <span className="text-lg">Saving your theme…</span>
    </Stack>
  </CardContent>
</Card>
```

Almost always wrong for in-flow content — at 42% opacity the card reads as washed out. If you find yourself reaching for glass-strong for a regular card, you probably want `glass`.

---

### Anti-patterns

**DO NOT roll glass by hand with Tailwind utilities.** The wrong path:

```jsx
{/* ❌ Tailwind soup — misses edge highlight, locks blur to a fixed step,
    bypasses theme tuning, no Studio inspector knob. */}
<Card className="overflow-hidden border-border bg-card/40 backdrop-blur-md">
```

The right path:

```jsx
{/* ✅ Theme-aware bg, tuned blur, edge highlight, knob-discoverable. */}
<Card surface="glass">
```

This is the single most common mistake. The model reaches for `bg-card/40 backdrop-blur-md` because every other DS leaves glass at the utility layer. Ours doesn't.

**DO NOT layer a solid `bg-card` className over `surface="glass"`.** The opaque fill defeats the blur. Card already drops `bg-card` when `surface` is set to anything other than `solid` — don't undo that by tacking `bg-card` back on via className. If you want a tinted glass, override `--card` on the element:

```jsx
<Card surface="glass" style={{ "--card": "0.99 0.04 250" }}>
  ...
</Card>
```

**DO NOT use `surface="glass"` over a solid background.** Glass needs something behind it to blur. Over plain `bg-background` it reads as a slightly washed-out card and you pay for backdrop-filter for no gain. If the page is calm, use `solid`.

**DO NOT use `surface="glass-strong"` for in-flow content.** It's a full-page overlay material. At 42% opacity, regular cards read as washed out. Reach for `glass`.

**DO NOT skip CardHeader if the card has a title.** The header is the semantic anchor for the title + description pair. Inline `<h3>` inside CardContent breaks the visual rhythm and harms screen-reader navigation.
