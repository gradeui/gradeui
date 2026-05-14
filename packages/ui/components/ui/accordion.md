---
name: Accordion
import: "@gradeui/ui"
subcomponents: [AccordionItem, AccordionTrigger, AccordionContent]
props:
  - Accordion: type: "single" | "multiple" — single keeps one open at a time, multiple lets several be open at once
  - Accordion: collapsible?: boolean — only valid with type="single"; allows the open item to be toggled shut
  - Accordion: defaultValue?: string | string[] — initial open item(s)
  - Accordion: value?: string | string[] — controlled
  - Accordion: onValueChange?: (value: string | string[]) => void
  - AccordionItem: value: string — id used by the open-state machinery
  - AccordionTrigger: children: React.ReactNode — the row label users click to expand
  - AccordionContent: children: React.ReactNode — the body that animates in
when_to_use: Long-form content that would overwhelm if shown all at once — FAQs, settings groups, "what's included" sections, nested help. For tab-style peer views with one always visible, reach for Tabs. For a single show/hide reveal use Collapsible.
composes_with: [Card (as a faq inside a card body), Section primitives]
aliases: [accordion, faq, expand, collapse list, disclosure list]
---

```jsx
<Accordion type="single" collapsible defaultValue="one">
  <AccordionItem value="one">
    <AccordionTrigger>What's included?</AccordionTrigger>
    <AccordionContent>Everything in the design system, plus Studio.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="two">
    <AccordionTrigger>Can I bring my own theme?</AccordionTrigger>
    <AccordionContent>Yes — three hues in, full theme out.</AccordionContent>
  </AccordionItem>
</Accordion>
```
