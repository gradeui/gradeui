"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useMaybeGradeTheme } from "../../grade-theme-provider";
import { MapContext, type MapContextValue } from "./context";
import type {
  AdapterFactory,
  AdapterInstance,
  Coords,
  MapHandle,
  MapProps,
  MarkerHandle,
} from "./types";

const ADAPTER_LOADERS: Record<
  "maplibre" | "mapbox" | "google",
  () => Promise<AdapterFactory>
> = {
  maplibre: () =>
    import("./adapters/maplibre").then((m) => m.createMaplibreAdapter),
  mapbox: () =>
    import("./adapters/mapbox").then((m) => m.createMapboxAdapter),
  google: () =>
    import("./adapters/google").then((m) => m.createGoogleAdapter),
};

const MARKER_WARN_THRESHOLD = 500;

const Map = React.forwardRef<MapHandle, MapProps>(function Map(props, ref) {
  const {
    center,
    zoom,
    bounds,
    appearance = "auto",
    interactive = true,
    tools = "auto",
    toolsPosition = "top-left",
    hoveredId,
    onHoveredIdChange,
    onLoad,
    onError,
    className,
    style,
    children,
    ...rest
  } = props;

  // Provider + provider-specific config (narrowed at the type level by MapProps,
  // erased here so the runtime can read them uniformly).
  const provider =
    (rest as { provider?: "maplibre" | "mapbox" | "google" }).provider ??
    "maplibre";
  const styleUrl = (rest as { styleUrl?: string }).styleUrl;
  const tilerKey = (rest as { tilerKey?: string }).tilerKey;
  const accessToken = (rest as { accessToken?: string }).accessToken;
  const apiKey = (rest as { apiKey?: string }).apiKey;
  const mapId = (rest as { mapId?: string }).mapId;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const adapterRef = React.useRef<AdapterInstance | null>(null);
  const markerRegistryRef = React.useRef<globalThis.Map<string, MarkerHandle>>(
    new globalThis.Map()
  );
  const lastHoveredRef = React.useRef<string | null>(null);

  // `adapterReady` is the signal MapMarker effects watch via the context
  // value's identity. When the adapter finishes its async init we flip
  // this true; the contextValue useMemo below has [adapterReady] as a
  // dep, so a fresh context object propagates to every <MapMarker>,
  // their `useEffect(..., [ctx, id])` re-runs, and `registerMarker`
  // fires the second time with adapterRef.current populated. Without
  // this signal markers race the adapter init and stay unregistered.
  const [adapterReady, setAdapterReady] = React.useState(false);

  // Latest-callback refs so the adapter init effect doesn't churn on prop changes.
  const onHoveredChangeRef = React.useRef(onHoveredIdChange);
  const onErrorRef = React.useRef(onError);
  const onLoadRef = React.useRef(onLoad);
  React.useEffect(() => {
    onHoveredChangeRef.current = onHoveredIdChange;
    onErrorRef.current = onError;
    onLoadRef.current = onLoad;
  });

  const themeCtx = useMaybeGradeTheme();
  // Provider-less hosts (the Fast Frame sandbox behind Studio previews and
  // /e/ embeds, the flat capture page) have no GradeThemeProvider — but
  // their renderer stamps `.dark` on <html> when the pushed theme is dark
  // (applyTheme in fast-sandbox/page.tsx). Watch that class as the
  // fallback signal so `appearance="auto"` maps restyle live when an
  // embed's ?mode=dark / the EmbedTweaker's mode control flips the
  // document — the adapter's setAppearance sync below picks the change
  // up like any other isDark move. With a provider above us the context
  // wins and the observer never attaches.
  const hasThemeCtx = themeCtx !== null && themeCtx !== undefined;
  const [rootDark, setRootDark] = React.useState(false);
  React.useEffect(() => {
    if (hasThemeCtx || typeof document === "undefined") return;
    const root = document.documentElement;
    const read = () => setRootDark(root.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [hasThemeCtx]);
  const isDark = themeCtx?.isDark ?? rootDark;

  const resolvedAppearance: "light" | "dark" | "satellite" =
    appearance === "auto" ? (isDark ? "dark" : "light") : appearance;

  // -------- adapter init (re-runs only on identity-changing config) --------
  React.useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    const initialAppearance =
      appearance === "auto" ? (isDark ? "dark" : "light") : appearance;

    (async () => {
      try {
        const factory = await ADAPTER_LOADERS[provider]();
        if (cancelled) return;

        const adapter = await factory(
          container,
          {
            center,
            zoom,
            bounds,
            appearance: initialAppearance,
            interactive,
            tools,
            toolsPosition,
            styleUrl,
            tilerKey,
            accessToken,
            apiKey,
            mapId,
          },
          {
            onLoad: () => {
              /* called by adapter once it's ready; we use the return value below */
            },
            onError: (err) => onErrorRef.current?.(err),
            onMarkerHover: (id) => onHoveredChangeRef.current?.(id),
            onMarkerClick: () => {
              /* per-marker onClick is dispatched via DOM listeners on the marker element */
            },
          }
        );

        if (cancelled) {
          adapter.destroy();
          return;
        }

        adapterRef.current = adapter;
        setAdapterReady(true);
        onLoadRef.current?.(buildHandle(adapterRef, markerRegistryRef));
      } catch (err) {
        if (cancelled) return;
        // sdk-missing / api-key-missing / provider-init-failed are already
        // reported via onError inside the adapter. Anything else: report.
        const code = (err as { code?: string })?.code;
        if (!code) {
          onErrorRef.current?.({
            code: "provider-init-failed",
            message: (err as Error)?.message ?? "Map init failed",
            cause: err,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      adapterRef.current?.destroy();
      adapterRef.current = null;
      setAdapterReady(false);
      markerRegistryRef.current.clear();
      lastHoveredRef.current = null;
    };
    // Only re-init on provider/key/style/tools changes — center/zoom/etc.
    // are imperative. Tools re-init rather than mutate: control add/remove
    // mid-flight differs per provider, and a tools change is a design-time
    // decision (Studio settings panel), not a runtime hot path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, styleUrl, accessToken, apiKey, mapId, tilerKey, tools, toolsPosition]);

  // -------- imperative prop sync --------
  React.useEffect(() => {
    adapterRef.current?.setAppearance(resolvedAppearance);
  }, [resolvedAppearance]);

  React.useEffect(() => {
    adapterRef.current?.setInteractive(interactive);
  }, [interactive]);

  React.useEffect(() => {
    if (!adapterRef.current) return;
    if (bounds) {
      adapterRef.current.setBounds(bounds[0], bounds[1]);
    } else {
      adapterRef.current.setCenter(center);
      adapterRef.current.setZoom(zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    center[0],
    center[1],
    zoom,
    bounds?.[0]?.[0],
    bounds?.[0]?.[1],
    bounds?.[1]?.[0],
    bounds?.[1]?.[1],
  ]);

  // -------- hovered-id sync (controlled) --------
  React.useEffect(() => {
    const prev = lastHoveredRef.current;
    if (prev && prev !== hoveredId) {
      markerRegistryRef.current.get(prev)?.setHovered(false);
    }
    if (hoveredId) {
      markerRegistryRef.current.get(hoveredId)?.setHovered(true);
    }
    lastHoveredRef.current = hoveredId ?? null;
  }, [hoveredId]);

  // -------- imperative ref handle --------
  React.useImperativeHandle(
    ref,
    () => buildHandle(adapterRef, markerRegistryRef),
    []
  );

  // -------- marker registration context --------
  // Deps include `adapterReady` so the context value's identity changes
  // when the adapter finishes loading — MapMarker effects re-run and
  // get a non-null handle from registerMarker on the second pass.
  const contextValue = React.useMemo<MapContextValue>(
    () => ({
      registerMarker: (id, coords, anchor) => {
        const adapter = adapterRef.current;
        if (!adapter) return null;

        const handle = adapter.addMarker(id, coords, anchor);
        markerRegistryRef.current.set(id, handle);

        if (
          process.env.NODE_ENV !== "production" &&
          markerRegistryRef.current.size === MARKER_WARN_THRESHOLD + 1
        ) {
          // eslint-disable-next-line no-console
          console.warn(
            `@gradeui/ui Map: rendering ${markerRegistryRef.current.size} markers. ` +
              "DOM markers degrade past ~1k. Consider clustering via the .instance escape hatch."
          );
        }

        // Wrap remove so registry stays in sync.
        const originalRemove = handle.remove;
        handle.remove = () => {
          originalRemove();
          markerRegistryRef.current.delete(id);
          if (lastHoveredRef.current === id) lastHoveredRef.current = null;
        };
        // Apply current hover state immediately if this id is the hovered one.
        if (hoveredId === id) handle.setHovered(true);
        return handle;
      },
    }),
    // hoveredId omitted intentionally — registerMarker reads from closure on call,
    // but since `<MapMarker>` only registers once on mount and hoveredId sync
    // happens via the dedicated effect, this is safe.
    [adapterReady]
  );

  return (
    <div
      ref={containerRef}
      data-gds-part="map"
      className={cn("gds-map relative isolate overflow-hidden", className)}
      style={{
        borderRadius: "var(--gds-map-radius, var(--radius, 0.5rem))",
        border: "var(--gds-map-border, 1px solid var(--border, transparent))",
        ...style,
      }}
    >
      <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
    </div>
  );
});

Map.displayName = "Map";

function buildHandle(
  adapterRef: React.MutableRefObject<AdapterInstance | null>,
  registryRef: React.MutableRefObject<globalThis.Map<string, MarkerHandle>>
): MapHandle {
  const noop = () => undefined;
  return {
    flyTo: (idOrCoords, opts) => {
      const adapter = adapterRef.current;
      if (!adapter) return;
      let target: Coords | null;
      if (typeof idOrCoords === "string") {
        target = registryRef.current.get(idOrCoords)?.coords ?? null;
        if (!target) {
          // eslint-disable-next-line no-console
          console.warn(
            `@gradeui/ui Map.flyTo: no marker registered with id "${idOrCoords}".`
          );
          return;
        }
      } else {
        target = idOrCoords;
      }
      adapter.flyTo(target, opts);
    },
    panTo: (coords, opts) => adapterRef.current?.panTo(coords, opts) ?? noop(),
    fitBounds: (coords, opts) =>
      adapterRef.current?.fitBounds(coords, opts) ?? noop(),
    getCenter: () => adapterRef.current?.getCenter() ?? [0, 0],
    getZoom: () => adapterRef.current?.getZoom() ?? 0,
    getBounds: () =>
      adapterRef.current?.getBounds() ?? [
        [0, 0],
        [0, 0],
      ],
    get instance() {
      return adapterRef.current?.instance ?? null;
    },
  };
}

export { Map };
