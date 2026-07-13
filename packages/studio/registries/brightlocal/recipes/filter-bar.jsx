// FilterBar — A horizontal bar with search input and filter dropdowns for filtering data.
// keywords: filter bar, search bar, search and filter, toolbar, filter controls, data filters
// components: input, select, button
// Harvested from BrightLocal's DS MCP (get_composition_recipe "FilterBar") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<div className="flex flex-wrap items-center gap-3">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input dataHook="search-input" placeholder="Search..." className="pl-9" />
  </div>
  <Select>
    <SelectTrigger dataHook="status-filter" className="w-[160px]">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="active">Active</SelectItem>
      <SelectItem value="inactive">Inactive</SelectItem>
    </SelectContent>
  </Select>
  <Button dataHook="clear-filters" variant="outline" size="sm">Clear</Button>
</div>
