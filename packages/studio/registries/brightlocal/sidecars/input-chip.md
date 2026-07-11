---
name: InputChip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-chip"
subcomponents: [InputChipInput, InputChipItems]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - allowDuplicates? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Tag/chip input for entering multiple values as removable chips.

## Guidance

InputChip combines an input field with removable chips/tags. Users can type text and press Enter to create new chips. Chips can be removed by clicking the delete button.

### When to Use
- Tag input fields
- Multi-select values with free text entry
- Filter selections with custom values
- Category or keyword entry

### Features
- Context-based state management
- Supports controlled and uncontrolled modes
- Built-in keyboard support (Enter to add, Backspace to remove)
- Flexible chip placement (inside or outside input)
- Duplicate prevention by default (configurable with `allowDuplicates`)
- Error state styling
- Disabled state support

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input-chip") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
