import type {
  AdapterFactory,
  AdapterInstance,
  Coords,
  MarkerHandle,
} from "../types";
import { GRADE_DEMO_MAPTILER_KEY, isDemoKeyConfigured } from "../demo-config";

const MAPTILER_STYLES: Record<"light" | "dark" | "satellite", string> = {
  light: "dataviz-light",
  dark: "dataviz-dark",
  satellite: "satellite",
};

const buildMaptilerStyleUrl = (
  appearance: "light" | "dark" | "satellite",
  key: string
): string =>
  `https://api.maptiler.com/maps/${MAPTILER_STYLES[appearance]}/style.json?key=${encodeURIComponent(key)}`;

const MAPLIBRE_CSS_HREF = "https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css";
const CSS_LINK_ID = "gds-maplibre-gl-css";

function ensureMaplibreCss() {
  if (typeof document === "undefined") return;
  if (document.getElementById(CSS_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = CSS_LINK_ID;
  link.rel = "stylesheet";
  link.href = MAPLIBRE_CSS_HREF;
  document.head.appendChild(link);
}

export const createMaplibreAdapter: AdapterFactory = async (
  container,
  opts,
  callbacks
) => {
  ensureMaplibreCss();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let maplibregl: any;
  try {
    maplibregl = await import("maplibre-gl");
    // ESM/CJS interop
    if (maplibregl.default) maplibregl = maplibregl.default;
  } catch (err) {
    callbacks.onError({
      code: "sdk-missing",
      message:
        '@gradeui/ui Map: `maplibre-gl` is not installed. Run `pnpm add maplibre-gl` (or your package manager\'s equivalent) to use provider="maplibre".',
      cause: err,
    });
    throw err;
  }

  const tilerKey = opts.tilerKey ?? GRADE_DEMO_MAPTILER_KEY;

  if (
    process.env.NODE_ENV !== "production" &&
    !opts.tilerKey &&
    !isDemoKeyConfigured()
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "@gradeui/ui Map: no `tilerKey` prop and the bundled MapTiler demo key is unset. " +
        "Tile requests will 403. Set `tilerKey` or paste a key into demo-config.ts."
    );
  }

  const styleUrl = opts.styleUrl ?? buildMaptilerStyleUrl(opts.appearance, tilerKey);

  const map = new maplibregl.Map({
    container,
    style: styleUrl,
    center: opts.center,
    zoom: opts.zoom,
    interactive: opts.interactive,
    attributionControl: { compact: true },
  });

  // Tools — shared vocabulary (types.ts). MapLibre had NO zoom buttons
  // before this (scroll/pinch only); "auto"/"zoom" now adds the
  // navigation control (zoom only, no compass — rotation isn't part of
  // the Grade map contract) docked to the requested corner, which
  // MapLibre takes verbatim.
  if (opts.tools === "zoom" || (opts.tools === "auto" && opts.interactive)) {
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      opts.toolsPosition,
    );
  }

  if (opts.bounds) {
    map.fitBounds([opts.bounds[0], opts.bounds[1]], { animate: false });
  }

  await new Promise<void>((resolve) => {
    map.once("load", () => resolve());
  });
  callbacks.onLoad();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map.on("error", (e: any) => {
    const msg = String(e?.error?.message ?? e?.message ?? "MapLibre error");
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
      const next = opts.styleUrl ?? buildMaptilerStyleUrl(appearance, tilerKey);
      // setStyle keeps existing markers (they're not source-attached).
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

      const marker = new maplibregl.Marker({
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
