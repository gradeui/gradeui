---
name: Map
import: "@gradeui/ui"
subcomponents: [MapMarker]
aliases: [map, maps, mapbox, maplibre, google maps, geo, location, latlng, coordinates, marker, pin, airbnb, listings, fleet, real estate, logistics, map view, mapkit, mapview, react native maps, rn maps]
props:
  - Map: provider — "maplibre" (default, free, no key) | "mapbox" (needs accessToken) | "google" (needs apiKey). Switching is one prop change.
  - Map: center — `[lng, lat]` tuple. ALWAYS lng first. Required.
  - Map: zoom — number, 0–22. Required.
  - Map: bounds — `[[swLng, swLat], [neLng, neLat]]`. When set, takes precedence over center+zoom.
  - Map: appearance — "light" | "dark" | "satellite" | "auto" (default "auto", follows GradeThemeProvider mode).
  - Map: hoveredId — controlled string id, pairs with onHoveredIdChange. The matching MapMarker gets `data-gds-state="hovered"` automatically. This is how you build list ↔ map two-way sync.
  - Map: interactive — false freezes pan/zoom, useful for static cards.
  - Map: onLoad(handle) / onError(error) — handle exposes flyTo, panTo, fitBounds, getCenter, getZoom, getBounds, instance.
  - Map: tilerKey? — MapLibre only (provider="maplibre"). Optional everywhere: omit on `gradeui.com`/`localhost` and the referrer-locked demo key is used; set it only when embedding off-domain. The contract never requires it.
  - Map: accessToken? — Mapbox only. Pass it whenever provider="mapbox" — the component itself enforces this at runtime (throws a clear `provider="mapbox" requires an accessToken prop` error via onError if missing). It is OPTIONAL in the contract on purpose, so the validator never demands it from maplibre/google maps.
  - Map: apiKey? — Google only. Pass it whenever provider="google" — the component enforces it at runtime (throws `provider="google" requires an apiKey prop` via onError if missing). OPTIONAL in the contract on purpose, so it's never demanded from maplibre/mapbox.
  - MapMarker: id — string. Required. Stable marker id; pair with Map's `hoveredId` for list↔map hover sync.
  - MapMarker: at — `[lng, lat]` tuple. Required. THE coordinate prop. ALWAYS lng first. The prop is literally named `at` — it is NOT `lngLat`, `coordinates`, `position`, `latLng`, `center`, or separate `lng`/`lat` props. Passing any other name leaves the marker coord `undefined`, and MapLibre throws on mount, crashing the WHOLE screen in every renderer. When in doubt, copy the `airbnb-listings` scaffold: `<MapMarker id={l.id} at={l.coords}>`.
  - MapMarker: anchor — "center" | "bottom" (default "bottom", pin tip sits on the coord). Only these two values.
  - MapMarker: onClick — handler called with `({ id, coords, native })` on marker click.
  - MapMarker: children — DOM rendered as the marker (Badge, Card, Avatar, or any element). Inherits `--gds-*` tokens.
when_to_use: Any layout that needs a real map — listings (real estate, Airbnb-style), fleet/logistics dashboards, store locators, anywhere a user picks a location from a viewport. Reach for the controlled `hoveredId` prop when a sibling list and the map need to highlight each other.
composes_with: [Card (as marker content), Badge, Avatar, Button, Row, Stack, Skeleton]
---

Default — zero config, MapLibre + MapTiler demo tiles. Works on `gradeui.com` and `localhost` with no setup:

```jsx
<Map center={[-122.42, 37.78]} zoom={12}>
  <MapMarker id="hq" at={[-122.42, 37.78]}>
    <Badge>HQ</Badge>
  </MapMarker>
</Map>
```

Two-way list ↔ map hover sync — the canonical pattern. ALWAYS use the controlled `hoveredId` prop, do NOT call `mapRef.current.flyTo` on every list-item hover yourself:

```jsx
const [hoveredId, setHoveredId] = useState(null);

<Row>
  <Stack>
    {listings.map(l => (
      <Card
        key={l.id}
        onMouseEnter={() => setHoveredId(l.id)}
        onMouseLeave={() => setHoveredId(null)}
      >
        <CardHeader><CardTitle>{l.title}</CardTitle></CardHeader>
        <CardContent>${l.price}/night</CardContent>
      </Card>
    ))}
  </Stack>

  <Map
    center={[-122.42, 37.78]}
    zoom={12}
    hoveredId={hoveredId}
    onHoveredIdChange={setHoveredId}
  >
    {listings.map(l => (
      <MapMarker key={l.id} id={l.id} at={l.coords}>
        <Badge>${l.price}</Badge>
      </MapMarker>
    ))}
  </Map>
</Row>
```

Provider swap — one line:

```jsx
<Map provider="mapbox" accessToken={env.MAPBOX_TOKEN} center={[-0.1, 51.5]} zoom={11} />
<Map provider="google" apiKey={env.GOOGLE_MAPS_KEY} center={[-0.1, 51.5]} zoom={11} />
```

The contract is deliberately provider-AGNOSTIC. `tilerKey`, `accessToken`, and `apiKey` are all OPTIONAL in the contract so any valid provider config validates — a maplibre map needs no key on-domain, a mapbox map carries `accessToken`, a google map carries `apiKey`, and none of them trip a `missing-required` error for a key another provider uses. The knowledge of which key a provider needs lives in the component/adapter at runtime, not the static contract: maplibre falls back to the referrer-locked demo key; mapbox throws `provider="mapbox" requires an accessToken prop`; google throws `provider="google" requires an apiKey prop` — each surfaced via `onError({ code: "api-key-missing" })`. Maintainers: do NOT re-mark these credentials required in the contract — that's the bug that blanket-required all three and broke on-domain maplibre maps.

ANTI-PATTERNS — don't do these:

- DO NOT name the marker coordinate prop anything other than `at`. It is `<MapMarker id="…" at={[lng, lat]} />` — NOT `lngLat`, `coordinates`, `position`, `latLng`, or `center`. A wrong name passes JSX validation (the validator only checks `<Map>`'s contract, not subcomponent prop names) but registers an `undefined` coord, so MapLibre throws on mount and the whole screen fails to render.
- DO NOT pass `{ lat, lng }` objects. Coordinates are ALWAYS `[lng, lat]` tuples. Google's adapter handles the object conversion internally.
- DO NOT hand-roll an iframe with a Google Maps embed URL. Use `<Map provider="google" apiKey={...}>`.
- DO NOT use `useRef` + `mapRef.current.flyTo(id)` on list-hover when `hoveredId` already does it controlled.
- DO NOT call `setStyle` or reach for `mapboxgl.Marker` directly — use `appearance` and `<MapMarker>`. The escape hatch (`mapRef.current.instance`) is for things the wrapper genuinely doesn't expose (3D extrusions, drawing tools, heatmaps).
- DO NOT render >500 markers without clustering. The component warns in dev. For larger datasets, drop to `.instance` and use the provider's clustering layer.

Markers are DOM — children inherit `--gds-*` tokens. Drop a `<Card>`, `<Badge>`, `<Avatar>`, or anything else inside `<MapMarker>` and it themes correctly.
