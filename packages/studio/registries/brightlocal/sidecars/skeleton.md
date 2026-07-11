---
name: Skeleton
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/skeleton"
props:
  - dataHook?: string — optional on structural components (renders data-hook)
---

Placeholder shimmer animation for loading states.

## Guidance

Skeleton is a loading placeholder component that displays a pulsing animation. Custom implementation using Tailwind CSS.

### When to Use
- Content placeholders while data is loading from an API
- Preview layouts before images or text have loaded
- Reducing perceived loading time with visual feedback
- Form and card layouts during skeleton loading states

### Features
- Pulsing animation to indicate loading
- Flexible sizing via className prop
- Supports custom shapes (rounded, circular)
- Lightweight implementation with Tailwind CSS
- Accessible with `aria-busy` and screen-reader loading label

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "skeleton") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
