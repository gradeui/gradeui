---
name: InputGroup
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-group"
subcomponents: [InputGroupInput, InputGroupAddon, InputGroupButton]
sizes: [default, sm, lg]
props:
  - error? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Wrapper for grouping an input with prefix/suffix addons.

## Guidance

> Note: This is a helper component used when building other components. It is not present in the Design System files in Figma.

InputGroup combines an input with icons or buttons as addons. Custom implementation using Tailwind CSS.

### When to Use
- Search inputs with search icon
- Email/URL inputs with leading icons
- Password inputs with visibility toggle
- Inputs with clear buttons

### Features
- Left and right addon support
- Button addon for interactive actions
- Focus state shared across container
- Supports disabled and error states

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input-group") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
