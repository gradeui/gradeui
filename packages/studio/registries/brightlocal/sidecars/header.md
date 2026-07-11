---
name: Header
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/header"
props:
  - align? (left | center | right)
  - align? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Page or section header component.

## Guidance

Header provides a semantic container for top-level page navigation and branding.

### When to Use
- Page headers with logo and navigation
- Application shells requiring consistent top navigation
- Layouts using CentredLayout or GlobalLayout

### Features
- Semantic `<header>` element for accessibility
- Flexible flex container for content alignment
- Accepts children (Logo, NavigationMenu, etc.)
- Supports tracking attributes for analytics

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "header") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
