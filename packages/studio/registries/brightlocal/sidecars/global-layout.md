---
name: GlobalLayout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/global-layout"
subcomponents: [GlobalLayoutSidebar, GlobalLayoutContent, GlobalLayoutContentActions, GlobalLayoutContentHeader, GlobalLayoutContentBody, GlobalLayoutMobileHeader]
variants: [full, md, sm]
props:
  - maxWidth? — TODO(review): type + one-line description from src
  - width? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Root application layout with sidebar and main content area.

## Guidance

GlobalLayout provides a full-viewport layout with an optional sticky sidebar and native page scrolling.

### When to Use
- Application shells with navigation sidebars
- Dashboard layouts with collapsible sidebars
- Content pages with consistent max-width containers

### Features
- Native page scrolling with browser scrollbar at viewport edge
- Sticky sidebar stays in view while content scrolls
- Optional 224px fixed-width sidebar (hidden on mobile/tablet)
- `maxWidth` on GlobalLayout controls the global container width
- `maxWidth` on GlobalLayoutContent controls the content area width
- Use `breakpoint` tokens from `@brightlocal/tokens/breakpoints` for standard widths

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "global-layout") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
