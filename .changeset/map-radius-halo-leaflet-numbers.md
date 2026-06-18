---
"@gradeui/ui": minor
---

Map: unbake chrome, add a label halo token, and fix Leaflet marker layering.

- **Removed the baked-in radius/border on `<Map>`.** The container no longer sets an inline `border-radius`/`border` (which `className` couldn't override). The Map is now an unopinionated primitive — square with no border by default; round or frame it from the call site with `className` (e.g. `rounded-xl border`). This is a visual change for any existing `<Map>` that relied on the default rounding.
- **Added the `--gds-map-label-halo` token + `.gds-map-label` helper.** A mode-aware text-stroke for floating marker labels (white halo on light tiles, near-black on dark) so labels don't wash out in dark mode. Use the class instead of a hard-coded white `-webkit-text-stroke`.
- **Fixed Leaflet dropping inline marker SVG content.** Leaflet's stylesheet sets `z-index: 200` on map `<svg>` elements, which painted an inline pin-shield SVG above later sibling DOM (e.g. a count label), hiding it — but only on Leaflet (the default provider), not Mapbox/MapLibre/Google. Marker content now follows normal source order on every provider via `[data-gds-part="map-marker-content"] svg { z-index: auto }`.
