# `<Map>` — design doc (pre-implementation)

Status: **draft, pre-code**. Review this, poke holes, then we build.

Ships in: `@gradeui/ui` (free tier). No SDKs bundled — all providers are optional, dynamically loaded.

Replaces: the "Map (HIGH PRIORITY)" entry in `packages/studio/src/playbook/layouts/index.ts` → `MISSING_COMPONENTS`. Unlocks the parked `airbnb-listings` reference layout.

---

## Goals

1. **One component, config-switchable.** `<Map provider="mapbox" …/>` vs `<Map provider="google" …/>` is a one-line change for the 80% use case.
2. **Zero-config demo works.** A logged-out visitor on `gradeui.com` hitting the Airbnb layout sees a real, moving, themed map with no keys configured.
3. **Model-friendly API.** Props the Studio model can discover and use without reaching for a provider SDK.
4. **Escape hatch honest.** When you need Mapbox's extrusion layer or Google's heatmap API, you drop to the native instance — the wrapper doesn't pretend otherwise.
5. **No SDK bloat in `@gradeui/ui`.** Every provider SDK is an **optional peer dep**, lazy-loaded per `provider` prop.

## Non-goals for v0

- Token → Style-Spec JSON generator. Ship hand-picked default styles per appearance mode; token-driven theming can come later.
- Felt provider. Deferred to v0.2.
- Apple MapKit JS. Deferred to v1.
- Custom layers / sources / 3D / heatmaps / drawing / clustering. Reach through the escape hatch; we'll shoehorn in first-class primitives once we see which ones people actually need.
- Geocoding, places autocomplete, directions. Separate components, not in v0.
- Leaflet, OpenLayers. Not shipping adapters.

---

## Provider matrix

| Provider  | Adapter        | SDK (optional peer dep)      | Requires           | Default? | Notes |
|-----------|----------------|------------------------------|--------------------|----------|-------|
| MapLibre  | `maplibre`     | `maplibre-gl`                | — (MapTiler demo key baked in; consumers can override) | **Yes** | Zero-key public demo. Shares adapter internals with Mapbox. |
| Mapbox    | `mapbox`       | `mapbox-gl`                  | `accessToken`      | No       | Richer hosted styles; richer style spec is same as MapLibre. |
| Google    | `google`       | `@googlemaps/js-api-loader`  | `apiKey`           | No       | Everyone-recognizes-this fallback. `AdvancedMarkerElement` for DOM markers. |

Tile provider for MapLibre: **MapTiler** (`https://api.maptiler.com/maps/{style}/style.json?key=...`).

A Grade-owned MapTiler demo key is baked into the adapter as a **referrer-locked** public constant — safe to ship in the published bundle because it only works for requests originating from `gradeui.com`, `*.gradeui.com`, and `localhost`. Consumers on any other domain **must** pass their own `tilerKey` prop; the adapter throws a dev-mode warning if the demo key is used outside an allowed origin.

Key placement: `packages/ui/components/ui/map/demo-config.ts` exports a single `GRADE_DEMO_MAPTILER_KEY` constant. Isolated so the key is easy to find, rotate, or replace without touching adapter logic.

Adapters live at `packages/ui/components/ui/map/adapters/{maplibre,mapbox,google}.ts`. Each exports an `async create(container, opts) → AdapterInstance` that the component calls after `dynamic(import(...))`.

---

## Public API

### `<Map>` props

```ts
type Coords = [lng: number, lat: number]; // always tuple — we normalize to provider shape internally
type Appearance = "light" | "dark" | "satellite" | "auto"; // "auto" follows GradeThemeProvider mode

type MapBaseProps = {
  center: Coords;
  zoom: number;
  bounds?: [Coords, Coords];              // [southwest, northeast]; takes precedence over center/zoom when set
  appearance?: Appearance;                 // default "auto"
  interactive?: boolean;                   // default true; false = no pan/zoom/rotate
  hoveredId?: string | null;               // controlled — pairs with onHoveredIdChange for list↔map sync
  onHoveredIdChange?: (id: string | null) => void;
  onLoad?: (handle: MapHandle) => void;
  onError?: (error: MapError) => void;
  className?: string;
  style?: React.CSSProperties;             // host div styles only; never merged into map style
  children?: React.ReactNode;              // <MapMarker>s (and later <MapPopup>, <MapLayer>)
};

// Discriminated on `provider` — TS enforces required fields per provider.
type MapProps = MapBaseProps & (
  | { provider?: "maplibre"; styleUrl?: string; tilerKey?: string }
  | { provider: "mapbox";    accessToken: string; styleUrl?: string }
  | { provider: "google";    apiKey: string; mapId?: string; styles?: google.maps.MapTypeStyle[] }
);
```

