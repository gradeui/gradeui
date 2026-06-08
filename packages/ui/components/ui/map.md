---
name: Map
import: "@gradeui/ui"
subcomponents: [MapMarker]
aliases: [map, maps, mapbox, maplibre, google maps, geo, location, latlng, coordinates, marker, pin, airbnb, listings, fleet, real estate, logistics, map view, mapkit, mapview, react native maps, rn maps]
props:
  - provider — "maplibre" (default, free, no key) | "mapbox" (needs accessToken) | "google" (needs apiKey). Switching is one prop change.
  - center — `[lng, lat]` tuple. ALWAYS lng first. Required.
  - zoom — number, 0–22. Required.
  - bounds — `[[swLng, swLat], [neLng, neLat]]`. When set, takes precedence over center+zoom.
  - appearance — "light" | "dark" | "satellite" | "auto" (default "auto", follows GradeThemeProvider mode).
  - hoveredId — controlled string id, pairs with onHoveredIdChange. The matching MapMarker gets `data-gds-state="hovered"` automatically. This is how you build list ↔ map two-way sync.
  - interactive — false freezes pan/zoom, useful for static cards.
  - onLoad(handle) / onError(error) — handle exposes flyTo, panTo, fitBounds, getCenter, getZoom, getBounds, instance.
  - tilerKey? — string credential, MapLibre only. Only needed off `gradeui.com`/`localhost`; default key is referrer-locked.
  - accessToken? — string credential, Mapbox only.
  - apiKey? — string credential, Google only.
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

ANTI-PATTERNS — don't do these:

- DO NOT pass `{ lat, lng }` objects. Coordinates are ALWAYS `[lng, lat]` tuples. Google's adapter handles the object conversion internally.
- DO NOT hand-roll an iframe with a Google Maps embed URL. Use `<Map provider="google" apiKey={...}>`.
- DO NOT use `useRef` + `mapRef.current.flyTo(id)` on list-hover when `hoveredId` already does it controlled.
- DO NOT call `setStyle` or reach for `mapboxgl.Marker` directly — use `appearance` and `<MapMarker>`. The escape hatch (`mapRef.current.instance`) is for things the wrapper genuinely doesn't expose (3D extrusions, drawing tools, heatmaps).
- DO NOT render >500 markers without clustering. The component warns in dev. For larger datasets, drop to `.instance` and use the provider's clustering layer.

Markers are DOM — children inherit `--gds-*` tokens. Drop a `<Card>`, `<Badge>`, `<Avatar>`, or anything else inside `<MapMarker>` and it themes correctly.
