---
name: InputGroup
import: "@gradeui/ui"
props:
  - InputGroup: <div> — the bordered wrapper. role=group. Focus/error styles react to the inner control via :has().
  - InputGroupInput: <input> props — the text control (data-slot=input-group-control). Borderless, fills the group.
  - InputGroupTextarea: <textarea> props — multiline control; the group grows to fit.
  - InputGroupAddon: align?: "inline-start" | "inline-end" | "block-start" | "block-end" — a slot for icons / text / buttons. inline = beside the control; block = stacked above/below (toolbars, textareas).
  - InputGroupButton: variant?=ghost; size?: "xs" | "sm" | "icon-xs" | "icon-sm" — a compact button sized for addons (wraps Button).
  - InputGroupText: <span> props — inline label/affix text (prefixes, suffixes, units).
when_to_use: Compose an input with leading/trailing icons, text affixes, buttons, or a toolbar inside one bordered field. Put controls in InputGroupInput / InputGroupTextarea and decorations in InputGroupAddon. For a plain field with a label + description, use Field instead.
composes_with: [Input, Textarea, Button, Field, Label, Kbd, Tooltip]
aliases: [input group, input with icon, input addon, prefix suffix input, search input, input affix, text field with button, leading icon input, trailing button input]
---

```jsx
<InputGroup>
  <InputGroupAddon>
    <SearchIcon />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search…" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton>Go</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

```jsx
<InputGroup>
  <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
  <InputGroupInput placeholder="yoursite.com" />
</InputGroup>
```
