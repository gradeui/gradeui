import type {
  AdapterFactory,
  AdapterInstance,
  Coords,
  MarkerHandle,
} from "../types";

/**
 * Leaflet adapter — a WORKER-FREE raster-tile renderer.
 *
 * Why this exists alongside the maplibre adapter: maplibre-gl does all of its
 * rendering in a Web Worker (spawned from a `blob:` URL). Inside a strictly
 * sandboxed MCP App panel the default CSP is `default-src 'none'`, workers
 * fall back to that, and the MCP Apps CSP vocabulary has no `worker-src`
 * knob — so maplibre simply cannot run there. Leaflet paints raster tiles as
 * plain `<img>` elements on the main thread (no worker), so it runs fine; the
 * only thing it needs is network access to the tile host, which IS grantable
 * via the resource's `connectDomains` / `resourceDomains`.
 *
 * Keyless: OSM raster tiles, no API key, no referrer lock. The MCP View
 * forces this adapter (see the provider override in map.tsx); Studio and the
 * embed keep maplibre.
 */

const LEAFLET_CSS_HREF = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CSS_LINK_ID = "gds-leaflet-css";

function ensureLeafletCss() {
  if (typeof document === "undefined") return;
  // The MCP View bundles Leaflet's CSS inline and sets this flag, so we skip
  // the network <link> there (it would be CSP-blocked anyway).
  if ((globalThis as { __gradeLeafletCssBundled?: boolean }).__gradeLeafletCssBundled)
    return;
  if (document.getElementById(CSS_LINK_ID)) return;
  const link = document.createElement("link");
  link.id = CSS_LINK_ID;
  link.rel = "stylesheet";
  link.href = LEAFLET_CSS_HREF;
  document.head.appendChild(link);
}

// Keyless CARTO raster basemaps (built on OSM data). Much closer to Google
// Maps' default look than raw OSM: `voyager` is the light, road-forward style;
// `dark_all` is a real dark style (no CSS-invert hack). Served from the
// a–d.basemaps.cartocdn.com CDN; those hosts are declared in the MCP View's
// resource CSP. Free with attribution.
const CARTO_STYLE: Record<"light" | "dark" | "satellite", string> = {
  light: "rastertiles/voyager",
  dark: "rastertiles/dark_all",
  satellite: "rastertiles/voyager",
};
const cartoUrl = (style: string) =>
  `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`;
const CARTO_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

