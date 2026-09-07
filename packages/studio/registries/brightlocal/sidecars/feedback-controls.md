---
name: FeedbackControl
props:
  type: '"nps" | "thumbs" | "stars" — which of the three scales to draw.'
  value: "number | 'up' | 'down' | null — the current answer."
  onPick: "(value) => void — only called when interactive."
  interactive: "boolean — false renders the look without wiring clicks. Every preview uses false."
when_to_use: >
  Anywhere a customer is asked to rate: the feedback page, the email preview,
  the widget previews, a template preview. This is the ONE place the three
  scales are drawn, so a change to how NPS or thumbs or stars look happens here
  and reaches every surface at once. Never hand-roll a rating row.
composes_with: [CustomerPage, Card, Dropzone, Field]
aliases: [nps, net promoter, thumbs, thumbs up, star rating, rating scale, feedback scale]
---

`FeedbackScore` is the read-only sibling: one answer as it appears in a results
table or a row, not a control. Use `FeedbackControl` when the customer answers,
`FeedbackScore` when you are showing what they answered.

NPS is an eleven-column grid, not flex: `flex-1` with `aspect-square` collapses
each button to the width of its own digit, so the circles stop being round.
