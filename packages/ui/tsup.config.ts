import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "lib/index.ts",
    "tailwind-preset": "tailwind-preset.ts",
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
