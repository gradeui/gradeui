// MapClusterPins — Zoom-driven clustering for map grid pins. At high zoom shows individual MapGridPins; at lower zoom replaces them with pie-chart MapClusterPins that summarise rank distribution. Uses createClusterPinElement() for Google Maps AdvancedMarker integration.
// keywords: map cluster pins, map clustering, cluster pin, pie chart pin, zoom clustering, grouped pins, map pin aggregation, cluster marker
// components: map
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapClusterPins") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { useMap } from "@vis.gl/react-google-maps";
import {
  MapClusterPin,
  createClusterPinElement,
  clusterPinHexColors,
} from "@brightlocal/ui-components/map";
import type { ClusterPinSegment, CreateClusterPinElementOptions } from "@brightlocal/ui-components/map";

// 1. React usage — render a pie-chart cluster pin in JSX
const segments: ClusterPinSegment[] = [
  { variant: "strong", count: 5 },
  { variant: "moderate", count: 8 },
  { variant: "weak", count: 3 },
  { variant: "unranked", count: 2 },
];

<MapClusterPin
  dataHook="cluster-nw"
  segments={segments}
  count={18}
  size={40}
/>

// 2. Google Maps AdvancedMarker — create a DOM element
const markers = [/* your AdvancedMarkerElements */];
const el = createClusterPinElement({
  markers,
  count: markers.length,
  getVariant: (m) => pinData.get(m)?.variant ?? "unranked",
  size: 40,
});
const marker = new google.maps.marker.AdvancedMarkerElement({
  position: clusterCenter,
  content: el,
});

// 3. Zoom-driven clustering pattern
function useClusterLevel(map: google.maps.Map | null) {
  const [level, setLevel] = React.useState<"none" | "quadrants" | "single">("none");
  React.useEffect(() => {
    if (!map) return;
    const listener = map.addListener("zoom_changed", () => {
      const z = map.getZoom() ?? 14;
      setLevel(z >= 14 ? "none" : z >= 12 ? "quadrants" : "single");
    });
    return () => listener.remove();
  }, [map]);
  return level;
}
