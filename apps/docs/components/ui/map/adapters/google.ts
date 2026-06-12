import type {
  AdapterFactory,
  AdapterInstance,
  Coords,
  MarkerHandle,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStyles = any[];

const GOOGLE_LIGHT_STYLES: AnyStyles = [
  // Neutral light preset — POIs hidden, transit muted.
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "simplified" }] },
];

const GOOGLE_DARK_STYLES: AnyStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#262626" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca3af" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "simplified" }, { color: "#3a3a3a" }],
  },
];

const stylesFor = (appearance: "light" | "dark"): AnyStyles =>
  appearance === "dark" ? GOOGLE_DARK_STYLES : GOOGLE_LIGHT_STYLES;

export const createGoogleAdapter: AdapterFactory = async (
  container,
  opts,
  callbacks
) => {
  if (!opts.apiKey) {
    callbacks.onError({
      code: "api-key-missing",
      message:
        '@gradeui/ui Map: provider="google" requires an `apiKey` prop.',
    });
    throw new Error("google apiKey missing");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let LoaderCtor: any;
  try {
    // @ts-ignore optional peer dep — type resolves when the package is
    // installed, fails gracefully into the catch when it isn't. (Was
    // a stricter ts-expect-error before May 2026; once apps/docs added
    // the package as a regular dep for build-time bundler resolution,
    // the strict directive fired as unused. Note the missing `@` in
    // the prose here is deliberate — TypeScript parses ts-expect-error
    // inside a `//` comment as a real directive even when it's just
    // documentation.)
    const mod = await import("@googlemaps/js-api-loader");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    LoaderCtor = (mod as any).Loader ?? (mod as any).default?.Loader;
  } catch (err) {
    callbacks.onError({
      code: "sdk-missing",
      message:
        '@gradeui/ui Map: `@googlemaps/js-api-loader` is not installed. Run `pnpm add @googlemaps/js-api-loader` to use provider="google".',
      cause: err,
    });
    throw err;
  }

  const loader = new LoaderCtor({
    apiKey: opts.apiKey,
    version: "weekly",
    libraries: ["maps", "marker"],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let google: any;
  try {
    google = await loader.load();
  } catch (err) {
    callbacks.onError({
      code: "provider-init-failed",
      message: "@gradeui/ui Map: Google Maps loader failed.",
      cause: err,
    });
    throw err;
  }

  const isSat = opts.appearance === "satellite";

  // Tools — shared vocabulary (types.ts). Google's default UI is loud
  // (map-type switcher, street view, fullscreen), so the Grade contract
  // disables ALL of it and adds back only the zoom control, docked via
  // ControlPosition. This also makes Google match the other providers'
  // quiet chrome instead of its own kitchen sink.
  const showZoom =
    opts.tools === "zoom" || (opts.tools === "auto" && opts.interactive);
  // Typed as number — ControlPosition is a numeric enum and this vendored
  // copy compiles without the google.maps ambient types (the SDK value is
  // `any` from the loader).
  const googleCorner: Record<string, number> = {
    "top-left": google.maps.ControlPosition.LEFT_TOP,
    "top-right": google.maps.ControlPosition.RIGHT_TOP,
    "bottom-left": google.maps.ControlPosition.LEFT_BOTTOM,
    "bottom-right": google.maps.ControlPosition.RIGHT_BOTTOM,
  };

  const map = new google.maps.Map(container, {
    center: { lat: opts.center[1], lng: opts.center[0] },
    zoom: opts.zoom,
    mapTypeId: isSat
      ? google.maps.MapTypeId.HYBRID
      : google.maps.MapTypeId.ROADMAP,
    mapId: opts.mapId,
    styles: isSat
      ? undefined
      : stylesFor(opts.appearance === "dark" ? "dark" : "light"),
    disableDefaultUI: true,
    zoomControl: showZoom,
    zoomControlOptions: {
      position: googleCorner[opts.toolsPosition],
    },
    gestureHandling: opts.interactive ? "auto" : "none",
    keyboardShortcuts: opts.interactive,
  });

  if (opts.bounds) {
    const b = new google.maps.LatLngBounds(
      { lat: opts.bounds[0][1], lng: opts.bounds[0][0] },
      { lat: opts.bounds[1][1], lng: opts.bounds[1][0] }
    );
    map.fitBounds(b);
  }

  await new Promise<void>((resolve) => {
    google.maps.event.addListenerOnce(map, "idle", () => resolve());
  });
  callbacks.onLoad();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markers = new globalThis.Map<string, { marker: any; handle: MarkerHandle }>();

  const adapter: AdapterInstance = {
    setCenter: (coords) =>
      map.setCenter({ lat: coords[1], lng: coords[0] }),
    setZoom: (zoom) => map.setZoom(zoom),
    setBounds: (sw, ne) => {
      const b = new google.maps.LatLngBounds(
        { lat: sw[1], lng: sw[0] },
        { lat: ne[1], lng: ne[0] }
      );
      map.fitBounds(b);
    },
    setAppearance: (appearance) => {
      if (appearance === "satellite") {
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
        map.setOptions({ styles: undefined });
      } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        map.setOptions({ styles: stylesFor(appearance) });
      }
    },
    setInteractive: (enabled) => {
      // disableDefaultUI stays true permanently (Grade owns the chrome);
      // only the zoom control follows interactivity under tools="auto".
      map.setOptions({
        zoomControl:
          opts.tools === "zoom" || (opts.tools === "auto" && enabled),
        gestureHandling: enabled ? "auto" : "none",
        keyboardShortcuts: enabled,
      });
    },
    flyTo: (coords, fopts) => {
      map.panTo({ lat: coords[1], lng: coords[0] });
      if (fopts?.zoom != null) map.setZoom(fopts.zoom);
    },
    panTo: (coords) => map.panTo({ lat: coords[1], lng: coords[0] }),
    fitBounds: (list, fbopts) => {
      if (list.length === 0) return;
      const b = new google.maps.LatLngBounds();
      for (const [lng, lat] of list) b.extend({ lat, lng });
      map.fitBounds(b, fbopts?.paddingPx ?? 40);
    },
    getCenter: () => {
      const c = map.getCenter();
      return c ? [c.lng(), c.lat()] : [0, 0];
    },
    getZoom: () => map.getZoom() ?? 0,
    getBounds: () => {
      const b = map.getBounds();
      if (!b) return [
        [0, 0],
        [0, 0],
      ];
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      return [
        [sw.lng(), sw.lat()],
        [ne.lng(), ne.lat()],
      ];
    },
    addMarker: (id, coords, anchor) => {
      const element = document.createElement("div");
      element.dataset.gdsPart = "map-marker";
      element.dataset.gdsState = "idle";
      element.style.cursor = "pointer";
      // Google AdvancedMarker anchors the *bottom-center* of `content` to
      // the coord by default. For "center" anchor, shift content down so
      // the visual midpoint lands on the coord.
      if (anchor === "center") {
        element.style.transform = "translateY(50%)";
      }

      element.addEventListener("mouseenter", () => callbacks.onMarkerHover(id));
      element.addEventListener("mouseleave", () => callbacks.onMarkerHover(null));
      element.addEventListener("click", (e) => {
        callbacks.onMarkerClick(id, handle.coords, e);
      });

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: coords[1], lng: coords[0] },
        content: element,
      });

      const handle: MarkerHandle = {
        element,
        coords,
        setHovered: (hovered) => {
          element.dataset.gdsState = hovered ? "hovered" : "idle";
          marker.zIndex = hovered ? 10 : 1;
        },
        setPosition: (next) => {
          handle.coords = next;
          marker.position = { lat: next[1], lng: next[0] };
        },
        remove: () => {
          marker.map = null;
          markers.delete(id);
        },
      };

      markers.set(id, { marker, handle });
      return handle;
    },
    destroy: () => {
      markers.forEach(({ marker }) => {
        marker.map = null;
      });
      markers.clear();
      // Google Map has no explicit destroy(); GC handles it once the
      // container DOM node is removed.
    },
    instance: map,
  };

  return adapter;
};
