import * as React from "react";
import type { Coords, MarkerHandle } from "./types";

export type MapContextValue = {
  /**
   * Called by `<MapMarker>` on mount. Returns null if the adapter
   * isn't ready yet (the marker will retry on the next render via
   * effect re-run).
   */
  registerMarker: (
    id: string,
    coords: Coords,
    anchor: "center" | "bottom"
  ) => MarkerHandle | null;
};

export const MapContext = React.createContext<MapContextValue | null>(null);

export function useMapContext(): MapContextValue | null {
  return React.useContext(MapContext);
}