Zero-config usage (public demo):

```tsx
<Map center={[-122.42, 37.78]} zoom={12}>
  <MapMarker id="home" at={[-122.42, 37.78]} />
</Map>
```

Provider swap:

```tsx
<Map provider="mapbox" accessToken={env.MAPBOX_TOKEN} center={[-122.42, 37.78]} zoom={12} />
<Map provider="google" apiKey={env.GOOGLE_MAPS_KEY} center={[-122.42, 37.78]} zoom={12} />
```

### `<MapMarker>` props

```ts
type MapMarkerProps = {
  id: string;                              // required — used by flyTo(id) and hoveredId matching
  at: Coords;
  anchor?: "center" | "bottom";            // default "bottom" (pin tip at coord)
  children?: React.ReactNode;              // arbitrary DOM — inherits tokens via CSS custom properties
  onClick?: (e: { id: string; coords: Coords; native: MouseEvent }) => void;
  className?: string;
};
```

Markers are DOM (all three adapters support DOM markers). That means they inherit `--gds-*` tokens for free — you can drop a full Grade `<Badge>` or `<Card>` in as the marker content.

**Marker count:** `<Map>` warns via `console.warn` in development when it renders more than **500** markers. DOM markers get janky past ~1k; above that, consumers should build a clustering layer via the `.instance` escape hatch (a first-class `<MapCluster>` primitive is a candidate for v1).

### Imperative handle — `MapHandle`

```ts
type MapHandle = {
  flyTo: (idOrCoords: string | Coords, opts?: { zoom?: number; durationMs?: number }) => void;
  panTo: (coords: Coords, opts?: { durationMs?: number }) => void;
  fitBounds: (coords: Coords[], opts?: { paddingPx?: number; durationMs?: number }) => void;
  getCenter: () => Coords;
  getZoom: () => number;
  getBounds: () => [Coords, Coords];
  instance: unknown; // typed per provider via discriminated return from useMap() helper
};
```

Accessed via `ref` or `onLoad` callback. The `instance` field is the **escape hatch**: cast it to the provider's native type to reach anything we don't expose. Consumers are warned (in JSDoc) that touching `.instance` makes their code provider-specific.

```tsx
const mapRef = useRef<MapHandle>(null);
// ...
mapRef.current?.flyTo("listing-3", { zoom: 15, durationMs: 800 });

// Escape hatch:
const mapbox = mapRef.current?.instance as mapboxgl.Map;
mapbox.addLayer({ id: "3d-buildings", type: "fill-extrusion", /* … */ });
```

### Controlled two-way sync

The Airbnb pattern is the reason Map has to exist. Both halves are props, not refs:

```tsx
const [hovered, setHovered] = useState<string | null>(null);

<Row>
  <ListingList listings={listings} hoveredId={hovered} onHoveredChange={setHovered} />
  <Map center={city} zoom={11} hoveredId={hovered} onHoveredIdChange={setHovered}>
    {listings.map(l => <MapMarker key={l.id} id={l.id} at={l.coords}>{l.price}</MapMarker>)}
  </Map>
</Row>
```

When `hoveredId` changes externally, the map bumps that marker's z-index and applies `data-gds-state="hovered"` to its wrapper; consumers style with `[data-gds-part="map-marker"][data-gds-state="hovered"]`.

---

## Appearance mapping per provider

No token generator in v0. Each adapter ships a small lookup table of curated styles:

