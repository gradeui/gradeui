---
name: ResizablePanelGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/resizable"
subcomponents: [ResizablePanel, ResizableHandle]
props:
  - id?: string
  - autoSaveId?: string
  - direction
  - keyboardResizeBy?: number
  - onLayout?
  - storage?
  - tagName?
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - key?
  - ref? — Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
  - withHandle?: boolean — ResizableHandle: Show a visible drag handle indicator
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
