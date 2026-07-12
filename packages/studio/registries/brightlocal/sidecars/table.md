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

```jsx
<Table dataHook="my-table">
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead align="right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell><Badge dataHook="status-badge">Active</Badge></TableCell>
      <TableCell align="right">$250.00</TableCell>
    </TableRow>
  </TableBody>
  <TableCaption>A list of recent transactions.</TableCaption>
</Table>
```
```jsx
<Table dataHook="invoices-table">
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead align="right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell><Badge dataHook="status-badge">Paid</Badge></TableCell>
      <TableCell align="right">$250.00</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>INV002</TableCell>
      <TableCell><Badge dataHook="status-badge">Pending</Badge></TableCell>
      <TableCell align="right">$150.00</TableCell>
    </TableRow>
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={2}>Total</TableCell>
      <TableCell align="right">$400.00</TableCell>
    </TableRow>
  </TableFooter>
</Table>
```

<!-- Examples harvested from https://storybook.brightlocal.com (ui-components-table--docs); re-run harvest-brightlocal-stories.mjs to refresh. -->
