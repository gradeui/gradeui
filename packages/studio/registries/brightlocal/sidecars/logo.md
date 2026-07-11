---
name: Logo
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/logo"
variants: [logotype, mark]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

BrightLocal logo component with size variants.

## Guidance

Logo displays the BrightLocal brand identity. Custom implementation using Tailwind CSS.

### When to Use
- Application headers and navigation bars
- Mobile views requiring compact branding (mark variant)
- Footer and legal sections

### Features
- Two variants: full logotype and compact mark
- Accessible with proper ARIA attributes
- Inherits primary color from theme
- Responsive sizing with Tailwind classes

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "logo") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
