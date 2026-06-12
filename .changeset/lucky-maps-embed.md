---
"@gradeui/ui": minor
---

Embed viewer modes, map polish, and theme ring control.

- **MediaSurface fidelity model**: the tiered placeholder stays mounted beneath a filled slot but is now hidden via CSS (`[data-filled]` → `visibility: hidden`), so transparent imagery no longer shows the glyph/`--gds-media-placeholder-bg` through its alpha pixels. Wireframe mode is back as a pure-CSS view: `data-fidelity="wireframe"` on any ancestor cross-fades imagery out and placeholders in (`--gds-media-fidelity-fade`, default 280ms).
- **Map `tools` / `toolsPosition` props**: `"auto" | "zoom" | "none"` and a four-corner dock position, one vocabulary across leaflet/maplibre/mapbox/google adapters. Google's default UI is now fully disabled with only the zoom control added back.
- **Map `appearance="auto"` in provider-less hosts**: falls back to watching the root `.dark` class when no `GradeThemeProvider` is mounted, so embeds and sandboxed previews restyle tiles live on mode flips.
- **Map marker lift**: every `MapMarker` child gets a 1px border + ambient shadow from the mode-aware `--gds-map-marker-*` token pair (light hairline on dark tiles), and marker content re-asserts `--font-sans` over Leaflet/MapLibre's container font-family so pins carry custom faces.
- **Transparency checkerboard tokens**: `--gds-media-checker-color` / `--gds-media-checker-size` for alpha backdrops (used by Studio's inspector image well).
- **`ThemeInput.ring`**: optional focus-ring colour — `{ source: "primary" | "accent" | "neutral" }` or `{ hue: number }` (mints a dedicated ramp at primary chroma). The mode-tuned step is preserved, so per-mode contrast behaviour is unchanged.
- **Contracts**: `Map.onHoveredIdChange` and `MediaSurface.instanceId` added to sidecars/contracts so the documented patterns pass save validation.
