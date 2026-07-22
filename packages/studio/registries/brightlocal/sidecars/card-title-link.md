---
name: CardTitleLink
import: "@brightlocal/proposal"
props:
  - children — Title text (the feature name).
  - dataHook?: string — Instance name.
  - className?: string — Merged after the base classes.
when_to_use: The title of any CLICKABLE card (whole-card link via data-grade-goto) — hub feature cards, module cards. Renders CardTitle size="small" in the NORMAL card foreground — green-at-rest was removed (Ali, 22 Jul, "too many colours"); clickability reads through the HOVER treatment alone (green-700 + underline, on the title or anywhere on the goto card, via the shell's [data-bl-link] rules). Inline text links and accordion action rows still sit in the --bl-card-link colour at rest. Never hand-colour a card title with a palette class; use this.
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
