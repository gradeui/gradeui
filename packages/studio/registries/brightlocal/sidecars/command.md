---
name: Command
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/command"
subcomponents: [CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CommandVirtualItem, CommandVirtualList]
props:
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
  - trackingEl?: string — Tracking element identifier for analytics
  - trackingLabel?: string — Tracking label for analytics context
  - onClear? — CommandInput: Callback when clear button is clicked
  - debounceMs?: number — CommandInput: Debounce delay in milliseconds for the `onValueChange` callback. The input display updates immediately; only the callback is debounced. Useful for async filtering to avoid firing on every keystroke. @example 300
  - clearSearchAriaLabel?: string — CommandInput: Accessible label for the clear button. (default "Clear) search"
  - selected?: boolean — CommandItem: Whether the item is selected (shows checkmark)
  - value: string — CommandVirtualItem: Unique value identifying this item.
  - disabled?: boolean — CommandVirtualItem: Whether this item is disabled.
  - onSelect? — CommandVirtualItem: Callback when the item is activated (click or Enter).
  - items — CommandVirtualList: Array of items to render. Memoize to avoid re-registration on every render.
  - getItemValue — CommandVirtualList: Extract a unique string value from each item.
  - getItemLabel? — CommandVirtualList: Extract a display label for filtering. Defaults to `getItemValue`.
  - getItemKeywords? — CommandVirtualList: Extra searchable keywords per item.
  - estimateSize?: number — CommandVirtualList: Estimated item height in px for the virtualiser. (default 44)
  - overscan?: number — CommandVirtualList: Number of items to render outside the visible viewport. (default 5)
  - children — CommandVirtualList: Render function called for each visible item.
  - renderEmpty? — CommandVirtualList: Content rendered when the filtered list is empty.
  - className?: string — CommandVirtualList: Accessible label for the listbox. Required for a11y — describes the list's purpose to screen readers. / "aria-label": string; / Additional CSS classes for the scroll container.
---

```jsx
<Command dataHook="my-command">
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem dataHook="calendar-item">
        <Calendar />
        <span>Calendar</span>
      </CommandItem>
      <CommandItem dataHook="settings-item">
        <Settings />
        <span>Settings</span>
        <CommandShortcut>⌘S</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```
```jsx
<CommandInput
  placeholder={t("command.placeholder")}
  clearSearchAriaLabel={t("command.clearSearch")}
/>
```
```jsx
<Command
  className="w-[512px]"
  dataHook="command"
>
  <React.Fragment key=".0">
    <CommandInput
      clearSearchAriaLabel="Borrar búsqueda"
      placeholder="Escribe un comando..."
    />
    <CommandList>
      <CommandEmpty>
        No se encontraron resultados.
      </CommandEmpty>
      <CommandGroup heading="Sugerencias">
        <CommandItem>
          <Calendar />
          <span>
            Calendario
          </span>
        </CommandItem>
        <CommandItem>
          <Settings />
          <span>
            Configuración
          </span>
          <CommandShortcut>
            ⌘S
          </CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </React.Fragment>
</Command>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-command--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
