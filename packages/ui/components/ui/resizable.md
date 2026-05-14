---
name: Resizable
import: "@gradeui/ui"
subcomponents: [ResizablePanelGroup, ResizablePanel, ResizableHandle]
props:
  - ResizablePanelGroup: direction: "horizontal" | "vertical" — required; sets the axis the user drags along
  - ResizablePanelGroup: autoSaveId?: string — persists user-adjusted sizes to localStorage under this id
  - ResizablePanelGroup: onLayout?: (sizes: number[]) => void
  - ResizablePanel: defaultSize?: number — percent of group (0-100); siblings should sum to ~100
  - ResizablePanel: minSize?, maxSize?: number — percent bounds
  - ResizablePanel: collapsible?: boolean — allow this panel to collapse to zero
  - ResizablePanel: collapsedSize?, onCollapse?, onExpand? — collapse behaviour controls
  - ResizableHandle: withHandle?: boolean — show a visible drag affordance (default just a hit-zone)
when_to_use: A multi-pane layout where the user wants to drag the divider — Slack/Mail-style list+detail, IDE editor+terminal, side-by-side compare view. Static layouts shouldn't use this — reach for AppShell with nav="three-pane" (fixed widths) or Grid (responsive ladder). Built on react-resizable-panels under the hood.
composes_with: [AppShellMain (host the splitter inside main), ScrollArea (each panel's content), Card]
aliases: [resizable, splitter, split pane, drag divider, adjustable panels, resizer]
---

```jsx
// List + detail with a draggable divider, saved between sessions.
<ResizablePanelGroup direction="horizontal" autoSaveId="inbox">
  <ResizablePanel defaultSize={30} minSize={20}>
    <InboxList />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={70}>
    <ConversationView />
  </ResizablePanel>
</ResizablePanelGroup>
```
