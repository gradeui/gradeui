---
name: Select
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/select"
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - children? — Children to render inside the select
  - maxHeight?: number — SelectContent: Maximum height of the dropdown in pixels. Constrains the dropdown height and shows scroll indicators when content overflows. The dropdown uses the smaller of this value and the available viewport space.
  - placeholder?: string — SelectTrigger: Placeholder text when no value is selected
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - error?: boolean — SelectTrigger: Whether the select trigger has an error state
  - selectLabel?: string — SelectTrigger: Accessible label for the select trigger. Priority: aria-label > selectLabel > placeholder > "Select an option" (default "Select) an option"
when_to_use: Do NOT use for: searchable lists (use Combobox); multi-select (use Combobox).
aliases: [dropdown, picker, select menu]
---

```jsx
<Select>
  <SelectTrigger dataHook="my-select">
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectSeparator />
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```
```jsx
<Select>
  <SelectTrigger dataHook="my-select" selectLabel={t("select.label")}>
    <SelectValue placeholder={t("select.placeholder")} />
  </SelectTrigger>
  <SelectContent>...</SelectContent>
</Select>
```
```jsx
<Select>
  <SelectTrigger dataHook="select-trigger">
    <SelectValue placeholder="Select a framework" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Frontend Frameworks</SelectLabel>
      <SelectItem value="react">React</SelectItem>
      <SelectItem value="vue">Vue.js</SelectItem>
      <SelectItem value="angular">Angular</SelectItem>
    </SelectGroup>
    <SelectGroup>
      <SelectLabel>Backend Frameworks</SelectLabel>
      <SelectItem value="node">Node.js</SelectItem>
      <SelectItem value="django">Django</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-select--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
