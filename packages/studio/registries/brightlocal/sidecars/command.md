---
name: Command
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/command"
subcomponents: [CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut, CommandVirtualItem, CommandVirtualList]
props:
  - filter? — TODO(review): type + one-line description from src
  - value? — TODO(review): type + one-line description from src
  - onValueChange? — TODO(review): type + one-line description from src
  - onClear? — TODO(review): type + one-line description from src
  - debounceMs? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
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
