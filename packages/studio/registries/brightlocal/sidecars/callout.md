---
name: Callout
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/callout"
subcomponents: [CalloutHeading, CalloutCitation]
variants: [primary, purple, blue, green]
props:
  - pointer? (top | bottom | left | right | none)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

## Guidance

Speech bubble callout for highlighting key statements, quotes, or important messages. Features a directional pointer/caret and bold heading typography.

- Four color variants: primary, purple, blue, green
- Configurable pointer direction (top, bottom, left, right, none)
- Compound component with `CalloutHeading` and `CalloutCitation` sub-components
- `CalloutCitation` auto-styles based on parent variant via context
- Uses `font-display text-4xl` display typography and `shadow-lg` token

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "callout") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
