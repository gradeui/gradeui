---
name: Combobox
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/combobox"
subcomponents: [ComboboxTrigger, ComboboxContent, ComboboxInput, ComboboxList, ComboboxVirtualList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxSeparator, ComboboxValue, ComboboxLoading]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - shouldFilter? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - avoidCollisions? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Dropdown with 10+ options where search/filtering improves UX Autocomplete or typeahead for large lists (cities, categories, users) Multi-select with search capability Do NOT use for: simple select without search (use Select); command palette (use Command). Use Select for short lists (under 10 options) where search is unnecessary. Use Command for keyboard-driven command palettes or action search. Use DropdownMenu for action menus triggered by a button — not form selection.
composes_with: [Select, Command, DropdownMenu]
aliases: [autocomplete, searchable select, typeahead, filterable dropdown]
---

Searchable, filterable dropdown for selecting from large option lists. Supports single and multi-select.

## Guidance

A composable, searchable dropdown for selecting from a list of options. Built on [Radix UI Popover](https://www.radix-ui.com/primitives/docs/components/popover) and [cmdk](https://cmdk.paco.me/).

### When to Use
- Large option lists (100+ items) — use `ComboboxVirtualList` for efficient DOM rendering
- When users need to search/filter options by typing
- Async data fetching with server-side search
- For small-to-medium lists (< 100 options) without search, prefer [Select](/docs/ui-components-select--docs)

### Features
- **Composable API** - Full control over trigger, content, and items
- **Async Search** - Set `shouldFilter={false}` for server-side filtering
- **Virtual Scrolling** - Use `ComboboxVirtualList` for 100+ items with efficient DOM rendering
- **Built-in Debounce** - Use `debounceMs` on ComboboxInput to throttle async search callbacks
- **Search Highlighting** - Use `highlight` prop on ComboboxItem to highlight matching text
- **Keyboard Navigation** - Arrow keys, Enter, Escape
- **Grouped Options** - Organize items with ComboboxGroup

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "combobox") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
