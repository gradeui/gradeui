---
name: Combobox
import: "@gradeui/ui"
props:
  - options: { value, label, icon?, keywords?, disabled? }[] — the selectable pool
  - value?: string | null — controlled selection (wire onValueChange)
  - defaultValue?: string | null — uncontrolled initial selection
  - onValueChange?: (next: string | null) => void — fired with the next value, or null when cleared
  - placeholder?: string — trigger text when nothing is selected
  - searchPlaceholder?: string — search-input placeholder
  - emptyMessage?: string — shown when search returns no rows
  - searchable?: boolean — show the search input (default true)
  - clearable?: boolean — add a Clear row so the value can return to unset
  - triggerVariant?: "default" | "inline" — default = form-control surface (like Select); inline = chrome-free token trigger
  - renderValue?: (option) => ReactNode — render the selected value yourself (e.g. a Badge); falls back to icon + label
  - hideChevron?: boolean — drop the trailing chevron (inline token look)
  - disabled?: boolean — lock to a read-only display of the current value
  - align?: "start" | "center" | "end" — popover alignment
when_to_use: Single-pick searchable picker — the single-select sibling of MultiSelect and the Linear "selectable badge" pattern (status / priority / assignee). Use triggerVariant="inline" with renderValue returning a Badge to make a value read as a clickable token that opens a command menu. For multiple selection use MultiSelect; for a small fixed list with no search use Select; for free-form command palettes use Command directly. Pass disabled (driven by a permission check) to show the value without letting the user edit it.
composes_with: [Popover, Command, Badge, Avatar, PropertyList, Table, Field]
aliases: [combobox, single select, searchable select, picker, status picker, priority picker, assignee picker, command select, autocomplete, dropdown select, selectable badge, inline select, token select, linear combobox]
---

```jsx
<Combobox
  options={[
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ]}
  defaultValue="low"
  placeholder="Set priority"
/>
```

```jsx
// Linear-style: the value IS the trigger.
<Combobox
  triggerVariant="inline"
  hideChevron
  options={priorityOptions}
  value={priority}
  onValueChange={setPriority}
  renderValue={(opt) => <Badge variant="warning-soft">{opt.label}</Badge>}
/>
```
