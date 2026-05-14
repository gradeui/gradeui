---
"@gradeui/ui": minor
---

Add `<Map>` and `<MapMarker>` — a provider-agnostic map primitive.

The component lazy-loads one of three adapters per the `provider` prop:

- `maplibre` (default) — uses `maplibre-gl` + MapTiler tiles. The free
  zero-key public demo on `gradeui.com` works via a referrer-locked
  Grade-owned MapTiler key (lives in
  `components/ui/map/demo-config.ts`); consumers on other domains must
  pass their own key via the `tilerKey` prop.
- `mapbox` — requires `accessToken`. Same engine and style spec as
  MapLibre, swap with one line.
- `google` — requires `apiKey`. Uses `AdvancedMarkerElement` for DOM
  markers so children inherit `--rds-*` tokens like every other DS part.

All three SDKs are **optional peer deps** — `maplibre-gl`, `mapbox-gl`,
and `@googlemaps/js-api-loader` are declared in `peerDependenciesMeta`
as optional. Consumers install only what they use. Using a provider
without its SDK installed surfaces `onError({ code: "sdk-missing" })`
with a developer-facing message containing the install command.

API highlights (full spec in `packages/ui/MAP.md`, model-facing notes
in `packages/studio/src/playbook/components/map.md`):

- `<Map provider center zoom appearance="auto" hoveredId onHoveredIdChange>`
- `<MapMarker id at anchor>` — children are arbitrary DOM, inherit tokens
- `appearance="auto"` follows `<GradeThemeProvider>` mode (light/dark)
- Imperative ref: `flyTo(id|coords)`, `panTo`, `fitBounds`, `getCenter`,
  `getZoom`, `getBounds`, plus `instance` (the provider-native escape
  hatch — cast and use the SDK directly for 3D, custom layers, drawing,
  heatmaps, etc.)

Sub-path exports `@gradeui/ui/map/maplibre`, `/map/mapbox`, `/map/google`
let consumers preload a single adapter (skipping the default async
boundary) for SSG or eager-load scenarios.

Coordinates are always `[lng, lat]` tuples in the public API. Each
adapter normalizes internally — Google's `{ lat, lng }` object form is
handled in `adapters/google.ts`.

Unblocks the `airbnb-listings` reference layout, parked under
`MISSING_COMPONENTS` in `packages/studio/src/playbook/layouts/index.ts`.
That scaffold ships in a follow-up changeset alongside the
`MISSING_COMPONENTS` cleanup.
