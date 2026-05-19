import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "lib/index.ts",
    "tailwind-preset": "tailwind-preset.ts",
    // `@gradeui/ui/contracts` — server-safe entrypoint that exposes
    // the typed contracts registry without dragging in any React
    // component code. The main `./` entry bundles every component, so
    // importing `COMPONENT_CONTRACTS` from it loads React at module
    // init — which crashes in a Server Component / API route with
    // "useEffect can't be used in a Server Component". This sub-entry
    // only pulls in Zod + the per-component `*.contract.ts` files
    // (which themselves only import Zod), so it's safe from anywhere
    // (Edge runtime, API routes, MCP servers, CLI).
    "contracts": "lib/contracts.ts",
    // Sub-path entries for the Map adapters — let consumers preload a
    // specific provider via `import "@gradeui/ui/map/<provider>"` and
    // skip the dynamic-import boundary the default `<Map>` uses.
    "map/maplibre": "components/ui/map/adapters/maplibre.ts",
    "map/mapbox": "components/ui/map/adapters/mapbox.ts",
    "map/google": "components/ui/map/adapters/google.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  // clean: false on purpose — `tsup --watch` would otherwise nuke the
  // entire dist/ directory on every rebuild, including dist/styles.css
  // (which is produced by a separate `tailwindcss` step). The one-shot
  // `build` script handles cleanup explicitly via `rimraf dist` before
  // tsup runs.
  clean: false,
  external: [
    "react",
    "react-dom",
    "tailwindcss",
    "@rive-app/react-canvas",
    // Map SDKs are optional peer deps — never bundle them.
    "maplibre-gl",
    "mapbox-gl",
    "@googlemaps/js-api-loader",
  ],
  treeshake: true,
  minify: true,
});
