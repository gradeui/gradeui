---
name: List
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/list"
subcomponents: [Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions, ItemSubheader]
variants: [default, filled, outline, loading]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Vertical list container with Item sub-components (ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions) for rendering structured rows.

## Guidance

List is a vertical container for rendering a collection of Item rows.

### When to Use
- Displaying a managed set of items (e.g. keywords, tags, entries)
- Rows that need a remove action
- Items with optional media, description, or custom actions
- Sectioned lists inside a Popover with lightweight item styling

### Features
- Four visual variants via the `Item` sub-component — see **Variants** below
- `ItemSubheader` for labelling sections within a list
- Composable sub-components: `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemSubheader`

### Variants

| Variant | Description | Use case |
|---------|-------------|----------|
| `filled` | Card background (default) | Standard lists, dashboards |
| `outline` | Bordered row on page background | Settings, form lists |
| `default` | Plain row — no background or border | Popovers, dropdowns, lightweight lists |
| `loading` | Skeleton placeholder | Loading states |

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "list") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
