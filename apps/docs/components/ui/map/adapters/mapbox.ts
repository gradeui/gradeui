import type {
  AdapterFactory,
  AdapterInstance,
  Coords,
  MarkerHandle,
} from "../types";

const MAPBOX_STYLES: Record<"light" | "dark" | "satellite", string> = {
  light: "mapbox://styles/mapbox/light-v11",
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

const MAPBOX_CSS_HREF = "https://unpkg.com/mapbox-gl@3/dist/mapbox-gl.css";
const CSS_LINK_ID = "gds-mapbox-gl-css";

function ensureMapboxCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById(CSS_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = CSS_LINK_ID;
  link.rel = "stylesheet";
  link.href = MAPBOX_CSS_HREF;
  document.head.appendChild(link);
}

export const createMapboxAdapter: AdapterFactory = async (
  container,
  opts,
  callbacks
) => {
  if (!opts.accessToken) {
    callbacks.onError({
      code: "api-key-missing",
      message:
        '@gradeui/ui Map: provider="mapbox" requires an `accessToken` prop.',
    });
    throw new Error("mapbox accessToken missing");
  }

  ensureMapboxCss();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapboxgl: any;
  try {
    mapboxgl = await import("mapbox-gl");
    if (mapboxgl.default) mapboxgl = mapboxgl.default;
  } catch (err) {
    callbacks.onError({
      code: "sdk-missing",
      message:
        '@gradeui/ui Map: `mapbox-gl` is not installed. Run `pnpm add mapbox-gl` to use provider="mapbox".',
      cause: err,
    });
    throw err;
  }

  mapboxgl.accessToken = opts.accessToken;

  const styleUrl = opts.styleUrl ?? MAPBOX_STYLES[opts.appearance];

  const map = new mapboxgl.Map({
    container,
    style: styleUrl,
    center: opts.center,
    zoom: opts.zoom,
    interactive: opts.interactive,
  });

  if (opts.bounds) {
    map.fitBounds([opts.bounds[0], opts.bounds[1]], { animate: false });
  }

  await new Promise<void>((resolve) => {
    map.once("load", () => resolve());
  });
  callbacks.onLoad();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.on("error", (e: any) => {
    const msg = String(e?.error?.message ?? e?.message ?? "Mapbox error");
    const isStyle = msg.toLowerCase().includes("style");
    callbacks.onError({
      code: isStyle ? "style-load-failed" : "tile-load-failed",
      message: msg,
      cause: e?.error ?? e,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = new globalThis.Map<string, { marker: any; handle: MarkerHandle }>();

  const adapter: AdapterInstance = {
    setCenter: (coords) => map.setCenter(coords),
    setZoom: (zoom) => map.setZoom(zoom),
    setBounds: (sw, ne) => map.fitBounds([sw, ne], { animate: false }),
    setAppearance: (appearance) => {
      const next = opts.styleUrl ?? MAPBOX_STYLES[appearance];
      map.setStyle(next, { diff: false });
    },
    setInteractive: (enabled) => {
      const handlers = [
        "scrollZoom",
        "boxZoom",
        "dragRotate",
        "dragPan",
        "keyboard",
        "doubleClickZoom",
        "touchZoomRotate",
      ] as const;
      for (const k of handlers) {
        const ctl = map[k];
        if (ctl) (enabled ? ctl.enable() : ctl.disable());
      }
    },
    flyTo: (coords, fopts) =>
      map.flyTo({
        center: coords,
        zoom: fopts?.zoom,
        duration: fopts?.durationMs ?? 800,
      }),
    panTo: (coords, popts) =>
      map.panTo(coords, { duration: popts?.durationMs ?? 600 }),
    fitBounds: (list, fbopts) => {
      if (list.length === 0) return;
      let west = Infinity,
        south = Infinity,
        east = -Infinity,
        north = -Infinity;
      for (const [lng, lat] of list) {
        if (lng < west) west = lng;
        if (lat < south) south = lat;
        if (lng > east) east = lng;
        if (lat > north) north = lat;
      }
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: fbopts?.paddingPx ?? 40,
          duration: fbopts?.durationMs ?? 800,
        }
      );
    },
    getCenter: () => {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    getZoom: () => map.getZoom(),
    getBounds: () => {
      const b = map.getBounds();
      return [
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ];
    },
    addMarker: (id, coords, anchor) => {
      const element = document.createElement("div");
      element.dataset.gdsPart = "map-marker";
      element.dataset.gdsState = "idle";
      element.style.cursor = "pointer";

      element.addEventListener("mouseenter", () => callbacks.onMarkerHover(id));
      element.addEventListener("mouseleave", () => callbacks.onMarkerHover(null));
      element.addEventListener("click", (e) => {
        callbacks.onMarkerClick(id, handle.coords, e);
      });

      const marker = new mapboxgl.Marker({
        element,
        anchor: anchor === "center" ? "center" : "bottom",
      })
        .setLngLat(coords)
        .addTo(map);

      const handle: MarkerHandle = {
        element,
        coords,
        setHovered: (hovered) => {
          element.dataset.gdsState = hovered ? "hovered" : "idle";
          element.style.zIndex = hovered ? "10" : "1";
        },
        setPosition: (next) => {
          handle.coords = next;
          marker.setLngLat(next);
        },
        remove: () => {
          marker.remove();
          markers.delete(id);
        },
      };

      markers.set(id, { marker, handle });
      return handle;
    },
    destroy: () => {
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map.remove();
    },
    instance: map,
  };

  return adapter;
};
