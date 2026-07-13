---
name: InputList
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-list"
subcomponents: [InputListItems, InputListInput, InputListAddButton, useInputListContext]
props:
  - value — The current list of item strings (controlled).
  - onValueChange — Called when the list of items changes.
  - children — Children — compose with InputListItems and InputListInput.
  - className?: string — Additional CSS classes applied to the root element.
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics.
  - trackingLabel?: string — Tracking label for analytics context.
  - loading?: boolean — InputListItems: Shows skeleton placeholder rows instead of the item list.
  - skeletonCount?: number — InputListItems: Number of skeleton rows to render in the loading state. (default 5)
  - disabled?: boolean — InputListItems: Disables all remove buttons in the list.
  - error?: boolean — InputListInput: Applies an error style to the input.
---

Managed list of text items with add-input, per-row remove controls, multi-line paste, max item limit, loading skeletons, and validation states.

## Guidance

InputList is a compound component for managing a list of text items with add, remove, and paste support.

### When to Use
- Collecting a list of keywords, tags, or short text entries from the user
- Onboarding flows where users build a list incrementally
- Any form where the number of text inputs is dynamic and user-controlled

### Features
- Fully compound architecture: `InputList` + `InputListItems` + `InputListInput` + `InputListAddButton` + `Field` + `FieldError` + `FieldDescription`
- Controlled mode (`value` + `onValueChange`)
- Submit via Enter key or Add button
- Multi-line paste support (each line becomes a separate item)
- Loading skeleton state with configurable row count
- Fully disabled state (input and remove controls)
- Input error state with validation message support
- Smooth removal animation with fluid easing (respects `prefers-reduced-motion`)
- Keyboard accessible with screen reader labels for remove actions

### DS vs App Responsibility

| Design System | App |
|---|---|
| Renders input, button, item list | Manages item state (controlled mode) |
| Handles add/remove/paste logic | Validates and filters in `onValueChange` |
| Displays loading skeletons | Determines when `loading` is true |
| Renders items and input controls | Controls when errors/descriptions are shown |

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "input-list") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
