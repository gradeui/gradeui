// MapLegendBar — A map legend pill showing color-coded rank ranges. Uses MapLegend with colored dot spans.
// keywords: map legend, map key, rank legend, color legend, map legend bar, grid legend
// components: map
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapLegendBar") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { MapLegend, MapLegendItem } from "@brightlocal/ui-components/map";

<MapLegend dataHook="rank-legend">
  <MapLegendItem variant="strong" dataHook="legend-1">1–3</MapLegendItem>
  <MapLegendItem variant="moderate" dataHook="legend-2">4–10</MapLegendItem>
  <MapLegendItem variant="weak" dataHook="legend-3">11–20</MapLegendItem>
  <MapLegendItem variant="unranked" dataHook="legend-4">Over 20</MapLegendItem>
</MapLegend>
