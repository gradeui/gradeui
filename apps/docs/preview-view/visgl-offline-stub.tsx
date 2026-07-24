/**
 * Offline stub for "@vis.gl/react-google-maps" — MCP preview View ONLY.
 *
 * The View's CSP is connect-src 'none' (see build-view.mjs), so a real
 * Google map can never load in the panel: the SDK script, the tiles and
 * the esm.sh module fetch are all blocked. Screens that use the map
 * already carry their own degradation path (window.gm_authFailure hook +
 * MapWatchdog → wireframe RankGrid); this stub exists so those screens
 * RUN at all — without it the top-level import dies in the resolver and
 * the whole screen shows the snag card instead of the fallback.
 *
 * Semantics: APIProvider mounts, then fires window.gm_authFailure() on a
 * 0ms timer — deferred so the SCREEN's effect (which registers the hook;
 * child effects run before parent effects) has run first. That trips the
 * authored fallback instantly instead of waiting out MapWatchdog's 7s
 * timeout (which still backstops screens that only use the watchdog).
 *
 * The live surfaces are untouched: /external-sandbox (the "/e/" external
 * frame) resolves @vis.gl from esm.sh with real network, and Studio's
 * flat renderer uses the core's CDN tier. This module is imported only
 * by preview-view/view.tsx.
 */

import * as React from "react";
import { registerImportResolver } from "@/lib/studio-render-core";

const VISGL_PKG = "@vis.gl/react-google-maps";

function APIProvider({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    const t = setTimeout(() => {
      const fail = (window as { gm_authFailure?: () => void }).gm_authFailure;
      if (typeof fail === "function") fail();
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return <>{children}</>;
}

/** Renders nothing — markers/children would only no-op against a null
 *  map anyway, and an empty surface reads better than a broken one for
 *  the frames the fallback hasn't replaced yet. */
function NullComponent(): null {
  return null;
}

const STUB = {
  APIProvider,
  Map: NullComponent,
  AdvancedMarker: NullComponent,
  Marker: NullComponent,
  Pin: NullComponent,
  InfoWindow: NullComponent,
  MapControl: NullComponent,
  ControlPosition: {},
  useMap: () => null,
  useMapsLibrary: () => null,
  useApiIsLoaded: () => false,
  useApiLoadingStatus: () => "FAILED",
};

registerImportResolver({
  knows: (spec) => spec === VISGL_PKG || spec.startsWith(`${VISGL_PKG}/`),
  resolve: () => STUB,
});
