// ResponsiveToggle — A toggle group on desktop that collapses to a select dropdown on mobile.
// keywords: responsive toggle, toggle dropdown, mobile toggle, toggle button group, responsive switch
// components: toggle-group, select
// Harvested from BrightLocal's DS MCP (get_composition_recipe "ResponsiveToggle") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

// Desktop: visible toggle group
<div className="hidden sm:block">
  <ToggleGroup type="single" value={view} onValueChange={setView} dataHook="view-toggle">
    <ToggleGroupItem value="grid" dataHook="view-grid">Grid</ToggleGroupItem>
    <ToggleGroupItem value="list" dataHook="view-list">List</ToggleGroupItem>
  </ToggleGroup>
</div>
// Mobile: select dropdown
<div className="sm:hidden">
  <Select value={view} onValueChange={setView}>
    <SelectTrigger dataHook="view-select"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="grid">Grid</SelectItem>
      <SelectItem value="list">List</SelectItem>
    </SelectContent>
  </Select>
</div>
