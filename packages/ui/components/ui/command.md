---
name: Command
import: "@gradeui/ui"
subcomponents: [CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut, CommandDialog]
props:
  - Command: value?: string — controlled active item value
  - Command: onValueChange?: (value: string) => void
  - CommandInput: placeholder?: string
  - CommandList: children: React.ReactNode — wraps groups and empty state
  - CommandEmpty: children: React.ReactNode — fallback when no items match
  - CommandGroup: heading?: string
  - CommandItem: value?: string — used for filter matching and selection emit
  - CommandItem: onSelect?: (value: string) => void
  - CommandItem: disabled?: boolean
  - CommandShortcut: children: React.ReactNode — right-aligned keyboard hint (⌘K, ⌥F)
  - CommandDialog: open, onOpenChange — when you want the command palette mounted in a modal (cmd+k pattern)
when_to_use: A searchable list of actions or destinations — global ⌘K palettes, "jump to" inputs, account switchers with filter. Wrap in CommandDialog when it should pop over the entire app on a hotkey. For straight forms with filter, prefer a Select with a search input. For free-text autocomplete tied to a single value, prefer Combobox built on Popover + Command.
composes_with: [Dialog (CommandDialog wraps it), Popover (inline combobox), Tooltip]
aliases: [command palette, command menu, cmd k, quick switcher, action menu, spotlight, spotlight search, quick open, fuzzy finder]
---

```jsx
// Global ⌘K palette — toggled with a keydown listener at the app root.
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command…" />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Navigate">
      <CommandItem onSelect={() => router.push("/docs")}>
        <Book /> Docs <CommandShortcut>⌘D</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={() => router.push("/studio")}>
        <Sparkles /> Studio <CommandShortcut>⌘S</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```
