import {
  AppShell, AppShellMain,
  Stack, Row,
  Button, Badge, Input,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Avatar, AvatarFallback,
  Checkbox,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem,
} from "@gradeui/ui";
import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Search, Plus, Download, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ListFilter,
} from "lucide-react";

export default function App() {
  // TanStack Table is headless — it owns sorting / filtering /
  // selection / pagination state, the JSX just renders the rows it
  // gives back. The scaffold below wires:
  //   • global text search (name + email substring)
  //   • multi-select status filter (DropdownMenuCheckboxItem)
  //   • multi-select plan filter
  //   • clickable column headers for sort
  //   • header + row checkboxes for selection
  //   • Prev/Next pagination
  //   • live counts ("Showing X–Y of Z", "N selected")
  // None of the buttons are decorative — every chrome element drives
  // table state.
  const customers = useMemo(() => [
    { id: "u-01", name: "Elena Okafor",  email: "elena@acme.co",   plan: "Pro",        status: "Active",    joined: "2025-03-12", initials: "EO" },
    { id: "u-02", name: "Marcus Li",     email: "marcus@acme.co",  plan: "Starter",    status: "Active",    joined: "2025-01-08", initials: "ML" },
    { id: "u-03", name: "Priya Devi",    email: "priya@kite.io",   plan: "Enterprise", status: "Paused",    joined: "2024-12-19", initials: "PD" },
    { id: "u-04", name: "Samir Khan",    email: "samir@acme.co",   plan: "Pro",        status: "Active",    joined: "2024-11-02", initials: "SK" },
    { id: "u-05", name: "Zoe Chen",      email: "zoe@zen.so",      plan: "Starter",    status: "Trial",     joined: "2025-02-21", initials: "ZC" },
    { id: "u-06", name: "Noah Park",     email: "noah@anvil.dev",  plan: "Pro",        status: "Active",    joined: "2024-10-15", initials: "NP" },
    { id: "u-07", name: "Ruth Adler",    email: "ruth@folio.app",  plan: "Enterprise", status: "Active",    joined: "2024-08-30", initials: "RA" },
    { id: "u-08", name: "Jonas Weber",   email: "jonas@weber.de",  plan: "Starter",    status: "Cancelled", joined: "2024-07-04", initials: "JW" },
    { id: "u-09", name: "Aida Bouhamid", email: "aida@ribbon.cc",  plan: "Pro",        status: "Active",    joined: "2025-04-11", initials: "AB" },
    { id: "u-10", name: "Tomas Vega",    email: "tomas@vega.dev",  plan: "Starter",    status: "Trial",     joined: "2025-05-02", initials: "TV" },
    { id: "u-11", name: "Hana Sato",     email: "hana@kohi.jp",    plan: "Enterprise", status: "Active",    joined: "2024-09-22", initials: "HS" },
    { id: "u-12", name: "Owen Hughes",   email: "owen@field.co",   plan: "Pro",        status: "Paused",    joined: "2024-06-18", initials: "OH" },
  ], []);

  // Stable badge variant per status. Kept outside the columns array
  // so it doesn't reallocate on every render.
  const statusVariant = (s) =>
    s === "Active" ? "default"
    : s === "Paused" ? "secondary"
    : s === "Trial" ? "outline"
    : "destructive";

  // Column defs — accessorKey identifies the field; enableSorting on
  // text columns; the checkbox column is purely a display column.
  const columns = useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label={`Select ${row.original.name}`}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Row gap="sm" align="center">
          <Avatar className="h-7 w-7">
            <AvatarFallback>{row.original.initials}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </Row>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue()}</span>
      ),
      enableSorting: false,
    },
    { accessorKey: "plan", header: "Plan" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge variant={statusVariant(getValue())}>{getValue()}</Badge>
      ),
      // filterFn for multi-select: keep row if its value is in the
      // selected list. Returning true with empty list = "no filter".
      filterFn: (row, columnId, value) => {
        if (!value || value.length === 0) return true;
        return value.includes(row.getValue(columnId));
      },
    },
    {
      accessorKey: "joined",
      header: "Joined",
      cell: ({ getValue }) => (
        // ISO yyyy-mm-dd sorts lexicographically; rendered short
        <span className="text-muted-foreground">
          {new Date(getValue()).toLocaleDateString("en-US", {
            month: "short", year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ], []);

  // Filter state — kept as plain state and synced into the table's
  // columnFilters on every render. This pattern lets the chrome (chip
  // strip + dropdowns) read the filter state directly without going
  // through table.getColumn().getFilterValue() everywhere.
  const [globalFilter, setGlobalFilter] = useState("");
  const [planFilter, setPlanFilter] = useState([]);    // array of plan strings
  const [statusFilter, setStatusFilter] = useState([]); // array of status strings
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  const columnFilters = useMemo(() => {
    const f = [];
    if (planFilter.length > 0) f.push({ id: "plan", value: planFilter });
    if (statusFilter.length > 0) f.push({ id: "status", value: statusFilter });
    return f;
  }, [planFilter, statusFilter]);

  const table = useReactTable({
    data: customers,
    columns,
    state: { globalFilter, columnFilters, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: (row, _id, value) => {
      if (!value) return true;
      const q = String(value).toLowerCase();
      return (
        row.original.name.toLowerCase().includes(q) ||
        row.original.email.toLowerCase().includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
    enableRowSelection: true,
  });

  const planFilterColumn = ["Starter", "Pro", "Enterprise"];
  const statusFilterColumn = ["Active", "Trial", "Paused", "Cancelled"];
  const toggleIn = (list, value, setter) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Derived view stats — TanStack tells us how many rows passed
  // filters and what slice the current page covers.
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageRows = table.getRowModel().rows;
  const pageStart = pageRows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1;
  const pageEnd = pageStart + pageRows.length - 1;
  const selectedCount = Object.keys(rowSelection).length;
  const activeFilters =
    (globalFilter ? 1 : 0) + planFilter.length + statusFilter.length;

  const clearAll = () => {
    setGlobalFilter("");
    setPlanFilter([]);
    setStatusFilter([]);
  };

  return (
    <AppShell nav="none" className="min-h-screen bg-background">
      <AppShellMain className="p-6">
        <Stack gap="lg">
          <Row justify="between" align="center">
            <Stack gap="xs">
              <h1 className="text-2xl font-semibold">Customers</h1>
              <span className="text-sm text-muted-foreground">
                {customers.length} customers · updated 2 minutes ago
              </span>
            </Stack>
            <Row gap="sm">
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Export
              </Button>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add customer
              </Button>
            </Row>
          </Row>

          {/* Filter chrome — search + two DropdownMenu multi-pickers.
              Both write into local state; useMemo above maps those
              arrays into TanStack columnFilters. */}
          <Row gap="sm" align="center" wrap>
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-7"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={planFilter.length > 0 ? "secondary" : "outline"}
                  size="sm"
                >
                  <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                  Plan
                  {planFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {planFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Plan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {planFilterColumn.map((p) => (
                  <DropdownMenuCheckboxItem
                    key={p}
                    checked={planFilter.includes(p)}
                    onCheckedChange={() => toggleIn(planFilter, p, setPlanFilter)}
                  >
                    {p}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={statusFilter.length > 0 ? "secondary" : "outline"}
                  size="sm"
                >
                  <ListFilter className="h-3.5 w-3.5 mr-1.5" />
                  Status
                  {statusFilter.length > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                      {statusFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statusFilterColumn.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={statusFilter.includes(s)}
                    onCheckedChange={() => toggleIn(statusFilter, s, setStatusFilter)}
                  >
                    {s}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>

          {/* Active-filter chip strip — only rendered when something
              is set. Each chip is a real Button that removes its own
              filter. "Clear all" wipes everything. */}
          {activeFilters > 0 && (
            <Row gap="xs" align="center" wrap>
              <span className="text-xs text-muted-foreground">Filters:</span>
              {globalFilter && (
                <Badge
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setGlobalFilter("")}
                >
                  Search: {globalFilter} ×
                </Badge>
              )}
              {planFilter.map((p) => (
                <Badge
                  key={`plan-${p}`}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => toggleIn(planFilter, p, setPlanFilter)}
                >
                  Plan: {p} ×
                </Badge>
              ))}
              {statusFilter.map((s) => (
                <Badge
                  key={`status-${s}`}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => toggleIn(statusFilter, s, setStatusFilter)}
                >
                  Status: {s} ×
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="text-xs" onClick={clearAll}>
                Clear all
              </Button>
            </Row>
          )}

          {/* Selection bar — appears when any row is selected. Real
              app would expose bulk actions here (delete, change plan). */}
          {selectedCount > 0 && (
            <Row
              justify="between"
              align="center"
              className="rounded-md border border-border bg-muted/40 px-3 py-2"
            >
              <span className="text-sm">
                {selectedCount} selected
              </span>
              <Row gap="xs">
                <Button variant="outline" size="sm">Change plan</Button>
                <Button variant="outline" size="sm">Export</Button>
                <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                  Clear
                </Button>
              </Row>
            </Row>
          )}

          {/* Table — every cell rendered via flexRender so column defs
              own both header and cell JSX. Sort indicators on the
              column header reflect the current `sorting` state. */}
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sort = header.column.getIsSorted();
                      const SortIcon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowUpDown;
                      return (
                        <TableHead
                          key={header.id}
                          className={header.column.id === "select" || header.column.id === "actions" ? "w-10" : ""}
                        >
                          {canSort ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <SortIcon className={`h-3 w-3 ${sort ? "text-foreground" : "text-muted-foreground"}`} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12 text-sm text-muted-foreground">
                      No customers match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer — real counts pulled from the table, paging via
              table.previousPage() / table.nextPage() so the buttons
              actually advance the visible window. */}
          <Row justify="between" align="center">
            <span className="text-xs text-muted-foreground">
              {filteredCount === 0
                ? "0 results"
                : `Showing ${pageStart}–${pageEnd} of ${filteredCount}`}
              {filteredCount !== customers.length && ` (filtered from ${customers.length})`}
            </span>
            <Row gap="xs" align="center">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums px-1">
                {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Row>
          </Row>
        </Stack>
      </AppShellMain>
    </AppShell>
  );
}
