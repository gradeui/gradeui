---
name: EmptyState
props:
  icon: "Icon component from @brightlocal/icons (optional). Drawn muted in a neutral-100 circle."
  title: "string. What is (not) here, as a plain statement: \"Nothing has been sent yet\"."
  description: "ReactNode (optional). One muted line: what happens next, or what to do."
  action: "ReactNode (optional). A Button that moves the person on."
  dataHook: "string, default empty-state. Title and description take -title and -description."
  className: "string. Layout only."
when_to_use: >
  Anywhere a section has nothing to show yet: a campaign that has not sent, a
  table with no rows at all, a report with no data. Use it INSTEAD of a row of
  zero tiles and INSTEAD of an alert standing in for an empty state, and use
  one per section, never an alert and an empty state saying the same thing.
  NOT for "no results match these filters": that belongs in the table's own
  no-results row.
composes_with: Card, CardContent, Button
aliases: empty state, empty, zero state, blank slate, nothing here, no data
---

The BrightLocal DS ships no Empty component, so this is the shared shape:
an optional icon, a heading, an optional muted line and an optional action,
centred. It has no card of its own; wrap it in a `Card` (with
`CardContent className="p-0"`) when it stands in for a card's content.

```jsx
<Card className="max-w-none">
  <CardContent className="p-0">
    <EmptyState
      icon={Send}
      title="Nothing has been sent yet"
      description="It sends automatically at its scheduled time."
      dataHook="campaign-empty"
    />
  </CardContent>
</Card>
```
