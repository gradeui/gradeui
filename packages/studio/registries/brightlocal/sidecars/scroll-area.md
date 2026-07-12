---
name: ScrollArea
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/scroll-area"
subcomponents: [ScrollBar]
props:
  - orientation? (vertical | horizontal)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<ScrollArea dataHook="my-scroll" className="h-[200px] w-[350px] rounded-md border">
  <div className="p-4">
    {items.map((item) => (
      <div key={item}>{item}</div>
    ))}
  </div>
</ScrollArea>
```
```jsx
<ScrollArea className="h-72 w-48 rounded-md border" dataHook="scroll-area">
  <div className="p-4">
    <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
    {tags.map((tag) => (
      <div key={tag}>
        <div className="text-sm">{tag}</div>
        <Separator spacing="sm" />
      </div>
    ))}
  </div>
</ScrollArea>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-scrollarea--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
