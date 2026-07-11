---
name: Badge
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/badge"
variants: [default, secondary, destructive, outline]
props:
  - asChild? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Displaying a status label (active/inactive, new, draft) Showing a count or numeric indicator Non-interactive categorical labels Do NOT use for: removable tags (use Chip); interactive elements (use Button). Use Chip when the user can remove/dismiss the tag — Badge is non-interactive. Use Button for interactive status toggles.
composes_with: [Chip, Button]
aliases: [tag, chip, pill, label, status indicator]
---

Small status label with semantic color variants (default, secondary, destructive, outline).

## Guidance

Badge displays a small label for status or categorization. Custom implementation using Tailwind CSS.

### When to Use
- Status indicators (new, draft, published, error)
- Category labels and tags
- Count badges on icons or navigation items

### Features
- Four visual variants: Primary, Secondary, Outline, Destructive
- Optional icon support with proper spacing
- Focusable when used as interactive elements
- Design system tokens for light and dark modes

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "badge") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
