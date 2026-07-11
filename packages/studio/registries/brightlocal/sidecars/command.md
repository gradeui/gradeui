---
name: Command
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/command"
subcomponents: [CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CommandVirtualItem, CommandVirtualList]
props:
  - filter? — TODO(review): type + one-line description from src
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - onClear? — TODO(review): type + one-line description from src
  - debounceMs? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Keyboard-driven command palette for search and actions.

## Guidance

Command is a composable command menu for searchable actions and navigation. Built on [cmdk](https://cmdk.paco.me/).

### When to Use
- Command palettes (⌘K style interfaces)
- Searchable action menus
- Quick navigation between app sections

### Features
- Searchable command palette with type-to-filter
- Full keyboard navigation (arrow keys, Enter, Escape)
- Grouped commands with headings
- Keyboard shortcut display
- Empty state handling
- ARIA roles and labels for screen readers
- Virtualised list for large datasets (`CommandVirtualList`)
- Input debounce for async filtering (`debounceMs`)

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "command") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
