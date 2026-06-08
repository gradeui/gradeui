// Empty stub. The MCP preview View forces Grade's <Map> onto the Leaflet
// adapter (maplibre's Web Worker is blocked by the sandbox CSP), so the
// maplibre / mapbox / google adapter code is reachable-but-never-called.
// build-view.mjs aliases those map SDKs to this module so their ~800KB of
// real code isn't bundled into the View — the dead adapters resolve this
// empty object instead and never execute.
export default {};
