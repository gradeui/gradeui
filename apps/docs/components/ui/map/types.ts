import type * as React from "react";

/**
 * Coordinate tuple — `[lng, lat]`. Always tuples in the public API; each
 * adapter normalizes internally to whatever shape its provider expects
 * (Google takes `{ lat, lng }` objects, Mapbox/MapLibre take tuples).
 */
export type Coords = [lng: number, lat: number];

export type MapAppearance = "light" | "dark" | "satellite" | "auto";

export type MapErrorCode =
  | "sdk-missing"
  | "api-key-missing"
  | "provider-init-failed"
  | "style-load-failed"
  | "tile-load-failed";

export type MapError = {
  code: MapErrorCode;
  message: string;
  cause?: unknown;
};

/**
 * Imperative handle exposed via `ref` and `onLoad`. Use for fly-to
 * animations, fit-bounds, and the `.instance` escape hatch when you
 * need the provider-native map object.
 */
export type MapHandle = {
  /** Pan + zoom to a marker by id, or directly to coords. */
  flyTo: (
    idOrCoords: string | Coords,
    opts?: { zoom?: number; durationMs?: number }
  ) => void;
  panTo: (coords: Coords, opts?: { durationMs?: number }) => void;
  fitBounds: (
    coords: Coords[],
    opts?: { paddingPx?: number; durationMs?: number }
  ) => void;
  getCenter: () => Coords;
  getZoom: () => number;
  getBounds: () => [Coords, Coords];
  /**
   * Provider-native instance. Cast to `mapboxgl.Map`, `maplibregl.Map`,
   * or `google.maps.Map` to reach features the wrapper doesn't expose
   * (3D extrusions, custom layers, drawing tools, heatmaps).
   * Touching this makes your code provider-specific.
   */
  readonly instance: unknown;
};

type MapBaseProps = {
  center: Coords;
  zoom: number;
  /** [southwest, northeast] — takes precedence over center/zoom when set. */
  bounds?: [Coords, Coords];
  /** Default `"auto"` (follows GradeThemeProvider mode). */
  appearance?: MapAppearance;
  /** Default `true`. `false` disables pan/zoom/rotate (static display). */
  interactive?: boolean;
  /** Controlled hovered marker id — pairs with `onHoveredIdChange` for list↔map sync. */
  hoveredId?: string | null;
  onHoveredIdChange?: (id: string | null) => void;
  onLoad?: (handle: MapHandle) => void;
  onError?: (error: MapError) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

/**
 * Discriminated union — TS enforces the right config fields per provider.
 *
 * @example
 *   // Zero-config public demo (MapLibre + MapTiler demo key):
 *   <Map center={[-122.42, 37.78]} zoom={12} />
 *
 *   // Mapbox:
 *   <Map provider="mapbox" accessToken={env.MAPBOX_TOKEN} center={...} zoom={...} />
 *
 *   // Google:
 *   <Map provider="google" apiKey={env.GOOGLE_MAPS_KEY} center={...} zoom={...} />
 */
export type MapProps = MapBaseProps &
  (
    | {
        provider?: "maplibre";
        /** Override the default MapTiler style URL entirely. */
        styleUrl?: string;
        /** Your MapTiler key. Omit to use the Grade demo key (referrer-locked to gradeui.com). */
        tilerKey?: string;
      }
    | {
        provider: "mapbox";
        accessToken: string;
        /** Override the appearance-derived Mapbox style URL. */
        styleUrl?: string;
      }
    | {
        provider: "google";
        apiKey: string;
        /** Optional Google Cloud Map ID for cloud-based styling. */
        mapId?: string;
      }
  );

export type MapMarkerProps = {
  /** Required — used by `flyTo(id)` and `hoveredId` matching. */
  id: string;
  at: Coords;
  /** Default `"bottom"` — pin tip at the coord. */
  anchor?: "center" | "bottom";
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: { id: string; coords: Coords; native: MouseEvent }) => void;
};

// ----- Internal adapter contract (not re-exported from the package barrel) -----

export type AdapterCallbacks = {
  onLoad: () => void;
  onError: (error: MapError) => void;
  onMarkerHover: (id: string | null) => void;
  onMarkerClick: (id: string, coords: Coords, native: MouseEvent) => void;
};

export type AdapterOpts = {
  center: Coords;
  zoom: number;
  bounds?: [Coords, Coords];
  appearance: "light" | "dark" | "satellite";
  interactive: boolean;
  styleUrl?: string;
  tilerKey?: string;
  accessToken?: string;
  apiKey?: string;
  mapId?: string;
};

export type MarkerHandle = {
  /** DOM element the adapter created for this marker. `<MapMarker>` portals its children into here. */
  element: HTMLElement;
  /** Last-known coords, used by `flyTo(id)`. Updated via `setPosition`. */
  coords: Coords;
  setHovered: (hovered: boolean) => void;
  setPosition: (coords: Coords) => void;
  remove: () => void;
};

export type AdapterInstance = {
  setCenter: (coords: Coords) => void;
  setZoom: (zoom: number) => void;
  setBounds: (sw: Coords, ne: Coords) => void;
  setAppearance: (appearance: "light" | "dark" | "satellite") => void;
  setInteractive: (enabled: boolean) => void;
  flyTo: (coords: Coords, opts?: { zoom?: number; durationMs?: number }) => void;
  panTo: (coords: Coords, opts?: { durationMs?: number }) => void;
  fitBounds: (
    coords: Coords[],
    opts?: { paddingPx?: number; durationMs?: number }
  ) => void;
  getCenter: () => Coords;
  getZoom: () => number;
  getBounds: () => [Coords, Coords];
  addMarker: (id: string, coords: Coords, anchor: "center" | "bottom") => MarkerHandle;
  destroy: () => void;
  instance: unknown;
};

export type AdapterFactory = (
  container: HTMLElement,
  opts: AdapterOpts,
  callbacks: AdapterCallbacks
) => Promise<AdapterInstance>;
