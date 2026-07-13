---
name: InputChip
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/input-chip"
subcomponents: [InputChipInput, InputChipItems]
props:
  - value? — Controlled value - array of chip values
  - defaultValue? — Default value for uncontrolled mode
  - onValueChange? — Callback when value changes
  - disabled?: boolean — Disabled state
  - allowDuplicates?: boolean — Allow duplicate values (default: false)
  - children — Children
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — InputChipInput: Tracking element identifier for analytics
  - trackingLabel?: string — InputChipInput: Tracking label for analytics context
  - placeholder?: string — InputChipInput: Placeholder text for the input
  - error?: boolean — InputChipInput: Whether the input has an error state
  - inputId?: string — InputChipInput: ID for the input element (for label association)
  - className?: string — InputChipItems: Custom className for the container
  - dataHookPrefix?: string — InputChipItems: Data hook prefix for chips
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
