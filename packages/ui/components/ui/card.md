---
name: Card
import: "@gradeui/ui"
subcomponents: [CardHeader, CardTitle, CardDescription, CardContent, CardFooter]
props:
  - Each subcomponent accepts native div HTML attrs (className, etc.)
  - No variants — Card is a flexible container surface; shape via data-card-style and depth via shadow-elevation-* utilities
when_to_use: Grouped content with a distinct surface — settings panels, dashboard tiles, list-of-cards layouts. Pair CardHeader (title + description) with CardContent and optional CardFooter (actions).
composes_with: [Button (in CardFooter), Badge, Separator, Avatar, any form controls]
aliases: [card, group box, groupbox, panel, tile, surface]
---

Canonical structure — do NOT skip CardHeader if the card has a title:

```jsx
<Card>
  <CardHeader>
    <CardTitle>Billing</CardTitle>
    <CardDescription>Manage your subscription.</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

Card is the most common host for Presence affordances. Three independent axes:

```jsx
// Elevation — pick a depth level (1=minimal, 3=raised, 4=popover, 5=dialog).
<Card className="shadow-elevation-4">…</Card>

// Surface — opt into glass / translucent backgrounds.
<Card className="gds-surface-glass shadow-elevation-4">…</Card>

// Aura — radiate AI-attention state. Combinable.
<Card className="gds-aura-ring">Studio is reviewing this</Card>
<Card className="gds-aura-ring gds-aura-shimmer">Generating…</Card>
```
