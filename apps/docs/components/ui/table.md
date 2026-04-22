---
name: Table
import: "@gradeui/ui"
subcomponents: [TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption]
props:
  - Each subcomponent accepts native table HTML attrs
  - No variants — styling follows the active theme tokens
when_to_use: Structured tabular data — rows × columns with alignment requirements. NOT a layout grid — for that use div+Tailwind grid utilities. Keep to <100 rows; larger datasets need virtualisation (not in DS).
composes_with: [Card (wrap the table), Badge (inside TableCell for status), Checkbox (row selection), Button (row actions)]
---

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Invoice #001</TableCell>
      <TableCell className="text-right">$250</TableCell>
    </TableRow>
  </TableBody>
</Table>
```
