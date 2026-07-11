---
name: Textarea
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/textarea"
props:
  - error? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Multi-line text input with auto-resize support.

## Guidance

A multi-line text input for longer form content with built-in validation support. Custom implementation using Tailwind CSS.

### When to Use
- Long-form text input (comments, descriptions, feedback)
- Form fields requiring multiple lines of text
- Message composition (emails, support tickets)

### Features
- Configurable row count for initial height
- Error state styling via `error` prop
- Integration with Field components for labels and descriptions
- React Hook Form compatible via Controller pattern
- Placeholder and disabled state support

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "textarea") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
