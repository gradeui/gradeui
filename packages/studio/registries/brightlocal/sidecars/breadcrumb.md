---
name: Breadcrumb
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/breadcrumb"
subcomponents: [BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Navigation trail showing the current page location in a hierarchy.

## Guidance

Breadcrumb displays the path to the current resource using a hierarchy of links. Custom implementation using Tailwind CSS.

### When to Use
- Multi-level site navigation (e-commerce, documentation)
- Page hierarchy indication
- Back-navigation context in nested views

### Features
- Hierarchical navigation path with visual separators
- Dropdown menu support for complex navigation
- Ellipsis component for collapsed sections
- Semantic HTML with proper ARIA attributes
- Customizable separators (chevron, slash, or custom)

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "breadcrumb") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
