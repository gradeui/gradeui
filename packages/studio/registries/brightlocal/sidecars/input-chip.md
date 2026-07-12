---
name: InputChip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-chip"
subcomponents: [InputChipInput, InputChipItems]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - defaultValue? — TODO(review): type + one-line description from src
  - disabled? — TODO(review): type + one-line description from src
  - allowDuplicates? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

```jsx
<InputChip
  defaultValue={[
    'React',
    'TypeScript'
  ]}
>
  <InputChipInput
    className="w-80"
    dataHook="input-chip"
    placeholder="Add an option..."
  >
    <InputChipItems
      dataHookPrefix="input-chip-chip"
      itemAriaLabel="Elemento, presione Suprimir para eliminar"
    />
  </InputChipInput>
</InputChip>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-inputchip--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
