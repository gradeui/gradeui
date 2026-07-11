---
name: Select
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/select"
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
when_to_use: Do NOT use for: searchable lists (use Combobox); multi-select (use Combobox).
aliases: [dropdown, picker, select menu]
---

Styled dropdown select with trigger, content, and item sub-components. Uses Radix (not native select).

## Guidance

Select displays a list of options for the user to pick from. Built on [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select).

### When to Use
- Predefined list of options where users don't need to search
- Form fields where space is limited
- Grouped option selections (e.g., grouped by category)
- Best suited for short to medium lists (preferable for < 100 items but no hard limits)

### Features
- Full keyboard navigation support
- Grouped options with labels
- Icons in options and selected value
- Accessible with ARIA roles and attributes
- Smooth animations and transitions
- Scroll indicators for long lists
- Separator support between items or groups

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "select") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
