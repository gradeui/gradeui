---
name: Accordion
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/accordion"
subcomponents: [AccordionItem, AccordionTrigger, AccordionContent]
props:
  - type
  - collapsible?: boolean
  - defaultValue?
  - value?
  - onValueChange?
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - disabled?: boolean — Whether the accordion is disabled
  - dir? — Text direction
  - orientation? — Orientation of the accordion
  - className?: string — Additional CSS classes
  - children? — Accordion items
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - key?
  - forceMount? — AccordionContent: Force mounting of the content when true
---

```jsx
<Accordion type="single" collapsible dataHook="faq-accordion">
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```
```jsx
<Accordion
  className="w-80"
  collapsible
  dataHook="accordion-default"
  defaultValue="item-1"
  onValueChange={function z0e(){}}
  storyDescription="Open"
  type="single"
>
  <AccordionItem value="item-1">
    <AccordionTrigger>
      Is it accessible?
    </AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>
      Is it styled?
    </AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles that matches the other components' aesthetic.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3">
    <AccordionTrigger>
      Is it animated?
    </AccordionTrigger>
    <AccordionContent>
      Yes. It's animated by default, but you can disable it if you prefer.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-accordion--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
