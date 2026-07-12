---
name: ResizablePanelGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/resizable"
subcomponents: [ResizablePanel, ResizableHandle]
props:
  - direction? — TODO(review): type + one-line description from src
  - withHandle? — TODO(review): type + one-line description from src
  - defaultSize? — TODO(review): type + one-line description from src
  - minSize? — TODO(review): type + one-line description from src
  - maxSize? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
aliases: [resizable]
---

```jsx
<ResizablePanelGroup direction="horizontal" dataHook="resizable">
  <ResizablePanel defaultSize={50}>
    <div>Panel One</div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <div>Panel Two</div>
  </ResizablePanel>
</ResizablePanelGroup>
```
```jsx
<ResizablePanelGroup
  dataHook="resizable-panel-group"
  direction="horizontal"
  className="rounded-lg border"
>
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center">
      <span>One</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center">
      <span>Two</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-resizable--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
