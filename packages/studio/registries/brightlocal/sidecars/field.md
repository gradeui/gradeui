---
name: Field
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/field"
subcomponents: [FieldLabel, FieldDescription, FieldError, FieldErrorIcon, FieldGroup, FieldLegend, FieldSet, FieldContent]
variants: [default, box]
props:
  - orientation? (vertical | horizontal | responsive)
  - align? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Wrapping any form input with label, description, and error message Canonical pattern: Field > FieldLabel + Input/Select/Textarea + FieldDescription + FieldError When integrating with React Hook Form — use Field with Controller to wire up error state Do NOT use for: standalone labels (use Label); inline text (use Typography). Use standalone Label only when building a custom field layout — Field includes FieldLabel with proper a11y wiring.
composes_with: [Label]
aliases: [form field, input group, field wrapper]
---

Form field wrapper that connects label, input, description, and error message.

## Guidance

> Note: This is a helper component used when building other components. It is not present in the Design System files in Figma.

Field is a form field wrapper that provides consistent layout and styling for form inputs. Custom implementation using Tailwind CSS.

### When to Use
- Form fields with labels and descriptions
- Grouped form inputs (checkboxes, radio buttons)
- Horizontal or vertical field layouts

### Features
- Three orientation variants (vertical, horizontal, responsive)
- Label and description composition
- FieldError for validation messages with composable FieldErrorIcon
- FieldSet and FieldLegend for grouped inputs
- FieldContent for checkbox/radio descriptions
- Container queries for responsive layouts

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "field") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
