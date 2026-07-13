// SplitButton — A button with a primary action and a dropdown for secondary actions.
// keywords: split button, button with menu, button with dropdown, button group, primary secondary action
// components: button, dropdown-menu
// Harvested from BrightLocal's DS MCP (get_composition_recipe "SplitButton") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<div className="inline-flex rounded-full shadow-sm">
  <Button dataHook="split-primary" className="rounded-r-none">
    Save
  </Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button dataHook="split-trigger" variant="outline" className="rounded-l-none border-l-0 px-2" iconOnly>
        <ChevronDown />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Save as draft</DropdownMenuItem>
      <DropdownMenuItem>Save and close</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
