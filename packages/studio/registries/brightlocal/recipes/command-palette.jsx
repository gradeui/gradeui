// CommandPalette — A keyboard-triggered command palette for quick navigation and actions.
// keywords: command palette, command menu, command k, spotlight, quick actions, search palette, cmd k
// components: command, dialog
// Harvested from BrightLocal's DS MCP (get_composition_recipe "CommandPalette") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    dataHook="command-palette"
    className="p-0 overflow-hidden"
  >
    <Command>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem>Dashboard</CommandItem>
          <CommandItem>Settings</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem>Create Location</CommandItem>
          <CommandItem>Generate Report</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </DialogContent>
</Dialog>
