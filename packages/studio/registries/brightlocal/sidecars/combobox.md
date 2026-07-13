---
name: Combobox
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/combobox"
subcomponents: [ComboboxTrigger, ComboboxContent, ComboboxInput, ComboboxList, ComboboxVirtualList, ComboboxEmpty, ComboboxGroup, ComboboxItem, ComboboxSeparator, ComboboxValue, ComboboxLoading]
props:
  - value?: string — Controlled selected value
  - onValueChange? — Callback when value changes
  - open?: boolean — Controlled open state
  - onOpenChange? — Callback when open state changes
  - shouldFilter?: boolean — Whether to use built-in client-side filtering. Defaults to `true`. Both `ComboboxList` (cmdk) and `ComboboxVirtualList` respect this flag. Set to `false` only for async/server-driven search where the consumer controls the items list.
  - disabled?: boolean — Disabled state
  - itemToStringValue? — Maps item value to a searchable string. When provided, filtering uses this string instead of the raw value.
  - children — Children
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - error?: boolean — ComboboxTrigger: Accessible label for the combobox trigger. Use either aria-label or aria-labelledby for accessibility. / "aria-label"?: string; / ID reference to a label element that provides the accessible name / "aria-labelledby"?: string; / Whether the combobox trigger has an error state
  - trackingEl?: string — ComboboxTrigger: Tracking element identifier for analytics
  - trackingLabel?: string — ComboboxTrigger: Tracking label for analytics context
  - placeholder?: string — ComboboxValue: Placeholder text when no value is selected
  - className?: string — ComboboxValue: Custom className
  - align? — ComboboxContent: Alignment of the popover relative to trigger
  - side? — ComboboxContent: Which side of the trigger to render the popover. Only vertical positioning is supported — the dropdown spans the full trigger width. (default "bottom")
  - sideOffset?: number — ComboboxContent: Distance in px between the trigger and the popover. (default 4)
  - avoidCollisions?: boolean — ComboboxContent: When true, Radix avoids collisions with the viewport/boundaries by flipping and/or shifting the popover to keep it in view. Set to false to disable collision handling and force the requested position. (default true)
  - hideList?: boolean — ComboboxContent: Hide the list area (and the input border). Useful for async search where you want to hide results until a minimum character count.
  - ariaLabel?: string — ComboboxContent: Accessible label for the options popover. (default "Options")
  - debounceMs?: number — ComboboxInput: Debounce delay in milliseconds for the `onValueChange` callback. The input display updates immediately; only the callback is debounced. Useful for async search to avoid firing API calls on every keystroke. @example 300
  - items — ComboboxVirtualList: Array of items to virtualise. Memoize with useMemo to avoid re-registering labels on every render.
  - getItemValue? — ComboboxVirtualList: Extract the string value for each item (used for selection and keyboard navigation). Auto-inferred for items with a `value` string property.
  - getItemLabel? — ComboboxVirtualList: Extract a display label for filtering and trigger display. Defaults to `getItemValue`. Only used when `shouldFilter` is true on the parent Combobox.
  - getItemKeywords? — ComboboxVirtualList: Extract additional keywords to match against when filtering. The item label is always included automatically — these are extras (e.g. ISO codes, abbreviations) that should be searchable without appearing in the trigger display.
  - estimateSize?: number — ComboboxVirtualList: Estimated item height in pixels. (default 36)
  - overscan?: number — ComboboxVirtualList: Number of items to render above and below the visible area. (default 5)
  - renderEmpty? — ComboboxVirtualList: Content to render when no items match the filter
  - label?: string — ComboboxItem: Display label - if not provided, inferred from children text content. Required when children are React elements (not plain text) to enable label-based search and trigger display.
  - highlight?: string — ComboboxItem: Text to highlight in the item (typically the search query)
  - highlightClassName?: string — ComboboxItem: Class name for highlighted text
  - keywords? — ComboboxItem: Additional keywords to match against when filtering. The item label is always included automatically.
  - onSelect? — ComboboxItem: Callback fired when the item is activated (clicked or chosen via keyboard). Fires on every activation, including when the item is being deselected (toggled off). Always receives the item's own value, not the resulting combobox value — use `Combobox`'s `onValueChange` for selection state. @param value - The value of the activated item
  - loadingText?: string — ComboboxLoading: Loading text displayed next to the spinner. (default "Loading...")
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
