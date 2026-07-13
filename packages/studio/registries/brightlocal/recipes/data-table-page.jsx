// DataTablePage — A full DataTable page with useDataTable hook, search toolbar, and pagination inside a Card.
// keywords: data table page, table page, data grid page, admin table, table with search, table with pagination, useDataTable
// components: data-table, card
// Harvested from BrightLocal's DS MCP (get_composition_recipe "DataTablePage") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { useDataTable, DataTable, DataTableToolbar, DataTableToolbarLeft, DataTableToolbarRight, DataTableSearch, DataTablePagination } from "@brightlocal/ui-components/data-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@brightlocal/ui-components/card";

const columns = [
  // Define your column defs here
];

const table = useDataTable({
  columns,
  data: locations,
  enableSorting: true,
  enableGlobalFilter: true,
  initialPagination: { pageSize: 10 },
});

<Card dataHook="locations-page" className="py-0 gap-0">
  <CardHeader className="py-4">
    <CardTitle>Locations</CardTitle>
    <CardDescription>Manage all your business locations.</CardDescription>
  </CardHeader>
  <CardContent className="py-0 px-0">
    <DataTableToolbar dataHook="locations-toolbar">
      <DataTableToolbarLeft>
        <DataTableSearch table={table} dataHook="locations-search" placeholder="Search locations..." />
      </DataTableToolbarLeft>
      <DataTableToolbarRight>
        <DataTablePagination table={table} dataHook="locations-pagination" />
      </DataTableToolbarRight>
    </DataTableToolbar>
    <DataTable table={table} dataHook="locations-table" />
  </CardContent>
</Card>
