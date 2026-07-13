---
name: ToggleGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/toggle-group"
subcomponents: [ToggleGroupItem]
variants: [default, outline]
sizes: [default, sm, lg]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - variant? — Visual style variant (default "simple")
  - size? — Size variant (default "default")
  - value: string — ToggleGroupItem: Unique value for the toggle item (REQUIRED)
  - ariaLabel?: string — ToggleGroupItem: ARIA label for accessibility (required when no text content)
---

```jsx
import { ToggleGroup, ToggleGroupItem } from "@brightlocal/ui-components/toggle-group";
import { Bold, Italic, Underline } from "@brightlocal/icons";

function Example() {
  return (
    <ToggleGroup type="single" variant="simple" dataHook="toggle-group">
      <ToggleGroupItem dataHook="toggle-bold" value="bold" aria-label="Toggle bold">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem dataHook="toggle-italic" value="italic" aria-label="Toggle italic">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem dataHook="toggle-underline" value="underline" aria-label="Toggle underline">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```
```jsx
<ToggleGroup
  dataHook="toggle-group-outline-focus"
  storyDescription="Focus state"
  type="single"
  variant="outline"
>
  <ToggleGroupItem
    aria-label="Toggle bold"
    value="bold"
  >
    <Bold />
  </ToggleGroupItem>
  <ToggleGroupItem
    aria-label="Toggle italic"
    value="italic"
  >
    <Italic />
  </ToggleGroupItem>
  <ToggleGroupItem
    aria-label="Toggle underline"
    value="underline"
  >
    <Underline />
  </ToggleGroupItem>
</ToggleGroup>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-togglegroup--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
