---
name: DataTable
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/data-table"
subcomponents: [VirtualizedDataTable, useDataTable, DataTableColumnHeader, DataTableSearch, DataTablePagination, DataTablePaginationRowCount, DataTablePaginationNav, DataTableSelectAllCheckbox, DataTableSelectRowCheckbox, DataTableToolbar, DataTableToolbarLeft, DataTableToolbarRight]
props:
  - columns? — TODO(review): type + one-line description from src
  - data? — TODO(review): type + one-line description from src
  - enableSorting? — TODO(review): type + one-line description from src
  - enableGlobalFiltering? — TODO(review): type + one-line description from src
  - enableRowSelection? — TODO(review): type + one-line description from src
  - enablePagination? — TODO(review): type + one-line description from src
  - pageSize? — TODO(review): type + one-line description from src
  - isLoading? — TODO(review): type + one-line description from src
  - noResultsMessage? — TODO(review): type + one-line description from src
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
---

Full-featured data table with sorting, filtering, pagination, and row selection.

## Guidance

A powerful data table for displaying, sorting, filtering, and paginating data. Built on [TanStack Table](https://tanstack.com/table/latest).

### When to Use
- Displaying tabular data with sorting and filtering
- Lists with row selection (bulk actions)
- Paginated data views (admin panels, dashboards)
- Server-driven lists with async loading and page-by-page fetching

### Architecture

The DataTable platform is built on a **hook + renderer + helpers** composition model:

**Core hook:**
- **`useDataTable`** — owns the TanStack Table instance, feature toggles, and controlled/uncontrolled state orchestration. All rendering components receive the table instance from this hook.

**Three rendering modes:**
- **`DataTable`** — standard renderer for headers, rows, loading skeletons, and empty state. Renders with a rounded border container (`border-border rounded-md border`). Use for most tables.
- **`VirtualizedDataTable`** — drop-in alternative that renders only visible rows via `@tanstack/react-virtual`. Also renders with a rounded border container. Use for large datasets (1 000+ rows).
**Toolbar layout** (responsive container for search + pagination):
- **`DataTableToolbar`** — root flex container. Stacks vertically on mobile, horizontal row on `sm:` and up. Requires `dataHook`.
- **`DataTableToolbarLeft`** — left slot (search/filters). Grows to fill remaining space on desktop.
- **`DataTableToolbarRight`** — right slot (pagination/actions). Collapses to content width, right-aligned.

**Composable helpers** (designed to be placed *around* the view):
- **`DataTableSearch`** — search input for global filtering.
- **`DataTablePagination`** — pagination controls with optional row count text. Use `showRowCount={false}` to hide the row count, or `renderRowCount` for i18n-friendly text. Supports both client-side and server-side modes.
- **`DataTableColumnHeader`** — sortable column header with directional icons and accessible sort announcements.
- **`DataTableSelectAllCheckbox`** / **`DataTableSelectRowCheckbox`** — row selection checkboxes with indeterminate state support.

### Features
- Client-side sorting, filtering, and pagination
- Server-side / manual modes (`manualSorting`, `manualFiltering`, `manualPagination`) — keep UI state tracking while skipping client-side row transforms
- Virtualized rendering via `VirtualizedDataTable` for large datasets — only visible rows are in the DOM
- Row selection with checkboxes (single or multi-select) with stable IDs for server-side scenarios
- Customizable column headers with sort indicators and `aria-sort` announcements
- Loading skeleton state for async data
- Composable search and pagination components
- Accessible empty state with `aria-live` announcement

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "data-table") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
