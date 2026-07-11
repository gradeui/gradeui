---
name: Input
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input"
props:
  - error? — TODO(review): type + one-line description from src
  - hasIcon? — TODO(review): type + one-line description from src
  - hasSecondaryIcon? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: multi-line text (use Textarea); search with dropdown (use Combobox).
aliases: [text field, textbox, text input]
---

Text input with error state and data-hook support.

## Guidance

Input is a styled text input element. Custom implementation using Tailwind CSS.

### When to Use
- Text, email, password, and other text-based inputs
- Search fields and URL inputs
- Form fields requiring user text entry

### Features
- Multiple input types (text, email, password, search, url, tel, number)
- Focus, disabled, and error states
- Composable with Field, FieldLabel, FieldDescription
- Icon support via InputGroup
- React Hook Form compatible

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