| `appearance`   | MapLibre (MapTiler)                  | Mapbox                            | Google                                 |
|----------------|--------------------------------------|-----------------------------------|----------------------------------------|
| `"light"`      | `dataviz-light`                      | `mapbox://styles/mapbox/light-v11`| Neutral light preset (`styles` array baked in) |
| `"dark"`       | `dataviz-dark`                       | `mapbox://styles/mapbox/dark-v11` | Neutral dark preset                    |
| `"satellite"`  | `satellite`                          | `mapbox://styles/mapbox/satellite-streets-v12` | `mapTypeId: "hybrid"`        |
| `"auto"`       | reads `useGradeTheme()` → light/dark | same                              | same                                   |

`appearance="auto"` subscribes to `GradeThemeProvider`'s mode via `useGradeTheme()` (not `data-grade-theme` observation) so the map re-styles when the user toggles dark mode. Implementation: `useGradeTheme()` → `useEffect` → `map.setStyle(...)` / `map.setOptions({ styles })`. Debounced to 200ms to cover rapid toggling.

Requires `<GradeThemeProvider>` in the tree for `appearance="auto"` — documented in the JSDoc. Without it, the hook returns a default and the map stays in light mode.

`styleUrl` (MapLibre/Mapbox) and `styles` (Google) let consumers override entirely. Setting them implies `appearance` is ignored — document clearly.

## Tokens

New CSS custom properties (keeping the `--gds-*` prefix per the deferred-rename rule):

```
--gds-map-radius                /* host container border-radius; defaults to var(--gds-radius) */
--gds-map-border                /* host container border; defaults to 1px solid var(--gds-border) */
--gds-map-overlay-bg            /* bg for built-in controls (zoom, attribution) */
--gds-map-overlay-fg
--gds-map-marker-shadow         /* filter applied to default <MapMarker> children without own shadow */
```

No map-internal styling tokens — those require the generator, which is v1+.

Markers render inside a `<div data-gds-part="map-marker" data-gds-state="…">`; consumers apply themes via normal `data-gds` / `data-gds-part` selectors, same as every other DS part.

---

## Package structure

```
packages/ui/components/ui/map/
├── Map.tsx                     # public component — dynamic-imports the adapter based on `provider`
├── MapMarker.tsx               # public marker component
├── types.ts                    # MapProps, MapHandle, MapError, Coords, etc.
├── context.ts                  # internal MapContext for markers to register themselves
├── demo-config.ts              # GRADE_DEMO_MAPTILER_KEY — referrer-locked public constant
├── adapters/
│   ├── maplibre.ts             # dynamic import "maplibre-gl"
│   ├── mapbox.ts               # dynamic import "mapbox-gl"
│   └── google.ts               # dynamic import "@googlemaps/js-api-loader"
└── styles.css                  # minimum marker + container CSS; inlined maplibre/mapbox CSS lives alongside under licence notices
```

**Sub-path exports.** Each adapter ships as its own entry point so consumers tree-shake the ones they don't use:

```jsonc
// packages/ui/package.json "exports"
{
  ".":              "./dist/index.js",         // re-exports <Map> shell only, no adapter
  "./map/maplibre": "./dist/map/maplibre.js",  // loads the MapLibre adapter eagerly
  "./map/mapbox":   "./dist/map/mapbox.js",
  "./map/google":   "./dist/map/google.js"
}
```

Default `<Map>` from `@gradeui/ui` lazy-loads adapters via `import()` per `provider` prop — that's the zero-config path. Consumers who want to preload a single adapter (SSG, avoiding the async boundary) import from the sub-path. `tsup --format esm --format cjs` with `entry: { index, "map/maplibre", "map/mapbox", "map/google" }` produces this layout.

Barrel export from `packages/ui/lib/index.ts`:

```ts
export { Map, MapMarker } from "../components/ui/map";
export type { MapProps, MapMarkerProps, MapHandle, MapError, Coords } from "../components/ui/map";
```

### Dependency declarations

`packages/ui/package.json`:

