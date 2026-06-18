---
"@gradeui/ui": minor
---

Add `PropertyList` — the read-only "one record, stacked" display primitive.

- **New `PropertyList` + `PropertyList.Row`.** A PropertyList is a Table row transposed: where a Table runs the schema horizontally (a column per field, across many records), a PropertyList stacks one record's fields vertically as label / value pairs. Reach for it for detail panels, inspectors, "about this item" cards, and record summaries.
- **Polymorphic value slot.** The value side is `children` (or the `value` prop), not a string — so the same renderers that fill a Table cell (a Badge, an avatar stack, a date, a wrapping tag group, a link) drop straight into a row, and the two surfaces never drift.
- **Semantic + token-driven.** Renders a real `<dl>` / `<dt>` / `<dd>`. Layout (`row` / `stack`), density (`compact` / `default` / `relaxed`), alignment, dividers, and label-column width are driven by `--gds-property-list-*` so a narrow inspector and a wide settings page share one primitive. Parts emit `data-gds-part="property-list" | "property" | "property-label" | "property-value"`.
- It is a display primitive — for an editable label + control use `Field`; a read↔edit detail panel swaps a PropertyList for a stack of Fields.
