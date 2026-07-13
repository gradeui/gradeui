// MapWithPins — Google Maps surface with DS grid-rank pins rendered inside AdvancedMarkers.
// keywords: map with pins, map markers, google maps pins, grid rank map, advanced marker, map grid pins, location pin
// components: map
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapWithPins") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapGridPin, MapLocationPin } from "@brightlocal/ui-components/map";

const GRID_POINTS = [
  { lat: 35.1, lng: -106.6, rank: 1, variant: "strong" as const },
  { lat: 35.1, lng: -106.5, rank: 5, variant: "moderate" as const },
  { lat: 35.0, lng: -106.6, rank: 12, variant: "weak" as const },
];

<APIProvider apiKey={API_KEY}>
  <Map defaultCenter={center} defaultZoom={14} mapId={MAP_ID} disableDefaultUI>
    {/* Business location pin */}
    <AdvancedMarker position={center}>
      <MapLocationPin dataHook="my-location" animateIn />
    </AdvancedMarker>

    {/* Grid rank pins */}
    {GRID_POINTS.map((pt, i) => (
      <AdvancedMarker key={i} position={{ lat: pt.lat, lng: pt.lng }}>
        <MapGridPin
          dataHook={`grid-pin-${i}`}
          value={pt.rank}
          variant={pt.variant}
        />
      </AdvancedMarker>
    ))}
  </Map>
</APIProvider>