export const createLeafletAdapter: AdapterFactory = async (
  container,
  opts,
  callbacks
) => {
  ensureLeafletCss();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let L: any;
  try {
    // leaflet is resolved + bundled by the consumer (the MCP preview View);
    // it's intentionally NOT a dependency of @gradeui/ui, so the dts build
    // can't resolve its types here. The value is `any`, so suppress the
    // module-resolution error rather than pull leaflet into this package.
    // @ts-ignore -- optional peer, resolved by the bundling consumer
    L = await import("leaflet");
    if (L.default) L = L.default;
  } catch (err) {
    callbacks.onError({
      code: "sdk-missing",
      message:
        '@gradeui/ui Map: `leaflet` is not installed. Run `pnpm add leaflet` to use the worker-free Leaflet adapter.',
      cause: err,
    });
    throw err;
  }

  // Grade coords are [lng, lat]; Leaflet wants [lat, lng].
  const toLatLng = (c: Coords): [number, number] => [c[1], c[0]];

  const map = L.map(container, {
    center: toLatLng(opts.center),
    zoom: opts.zoom,
    zoomControl: opts.interactive,
    attributionControl: true,
    dragging: opts.interactive,
    scrollWheelZoom: opts.interactive,
    doubleClickZoom: opts.interactive,
    boxZoom: opts.interactive,
    keyboard: opts.interactive,
    touchZoom: opts.interactive,
  });

  // Appearance is a different tile STYLE (not a CSS filter), so switching it
  // swaps the layer. `{r}` is Leaflet's retina suffix; `detectRetina` fills it.
  const addTiles = (appearance: "light" | "dark" | "satellite") => {
    const layer = L.tileLayer(cartoUrl(CARTO_STYLE[appearance] ?? CARTO_STYLE.light), {
      maxZoom: 20,
      subdomains: "abcd",
      detectRetina: true,
      attribution: CARTO_ATTRIBUTION,
      crossOrigin: true,
    });
    layer.on("tileerror", () =>
      callbacks.onError({
        code: "tile-load-failed",
        message: "map tile failed to load (is the tile host allowed by CSP?)",
      })
    );
    layer.addTo(map);
    return layer;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tiles: any = addTiles(opts.appearance);
  const applyAppearance = (appearance: "light" | "dark" | "satellite") => {
    if (tiles) map.removeLayer(tiles);
    tiles = addTiles(appearance);
  };

  if (opts.bounds) {
    map.fitBounds([toLatLng(opts.bounds[0]), toLatLng(opts.bounds[1])], {
      animate: false,
    });
  }

  // Leaflet initialises synchronously — signal ready immediately.
  callbacks.onLoad();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = new globalThis.Map<string, { marker: any; handle: MarkerHandle }>();

  const adapter: AdapterInstance = {
    setCenter: (c) => map.panTo(toLatLng(c), { animate: false }),
    setZoom: (z) => map.setZoom(z),
    setBounds: (sw, ne) =>
      map.fitBounds([toLatLng(sw), toLatLng(ne)], { animate: false }),
    setAppearance: (a) => applyAppearance(a),
    setInteractive: (enabled) => {
      const handlers = [
        "dragging",
        "scrollWheelZoom",
        "doubleClickZoom",
        "boxZoom",
        "keyboard",
        "touchZoom",
      ] as const;
      for (const k of handlers) {
        const ctl = map[k];
        if (ctl) (enabled ? ctl.enable() : ctl.disable());
      }
    },
    flyTo: (c, o) =>
      map.flyTo(toLatLng(c), o?.zoom ?? map.getZoom(), {
        duration: (o?.durationMs ?? 800) / 1000,
      }),
    panTo: (c, o) =>
      map.panTo(toLatLng(c), { duration: (o?.durationMs ?? 600) / 1000 }),
    fitBounds: (list, o) => {
      if (list.length === 0) return;
      const pad = o?.paddingPx ?? 40;
      map.fitBounds(list.map(toLatLng), {
        padding: [pad, pad],
        duration: (o?.durationMs ?? 800) / 1000,
      });
    },
    getCenter: () => {
      const c = map.getCenter();
      return [c.lng, c.lat];
    },
    getZoom: () => map.getZoom(),
    getBounds: () => {
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      return [
        [sw.lng, sw.lat],
        [ne.lng, ne.lat],
      ];
    },
    addMarker: (id, coords, anchor) => {
      // Live DOM marker: <MapMarker> portals its React children into
      // `element`. Leaflet positions the icon container's top-left at the
      // coord (iconAnchor [0,0]); our absolutely-positioned element then
      // offsets via transform so its bottom-centre (or centre) sits on the
      // point — matching the maplibre adapter's anchor semantics.
      const element = document.createElement("div");
      element.dataset.gdsPart = "map-marker";
      element.dataset.gdsState = "idle";
      element.style.position = "absolute";
      element.style.cursor = "pointer";
      element.style.transform =
        anchor === "center"
          ? "translate(-50%, -50%)"
          : "translate(-50%, -100%)";

      element.addEventListener("mouseenter", () => callbacks.onMarkerHover(id));
      element.addEventListener("mouseleave", () => callbacks.onMarkerHover(null));
      element.addEventListener("click", (e) =>
        callbacks.onMarkerClick(id, handle.coords, e)
      );

      const icon = L.divIcon({
        className: "gds-leaflet-marker",
        html: "",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker(toLatLng(coords), {
        icon,
        interactive: true,
        keyboard: false,
      }).addTo(map);

      const iconEl: HTMLElement | undefined = marker.getElement();
      if (iconEl) {
        iconEl.style.pointerEvents = "auto";
        iconEl.appendChild(element);
      }

      const handle: MarkerHandle = {
        element,
        coords,
        setHovered: (hovered) => {
          element.dataset.gdsState = hovered ? "hovered" : "idle";
          if (iconEl) iconEl.style.zIndex = hovered ? "1000" : "";
        },
        setPosition: (next) => {
          handle.coords = next;
          marker.setLatLng(toLatLng(next));
        },
        remove: () => {
          map.removeLayer(marker);
          markers.delete(id);
        },
      };

      markers.set(id, { marker, handle });
      return handle;
    },
    destroy: () => {
      markers.forEach(({ marker }) => map.removeLayer(marker));
      markers.clear();
      map.remove();
    },
    instance: map,
  };

  return adapter;
};
