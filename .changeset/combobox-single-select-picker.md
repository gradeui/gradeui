---
"@gradeui/ui": minor
---

Add `Combobox` — a single-pick searchable picker, the single-select sibling of `MultiSelect`.

- **Composes Popover + Command + Button.** Data-driven via `options` ({ value, label, icon?, keywords?, disabled? }); controlled or uncontrolled (`value` / `defaultValue` are `string | null`, `onValueChange` fires with the next value or null). Per-option icons render in the menu and on the trigger; cmdk handles search and keyboard nav.
- **The Linear "selectable badge".** `triggerVariant="inline"` drops the form-control chrome and `renderValue` lets you render the selection as a Badge, so a value (a status, a priority, an assignee) reads as a clickable token that opens the menu in place. `hideChevron` completes the token look.
- **`clearable`** adds a Clear row so the value can return to unset. **`disabled`** locks the control to a read-only display of its current value, intended to be driven by a permission check (a viewer sees the value but can't open the menu).
- Reach for `Select` for a short fixed list with no search, `MultiSelect` for multiple values, and `Command` directly for unbounded / async lists.