```jsonc
{
  "peerDependencies": {
    "react": "^18 || ^19",
    "maplibre-gl": "^4",
    "mapbox-gl": "^3",
    "@googlemaps/js-api-loader": "^1"
  },
  "peerDependenciesMeta": {
    "maplibre-gl": { "optional": true },
    "mapbox-gl": { "optional": true },
    "@googlemaps/js-api-loader": { "optional": true }
  }
}
```

Every provider SDK is optional. Consumers install only what they use. Using `provider="mapbox"` without `mapbox-gl` installed throws `MapError{ code: "sdk-missing" }` via `onError` — the component then renders a Skeleton fallback with a developer-facing console warning listing the install command.

### SSR / hydration

All three providers blow up on SSR. The `<Map>` export is wrapped in:

```ts
const Map = dynamic(() => import("./MapImpl"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});
```

`<MapSkeleton>` uses the same `--gds-map-radius` / `--gds-map-border` tokens so the pre-hydration placeholder visually matches the loaded map's container.

### CSS bundling

MapLibre and Mapbox ship required CSS (`maplibre-gl/dist/maplibre-gl.css`, `mapbox-gl/dist/mapbox-gl.css`). Rather than make consumers remember to import it, the adapter **injects a `<link>` tag on first mount** (idempotent, uses the provider's unpkg URL pinned to the installed version via a build-time constant). Attribution kept intact; both CSSs are BSD-3-Clause, attribution in `packages/ui/LICENSES/`.

Google needs no extra CSS.

---

## Errors

```ts
type MapError = {
  code:
    | "sdk-missing"              // optional peer dep not installed
    | "api-key-missing"          // mapbox accessToken / google apiKey missing
    | "provider-init-failed"     // SDK threw during map construction
    | "style-load-failed"        // style URL 404 / 401
    | "tile-load-failed";        // sustained tile failures (post init)
  message: string;               // dev-friendly, includes install command when relevant
  cause?: unknown;
};
```

`onError` fires for all five. If not provided, the component logs to `console.warn` and renders the skeleton fallback with a visible dev-only banner (`process.env.NODE_ENV !== "production"`).

Fatal errors (`sdk-missing`, `api-key-missing`, `provider-init-failed`) short-circuit to fallback. Non-fatal (`style-load-failed`, `tile-load-failed`) let the map render in whatever degraded state the provider offers.

---

## Studio integration

Once Map lands:

1. Remove `"Map"` from `MISSING_COMPONENTS` in `packages/studio/src/playbook/layouts/index.ts`.
2. Add `"Map"` and `"MapMarker"` to `ALLOWED_COMPONENTS` in the Studio allow-list.
3. Ship the parked `airbnb-listings` reference layout as a `.jsx` + `.md` pair (per the "reference layouts remix loop" — layouts are saveable Studio outputs).
4. Write anti-patterns into the playbook:
   - **Don't** pass `lat, lng` as an object — it's always a tuple `[lng, lat]`.
   - **Don't** reach for `.instance` for common operations — use `flyTo` / `fitBounds`.
   - **Do** use controlled `hoveredId` for list↔map sync; don't wire up `onMouseEnter`/`mapRef.current.flyTo` by hand.

---

## Decisions — settled 2026-04-24

1. **MapTiler demo key** → Grade registers a MapTiler account, locks the key to `gradeui.com` + `localhost`, pastes into `packages/ui/components/ui/map/demo-config.ts`. Non-Grade consumers pass their own `tilerKey`.
2. **Marker warning threshold** → 500 DOM markers. `console.warn` in dev only.
3. **Sub-path exports** → Yes. Each adapter is its own `tsup` entry; default `<Map>` import lazy-loads; sub-path imports preload a specific adapter.
4. **`appearance="auto"` listener** → `useGradeTheme()`. Requires `<GradeThemeProvider>` for auto mode; documented in JSDoc.
5. **Changeset plan** → Two. First changeset adds `Map` + `MapMarker` to `@gradeui/ui` (minor bump). Second changeset ships the `airbnb-listings` reference layout in `packages/studio` once the component is published and `consume-app` has smoke-tested it.
