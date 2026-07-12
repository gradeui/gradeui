---
name: Collapsible
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/collapsible"
subcomponents: [CollapsibleTrigger, CollapsibleContent]
props:
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - defaultOpen? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<Collapsible
  className="w-[350px] space-y-2"
  dataHook="collapsible-default"
  disabled
  storyDescription="Disabled state"
  trackingEl="collapsible-demo"
  trackingLabel="default-story"
>
  <div className="flex items-center justify-between space-x-4">
    <h4 className="text-sm font-semibold">
      @peduarte starred 3 repositories
    </h4>
    <CollapsibleTrigger
      asChild
      dataHook="default-collapsibleTrigger"
    >
      <Button
        dataHook="collapsible-toggle"
        size="sm"
        variant="ghost"
      >
        <ChevronsUpDown />
        <span className="sr-only">
          Toggle
        </span>
      </Button>
    </CollapsibleTrigger>
  </div>
  <div className="border-border rounded-md border px-4 py-2 font-mono text-sm">
    @radix-ui/primitives
  </div>
  <CollapsibleContent
    className="space-y-2"
    dataHook="default-collapsibleContent"
  >
    <div className="border-border rounded-md border px-4 py-2 font-mono text-sm">
      @radix-ui/colors
    </div>
    <div className="border-border rounded-md border px-4 py-2 font-mono text-sm">
      @stitches/react
    </div>
  </CollapsibleContent>
</Collapsible>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-collapsible--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
