// DataTableWithCardView — A DataTable with a toggle to switch between table and card views. Uses the shared useDataTable hook so pagination, search, and sorting work in both views. The card layout is consumer-defined via a renderCard function.
// keywords: table card view, table grid toggle, view switcher, card view, grid view, data table cards, table or cards, toggle table cards, list grid switch
// components: data-table, toggle-group, card, badge
// Harvested from BrightLocal's DS MCP (get_composition_recipe "DataTableWithCardView") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { useDataTable, DataTable, DataTableToolbar, DataTableToolbarLeft, DataTableToolbarRight, DataTableSearch, DataTablePagination } from "@brightlocal/ui-components/data-table";
import { ToggleGroup, ToggleGroupItem } from "@brightlocal/ui-components/toggle-group";
import { Card, CardContent } from "@brightlocal/ui-components/card";
import { Badge } from "@brightlocal/ui-components/badge";
import { LayoutGrid, Table as TableIcon } from "@brightlocal/icons";

const table = useDataTable({
  columns,
  data: locations,
  enableSorting: true,
  enableGlobalFiltering: true,
  enablePagination: true,
  pageSize: 6,
});

const [view, setView] = React.useState<"table" | "cards">("table");

<div>
  <DataTableToolbar dataHook="locations-toolbar">
    <DataTableToolbarLeft>
      <DataTableSearch table={table} dataHook="locations-search" placeholder="Search..." />
    </DataTableToolbarLeft>
    <DataTableToolbarRight>
      <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as "table" | "cards")} dataHook="view-toggle">
        <ToggleGroupItem value="cards" dataHook="view-cards"><LayoutGrid /> Cards</ToggleGroupItem>
        <ToggleGroupItem value="table" dataHook="view-table"><TableIcon /> Table</ToggleGroupItem>
      </ToggleGroup>
    </DataTableToolbarRight>
  </DataTableToolbar>

  {view === "table" ? (
    <DataTable table={table} dataHook="locations-table" />
  ) : (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {table.getRowModel().rows.map((row) => {
        const location = row.original;
        return (
          <Card key={row.id} dataHook={`location-card-${row.id}`}>
            <CardContent>
              {location.image && <img src={location.image} alt={location.name} className="mb-3 h-40 w-full rounded-md object-cover" />}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{location.name}</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>
                <Badge dataHook={`status-${row.id}`} variant={location.status === "Active" ? "default" : "secondary"}>
                  {location.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  )}

  <DataTablePagination table={table} dataHook="locations-pagination" />
</div>
