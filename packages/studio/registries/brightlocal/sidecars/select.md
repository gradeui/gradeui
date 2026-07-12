---
name: Select
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/select"
subcomponents: [SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - dataHook?: string — optional on structural components (renders data-hook)
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
