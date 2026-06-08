# Maps inside the MCP preview panel

How `<Map>` renders in the inline MCP App preview (`preview_screen`), why it
uses **Leaflet** there specifically, and how to try the other map connectors
inside MCP later.

## The constraint: the sandbox CSP blocks maplibre

Grade's default map provider is **maplibre** (vector tiles, MapTiler). maplibre
does all of its rendering in a **Web Worker** spawned from a `blob:` URL. The
MCP Apps spec sandboxes each panel with a default CSP of `default-src 'none'`,
workers fall back to that directive, and the spec's CSP vocabulary only exposes
`frameDomains` / `connectDomains` / `resourceDomains` / `baseUriDomains` — there
is **no `worker-src` knob**. So maplibre cannot start in the panel, and there's
no CSP setting that would let it.

(It renders fine everywhere with a normal browser CSP — Studio, the `/e` embed,
and the `preview_image` screenshot all use maplibre. It's only the strict
sandboxed *panel* that can't.)

## The fix: a worker-free Leaflet adapter, MCP-only

- **Adapter:** `packages/ui/components/ui/map/adapters/leaflet.ts` — a third
  adapter behind the same `AdapterInstance` interface as maplibre/mapbox/google.
  Leaflet paints **raster** tiles as plain `<img>` elements on the main thread
  (no worker), so it runs under the sandbox CSP. Keyless **OSM** raster tiles
  (`tile.openstreetmap.org`), no API key, no referrer lock. "Dark" is a CSS
  filter on the tile pane (raster OSM has no dark style).

- **The MCP-specific seam:** `map.tsx` reads `globalThis.__gradeMapProvider`. If
  set, it overrides the screen's `provider`. The **only** consumer that sets it
  is the MCP preview View (`apps/docs/preview-view/view.tsx`), which sets
  `__gradeMapProvider = "leaflet"`. Studio and the embed never set it, so they
  keep maplibre. Generic seam, MCP-specific consumer.

- **CSP:** the preview-view `ui://` resource declares
  `connectDomains` + `resourceDomains` for `https://tile.openstreetmap.org`
  (see `tools.ts`). Without it the panel's tile fetches are blocked and the map
  comes up blank. Everything else in the panel stays offline.

- **Bundle:** the View is one shared single-file bundle for *all* previews, so
  `build-view.mjs` aliases `maplibre-gl` / `mapbox-gl` / `@googlemaps/js-api-loader`
  to `empty-map-sdk.js` (an empty stub). Those adapters are reachable but never
  called in the View, so stubbing them drops ~800KB of dead maplibre and keeps
  the View **leaflet-only** (~2.4MB smaller). Leaflet itself IS bundled, and its
  CSS PNGs are inlined as data URIs (offline-safe). `leaflet` is a dependency of
  `apps/docs`; `packages/ui` keeps it `external` (optional peer, like the other
  map SDKs).

## Verified

Playwright against the built View: Leaflet container mounts, markers render at
the correct coords, 12/12 OSM tiles load, dark filter applied, zero errors.
Pins land identically to maplibre and `flyTo`/`panTo`/`fitBounds` behave the
same (same adapter interface) — only the visuals differ (raster vs vector).

## Trying the OTHER connectors inside MCP later

The override seam makes this a per-provider experiment. Each provider's
viability in the sandbox panel comes down to two questions: **does it use a
Web Worker?** (workers are unconditionally blocked) and **what hosts does it
need in CSP + does it need a key?**

| Provider   | Worker? | In the MCP panel | What it'd take |
|------------|---------|------------------|----------------|
| **leaflet** (current) | no | ✅ works | done — keyless OSM raster + tile CSP |
| **google** | mostly main-thread (no blob worker) | likely viable — **best next candidate** | a Maps JS API key + `connectDomains`/`resourceDomains` for `maps.googleapis.com` + `*.googleapis.com` tile/font hosts; set `__gradeMapProvider="google"` + pass `apiKey`. Worth a spike. |
| **mapbox** | yes (mapbox-gl is maplibre-lineage) | ❌ same worker wall as maplibre | nothing — blocked for the same reason maplibre is, unless mapbox ships a worker-free mode |
| **maplibre** (default elsewhere) | yes | ❌ worker blocked | n/a in the panel; it's the default for Studio/embed |

So if we want prettier/vector maps in the panel than OSM raster, **Google Maps
is the connector to try next** (no worker), with a key + CSP for its hosts. The
plumbing is already in place: add the CSP domains to the preview-view resource,
flip `__gradeMapProvider`, and pass the key through. Leaflet stays the safe,
keyless default.
