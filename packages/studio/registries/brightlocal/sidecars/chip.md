---
name: Chip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/chip"
sizes: [md, lg]
props:
  - loading? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - onRemove? — TODO(review): type + one-line description from src
  - maxWidth? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Displaying user-created tags that can be removed Selected filter values that can be dismissed Multi-select token display with remove capability Do NOT use for: non-interactive status labels (use Badge); category labels without remove action (use Badge). Use Badge for non-interactive status indicators or labels. Use InputChip when users need to both add and remove tags via an input field.
composes_with: [Badge, InputChip]
---

Removable tag/chip element for multi-value inputs and filters.

## Guidance

Chip displays a removable tag or selection with a delete button. Used for filter selections, tag lists, and multi-select values.

### When to Use
- Filter selections that can be removed
- Tag lists with delete capability
- Multi-select input values
- Selected items in a list

### Features
- Two sizes: medium (md) and large (lg)
- Delete button with X icon
- Loading state with spinner
- Disabled state
- Design system tokens for light and dark modes

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "chip") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
