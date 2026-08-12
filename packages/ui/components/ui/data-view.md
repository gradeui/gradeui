---
name: DataView
import: "@gradeui/ui"
props:
  - data: T[] — the rows
  - columns: { key, header, type?, options?, cell?, role?, sortable?, pinned?, width?, align?, hideable?, defaultHidden? }[] — the schema; one list drives table, cards, and grid
  - getRowId?: (row, i) => string — defaults to row.id
  - view? / defaultView? / onViewChange?: "table" | "cards" | "grid" — controlled or uncontrolled view
  - views?: ("table" | "cards" | "grid")[] — allowed views; one entry = single view, no toggle
  - activeId? / defaultActiveId? / onActiveChange?: string | null — the selected row; click emits it
  - sorting? / defaultSorting? / onSortingChange? — TanStack SortingState
  - columnVisibility? / defaultColumnVisibility? / onColumnVisibilityChange? — which fields show
  - pageSize?: number — rows per page. Unset = no pagination (every row renders, the page scrolls). Set it for a history that grows: the table stops scrolling inside itself and grows a pager instead.
  - stickyHeader?: boolean — freeze the header row on scroll
  - toolbar?: boolean — render the built-in columns menu + view toggle above the view
  - renderCard?: (row, { active }) => ReactNode — override card / grid tiles
  - emptyMessage?: ReactNode
when_to_use: One dataset, drawn as a table, a list of cards, or a grid — without re-typing the TanStack boilerplate (sortable headers, flexRender, selection, view switch) on every page. Hand it data + a columns schema; columns declare a `type` (badge/tags/number/currency/percent/date/boolean/url/text) that DataView renders, with a `cell` override for bespoke cells (avatars, relations). The view toggle can live anywhere — `useDataView()` holds the state so a `<DataViewToggle>` or `<DataViewColumns>` in a page header drives a `<DataView>` lower down. Mark a column `pinned="left"` (with a `width`) for a fixed column and `stickyHeader` to freeze the header. For a single record's fields use PropertyList; for the raw table primitive use Table.
composes_with: [Table, Card, Badge, Avatar, ToggleGroup, DropdownMenu, PropertyList, Combobox]
aliases: [data view, data table, datatable, data grid, dataview, table view, card view, grid view, list view, gallery, records list, master list, tanstack table, sortable table, column visibility, pinned column, frozen column, sticky header, view switcher]
---

```jsx
const dv = useDataView({ defaultView: "table", defaultActiveId: rows[0].id });

// The toggle / columns menu can live anywhere — they just read dv.
<Row justify="between">
  <h1>Alerts</h1>
  <Row gap="sm">
    <DataView.Columns columns={columns} visibility={dv.columnVisibility} onVisibilityChange={dv.setColumnVisibility} />
    <DataView.Toggle value={dv.view} onChange={dv.setView} views={dv.views} />
  </Row>
</Row>

<DataView
  data={rows}
  columns={columns}
  view={dv.view}
  activeId={dv.activeId}
  onActiveChange={dv.setActiveId}
  sorting={dv.sorting}
  onSortingChange={dv.setSorting}
  columnVisibility={dv.columnVisibility}
  onColumnVisibilityChange={dv.setColumnVisibility}
  stickyHeader
/>
```

```jsx
// Self-contained: built-in toolbar, single column pinned, table only.
<DataView
  data={rows}
  toolbar
  columns={[
    { key: "name", header: "Name", role: "title", pinned: "left", width: 220 },
    { key: "status", header: "Status", type: "badge", options: statusOptions, sortable: true },
    { key: "arr", header: "ARR", type: "currency", align: "end", sortable: true },
  ]}
/>
```
