---
name: InsightAction
import: "@brightlocal/proposal"
props:
  - item — The parent insight (aiInsights.items[]); used for stable dataHooks.
  - action — One entry from item.actions[]: { text, label?, where?, links?, cta? }.
  - index — Zero-based position within item.actions (numbers the row, keys the accordion value + dataHooks).
  - style? (accordion | list) — "accordion" (default) renders a collapsible AccordionItem — MUST be rendered inside an <Accordion>. "list" renders a flat numbered row for ActionList's panel.
when_to_use: The single component EVERY recommendation action routes through — the row anatomy (the "N." CHECKLIST number (Ali, 23 Jul — a handle, not a rank), short label, full text with the off-site "Ask your web developer…" prefix where applicable, the "After you've done this…" blurb, and on-site deep-link Buttons) lives here so it never diverges. You rarely render it directly; AreaInsights → InsightCard → ActionAccordion/ActionList fan out to it. Reach for it standalone only when composing a one-off action row. The "where" is inferred from the action (a tool link ⇒ on-site Button; none ⇒ off-site text prefix), overridable with `action.where`.
composes_with: [InsightCard, AreaInsights, Accordion, Button]
---

```jsx
{/* Inside an Accordion (the default style needs the Radix context): */}
<Accordion type="multiple" dataHook="insight-ins-1-actions">
  {item.actions.map((a, i) => (
    <InsightAction key={i} item={item} action={a} index={i} style="accordion" />
  ))}
</Accordion>
```

Ships in "@brightlocal/proposal" — never inline a copy. `ActionWhere`
(the on-site/off-site affordance) is an internal detail of this
component, deliberately not exported.
