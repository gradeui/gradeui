---
name: CardTitleLink
import: "@brightlocal/proposal"
props:
  - children — Title text (the feature name).
  - dataHook?: string — Instance name.
  - className?: string — Merged after the base classes.
when_to_use: The title of any CLICKABLE card (whole-card link via data-grade-goto) — hub feature cards, module cards. Renders CardTitle size="small" in the brand's clickable link colour. The colour is a single token seam — `--bl-card-link`, falling back to the dark brand green — so restyling every clickable title is a one-variable change. Never hand-colour a card title with a palette class; use this.
composes_with: [Card, CardHeader, CardDescription]
---

```jsx
<Card className="cursor-pointer" data-grade-goto="screen:…" dataHook="hub-reviews">
  <CardHeader>
    <CardTitleLink>Reviews</CardTitleLink>
    <CardDescription>Monitor and respond across 30+ sites.</CardDescription>
  </CardHeader>
  <CardContent>…data…</CardContent>
</Card>
```
