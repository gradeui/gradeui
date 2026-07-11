---
name: Description
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/description"
props:
  - dataHook?: string — optional on structural components (renders data-hook)
---

Key-value pair layout for displaying metadata.

## Guidance

> Note: This is a helper component used when building other components. It is not present in the Design System files in Figma.

Description displays helper text and additional context in muted styling. Custom implementation using Tailwind CSS.

### When to Use
- Form field descriptions and hints
- Help text and contextual information
- Legal disclaimers with links (terms, privacy)

### Features
- Muted, smaller text for secondary content
- Supports inline links with hover styling
- For form fields, use FieldDescription for form-specific styles

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "description") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
