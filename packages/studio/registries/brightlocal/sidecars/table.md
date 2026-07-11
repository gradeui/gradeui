---
name: Table
import: "@brightlocal/ui-components"
subpath: "@brightlocal/ui-components/table"
subcomponents: [TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption]
sizes: [default, md, lg]
props:
  - align? (left | right | center)
  - dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")
when_to_use: Simple read-only data display with no sorting, filtering, or pagination Static tables like pricing tiers, feature comparisons, or settings summaries When you control the exact columns and rows — no dynamic column configuration needed Do NOT use for: complex filtering and sorting (use DataTable block); layout grids (use CSS grid). Use DataTable for sortable, filterable, paginated tables with row selection — it wraps TanStack Table.
composes_with: [DataTable]
aliases: [data grid, grid, list table]
---

Styled HTML table with header, body, footer, and cell size variants.

## Guidance

A semantic table component for displaying structured tabular data. Custom implementation using Tailwind CSS.

### When to Use
- Displaying structured data with rows and columns (invoices, reports)
- Data grids with sortable/filterable content
- Comparison tables for features or pricing

### When Not to Use
- For simple key-value pairs, use a description list
- For card-based layouts, use Card components
- For complex interactive data grids with virtualization, use DataTable

### Features
- **Sizes**: Default, MD, LG cell heights
- **Alignment**: Logical (start/end/center) and physical (left/right) text alignment with RTL support
- **Accessibility**: `scope="col"` on headers by default, `scope="row"` supported
- Horizontal scroll container for wide tables
- Flexible cell content: text, badges, avatars, buttons, inputs

### Accessibility
- `TableHead` renders `<th scope="col">` by default for column association
- Use `scope="row"` on row header cells for row association
- `dataHook` is required on the root `Table`; optional on sub-components

### Content Guidelines
- **Empty/null cells**: Use blank space for empty data cells, not em dashes or placeholders
- **Truncation**: For long text, use CSS `truncate` class with `Tooltip` for full text on hover
- **Responsive**: Wrap Table in a container with `overflow-x-auto` (built-in) for horizontal scroll

## Props (from BrightLocal MCP)

- primary?
- enums?
- subComponents?

<!-- Harvested from BrightLocal's MCP server (get_component_api "table") — re-run harvest-brightlocal-mcp.mjs to refresh. -->
