// MapZoomControls — Ready-to-use zoom controls for Google Maps using DS MapControlButton and the useMap hook.
// keywords: map zoom controls, map controls, zoom in out, google maps controls, map buttons, map zoom
// components: map
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapZoomControls") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { useMap } from "@vis.gl/react-google-maps";
import { MapControlButton } from "@brightlocal/ui-components/map";
import { Plus, Minus } from "@brightlocal/icons";

function MapZoomControls({ dataHook }: { dataHook: string }) {
  const map = useMap();
  return (
    <div className="flex flex-col gap-1" data-hook={dataHook}>
      <MapControlButton
        aria-label="Zoom in"
        dataHook={`${dataHook}-zoom-in`}
        onClick={() => map?.setZoom((map.getZoom() ?? 14) + 1)}
      >
        <Plus />
      </MapControlButton>
      <MapControlButton
        aria-label="Zoom out"
        dataHook={`${dataHook}-zoom-out`}
        onClick={() => map?.setZoom((map.getZoom() ?? 14) - 1)}
      >
        <Minus />
      </MapControlButton>
    </div>
  );
}
