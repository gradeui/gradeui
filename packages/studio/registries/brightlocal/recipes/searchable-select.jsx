// SearchableSelect — A searchable, filterable dropdown for selecting from large lists.
// keywords: searchable select, filterable dropdown, search select, autocomplete select, typeahead, combobox
// components: combobox
// Harvested from BrightLocal's DS MCP (get_composition_recipe "SearchableSelect") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Combobox
  dataHook="category-select"
  options={categories.map(c => ({ value: c.id, label: c.name }))}
  placeholder="Search categories..."
  onValueChange={setSelectedCategory}
/>
