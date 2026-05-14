# @gradeui/studio

## 0.1.0

### Minor Changes

- 6a61a68: Add the `airbnb-listings` reference layout — the canonical two-pane
  list ↔ map pattern. Was parked under "Reference layouts we WANT to
  ship" pending the Map primitive; ships now that `<Map>` and
  `<MapMarker>` landed in `@gradeui/ui@0.9.0`.

  Shape: `AppShell nav="top"` with a filter bar (search input,
  DateRangePicker, guests + type Selects, Filters button), then a
  two-pane main — scrollable Card listings on the left, full-bleed
  `<Map>` on the right. Hover sync runs through the controlled
  `hoveredId` / `onHoveredIdChange` prop pair, demonstrating the
  recommended pattern (no refs, no imperative `flyTo`).

  Tags include `airbnb`, `stays`, `listings`, `real estate`, `fleet`,
  `logistics`, `lodging`, `vacation` — covers the full "location-first
  SaaS demo" cluster of prompts the retrieval pass is most likely to
  match.

  Source: `packages/studio/src/playbook/layouts/scaffolds/airbnb-listings.jsx`.
  Run `pnpm -F @gradeui/studio generate:scaffolds` after pulling to
  inline it into `scaffolds.generated.ts`.
