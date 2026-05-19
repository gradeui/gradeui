---
name: ScrollArea
import: "@gradeui/ui"
subcomponents: [ScrollBar]
props:
  - ScrollArea: type? "auto" | "always" | "scroll" | "hover" — when the scrollbar shows
  - ScrollArea: scrollHideDelay?: number — ms before "scroll"/"hover" scrollbars fade
  - ScrollArea: dir? "ltr" | "rtl"
  - ScrollArea: className?: string — set a height/max-height here, otherwise nothing scrolls
  - ScrollBar: orientation? "vertical" | "horizontal" (default vertical)
when_to_use: Bounded content that needs custom scroll chrome — sidebars with long item lists, chat transcripts, table panels inside a dashboard, anywhere the OS scrollbar would feel out of place against the design tokens. The wrapping element has to have a height constraint (`h-`, `max-h-`, or grid row sizing) or nothing scrolls — scroll-area can't infer a bound on its own. For body-level scrolling, leave the document to the browser.
composes_with: [Card (long card body), AppShellNav (long sidebar), Sheet (long modal body), Table (sticky-header scrolling list)]
aliases: [scroll area, scroll container, custom scrollbar, sidebar scroll, panel scroll, scroll view, scrollview, react native scrollview]
---

```jsx
// Sidebar with a long item list — fixed height so scroll engages.
<ScrollArea className="h-96 w-56 rounded-md border">
  <Stack gap="xs" className="p-3">
    {items.map((item) => (
      <button key={item.id} className="text-left px-2 py-1 rounded hover:bg-muted">
        {item.name}
      </button>
    ))}
  </Stack>
</ScrollArea>
```
