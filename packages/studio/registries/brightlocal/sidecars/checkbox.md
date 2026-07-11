---
name: Checkbox
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/checkbox"
props:
  - disabled? — TODO(review): type + one-line description from src
  - error? — TODO(review): type + one-line description from src
  - checked? — TODO(review): type + one-line description from src
  - onCheckedChange? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Do NOT use for: on/off toggle (use Switch); radio selection (use RadioGroup).
aliases: [check, checkmark, tick box]
---

Toggle control for boolean values with checked, unchecked, and indeterminate states.

## Guidance

Checkbox is a form input for binary choices with full accessibility support. Built on [Radix UI Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox).

### When to Use
- Single yes/no selections (terms acceptance, opt-ins)
- Multiple selections from a list of options
- Toggle settings on/off

### Features
- Controlled and uncontrolled modes via `checked` prop
- Composition with Field, FieldLabel, and FieldDescription
- Full ARIA support with proper labeling
- Error states for validation feedback
- WCAG AA color contrast (4.5:1) in all states

## Accessibility Requirements

⚠️ **Important**: Every checkbox must have an accessible name for screen readers. You must provide either:

1. **Visible label**: Use FieldLabel with `htmlFor` to associate with checkbox `id`
2. **ARIA label**: Provide an `aria-label` attribute when no visible label is present

✅ **Color Contrast**: The component automatically maintains WCAG AA color contrast ratios (4.5:1) in all states, including disabled states.

## Props (from BrightLocal MCP)

- primary?
- enums?

<!-- Harvested from BrightLocal's MCP server (get_component_api "checkbox") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
