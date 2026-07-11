---
name: Combobox
import: "@gradeui/ui"
props:
  - Combobox: the root (Base UI Combobox.Root). Pass items={array} for filtering, value/defaultValue + onValueChange for selection, and multiple to enable chips.
  - ComboboxInput: the field (built on InputGroup). showTrigger?=true (chevron button), showClear?=false (clear button). Spreads Base UI Input props.
  - ComboboxContent: the popover surface. side/align/sideOffset/alignOffset/anchor for positioning.
  - ComboboxList: scroll container. Accepts a render function child `(item) => <ComboboxItem/>` when items are provided on the root.
  - ComboboxItem: a row. value={item}; shows a check when selected.
  - ComboboxGroup / ComboboxLabel: grouped sections with a heading.
  - ComboboxEmpty: shown when the filter returns nothing.
  - ComboboxSeparator: divider row.
  - ComboboxChips / ComboboxChip / ComboboxChipsInput: multiple-select chips (only with multiple on the root).
  - ComboboxValue / ComboboxTrigger / ComboboxClear: lower-level parts (used internally by ComboboxInput).
  - useComboboxAnchor: ref hook to anchor the content to a custom element (e.g. a chips row).
when_to_use: A searchable picker with type-to-filter. Single-select by default (value shows in the input); add multiple for tag-style chips. For a single chip that opens the popover (the Studio token-field pattern), keep it single-select and render your own chip in an InputGroupAddon — the built-in ComboboxChips is multiple-only. For a small fixed list without search use Select; for a free-form command palette use Command.
composes_with: [InputGroup, Button, Field, Badge, Avatar, PropertyList, Table]
aliases: [combobox, autocomplete, searchable select, single select, multi select, tag input, chips input, picker, status picker, assignee picker, token select, command select]
---

```jsx
<Combobox items={frameworks}>
  <ComboboxInput placeholder="Search framework…" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

```jsx
// Multiple selection with chips
<Combobox items={labels} multiple>
  <ComboboxChips>
    <ComboboxChip />
    <ComboboxChipsInput placeholder="Add labels…" />
  </ComboboxChips>
  <ComboboxContent>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```
