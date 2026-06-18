---
"@gradeui/ui": minor
---

Add `DataView` — one dataset, drawn as a table, a list of cards, or a grid.

- **Wraps TanStack Table so pages stop re-typing the boilerplate.** Hand it `data` plus a `columns` schema and it owns sorting, column visibility, selection, and view switching. Columns declare a `type` (badge / tags / number / currency / percent / date / boolean / url / text) that DataView renders, with a `cell` override per column for bespoke cells (avatars, relations) and `role: "title"` marking the primary field for card / grid composition.
- **The view toggle can live anywhere.** `useDataView()` holds the view / selection / sorting / column-visibility state, so `<DataViewToggle>` and `<DataViewColumns>` (the "choose what to display" menu) can sit in a page header and drive a `<DataView>` lower down. Pass `toolbar` to render them inline instead. Single-view is first-class: `views={["table"]}` (or just `defaultView`) is only ever that one view, no switch.
- **Table extras:** mark a column `pinned="left"` (with a `width`) for a fixed column and `stickyHeader` to freeze the header row on scroll. Tunable via `--gds-data-view-*` (card / grid min column width, gap).
- For a single record's fields use `PropertyList`; for the bare table primitive use `Table`.

Adds `@tanstack/react-table` as a dependency of `@gradeui/ui`.
