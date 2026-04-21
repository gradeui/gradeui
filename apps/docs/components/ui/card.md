---
name: Card
import: ./components/ui/card
subcomponents: [CardHeader, CardTitle, CardDescription, CardContent, CardFooter]
props:
  - Each subcomponent accepts native div HTML attrs (className, etc.)
  - No variants — Card is a flexible container surface
when_to_use: Grouped content with a distinct surface — settings panels, dashboard tiles, list-of-cards layouts. Pair CardHeader (title + description) with CardContent and optional CardFooter (actions).
composes_with: [Button (in CardFooter), Badge, Separator, Avatar, any form controls]
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
