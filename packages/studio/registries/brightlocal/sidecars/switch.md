---
name: Switch
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/switch"
props:
  - disabled? — TODO(review): type + one-line description from src
  - checked? — TODO(review): type + one-line description from src
  - onCheckedChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: multi-option selection (use Checkbox or RadioGroup); button toggle (use Toggle).
aliases: [toggle switch, on/off toggle]
---

Toggle switch for on/off boolean values.

## Guidance

A toggle control that allows users to switch between checked and unchecked states. Built on [Radix UI Switch](https://www.radix-ui.com/primitives/docs/components/switch).

### When to Use
- Binary on/off settings (enable notifications, dark mode)
- Form controls for boolean values (opt-in, preferences)
- Settings panels where immediate feedback is needed

### Features
- Composition with Field, FieldLabel, and FieldDescription
- Keyboard accessible with Space/Enter keys
- ARIA-compliant with proper role and state attributes
- React Hook Form integration via Controller pattern

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "switch") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
