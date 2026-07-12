---
name: Combobox
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/combobox"
subcomponents: [ComboboxTrigger, ComboboxContent, ComboboxInput, ComboboxList, ComboboxVirtualList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxSeparator, ComboboxValue, ComboboxLoading]
props:
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - open? — TODO(review): type + one-line description from src
  - onOpenChange? — TODO(review): type + one-line description from src
  - shouldFilter? — TODO(review): type + one-line description from src
  - side? — TODO(review): type + one-line description from src
  - sideOffset? — TODO(review): type + one-line description from src
  - avoidCollisions? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Dropdown with 10+ options where search/filtering improves UX Autocomplete or typeahead for large lists (cities, categories, users) Multi-select with search capability Do NOT use for: simple select without search (use Select); command palette (use Command). Use Select for short lists (under 10 options) where search is unnecessary. Use Command for keyboard-driven command palettes or action search. Use DropdownMenu for action menus triggered by a button — not form selection.
composes_with: [Select, Command, DropdownMenu]
aliases: [autocomplete, searchable select, typeahead, filterable dropdown]
---

```jsx
<div className="w-full max-w-[350px]">
  <Combobox
    onValueChange={function z0e(){}}
    value=""
  >
    <ComboboxTrigger
      aria-label="Search dynamically"
      dataHook="combobox-async"
    >
      <ComboboxValue placeholder="Search dynamically..." />
    </ComboboxTrigger>
    <ComboboxContent
      hideList
      side="bottom"
      sideOffset={4}
    >
      <ComboboxInput
        onValueChange={function z0e(){}}
        placeholder="Type at least 2 characters..."
        value=""
      />
      <ComboboxList>
        <React.Fragment key=".0" />
      </ComboboxList>
    </ComboboxContent>
  </Combobox>
</div>
```
```jsx
<div className="w-full max-w-[350px]">
  <Combobox
    onValueChange={function z0e(){}}
    shouldFilter
    value="city-42"
  >
    <ComboboxTrigger
      aria-label="Select a city"
      dataHook="combobox-virtual"
    >
      <ComboboxValue
        items={[
          {
            label: 'City 0001',
            value: 'city-0'
          },
          {
            label: 'City 0002',
            value: 'city-1'
          },
          {
            label: 'City 0003',
            value: 'city-2'
          },
          {
            label: 'City 0004',
            value: 'city-3'
          },
          {
            label: 'City 0005',
            value: 'city-4'
          },
          {
            label: 'City 0006',
            value: 'city-5'
          },
          {
            label: 'City 0007',
            value: 'city-6'
          },
          {
            label: 'City 0008',
            value: 'city-7'
          },
          {
            label: 'City 0009',
            value: 'city-8'
          },
          {
            label: 'City 0010',
            value: 'city-9'
          },
          {
            label: 'City 0011',
            value: 'city-10'
          },
   
/* …truncated */
```
```jsx
<div className="w-full max-w-[350px]">
  <Combobox
    onValueChange={function z0e(){}}
    shouldFilter
    value=""
  >
    <ComboboxTrigger
      aria-label="Select a location"
      dataHook="combobox-default"
    >
      <ComboboxValue placeholder="Seleccionar ubicación..." />
    </ComboboxTrigger>
    <ComboboxContent
      avoidCollisions
      side="bottom"
      sideOffset={4}
    >
      <ComboboxInput
        onValueChange={function z0e(){}}
        placeholder="Buscar ubicaciones..."
        value=""
      />
      <ComboboxList>
        <ComboboxEmpty>
          No se encontraron resultados.
        </ComboboxEmpty>
        <ComboboxGroup>
          <ComboboxItem
            highlight=""
            highlightClassName="text-sm leading-normal font-semibold"
            value="loc-1"
          >
            Brew and Bean cafe, Brighton, UK
          </ComboboxItem>
          <ComboboxItem
            highlight=""
            highlightClassName="text-sm leading-normal font-semibold"
            value="loc-2"
          >
            The Coffee House, London, UK
          </ComboboxItem>
          <ComboboxItem
            highlight=""
            highlightClassName="text-
/* …truncated */
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-combobox--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
