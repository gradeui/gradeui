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

Draggable split pane layout with resizable panels.

## Guidance

Resizable provides a set of components for building resizable panel layouts. Built on [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels).

### When to Use
- Split-pane layouts (code editors, file explorers)
- Adjustable sidebar widths
- Customizable dashboard layouts

### Features
- Horizontal and vertical layouts
- Keyboard accessible resize handles
- Minimum and maximum size constraints
- Optional visible drag handle indicator
- Collapsible panels

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "resizable") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
