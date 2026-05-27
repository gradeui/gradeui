// tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig({
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
    "map/google": "components/ui/map/adapters/google.ts"
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
    "@googlemaps/js-api-loader"
  ],
  treeshake: true,
  minify: true
});
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL3Nlc3Npb25zL2NvbXBhc3Npb25hdGUtbWFnaWNhbC1mZXJtYXQvbW50L3JhbXAtZHMvZ3JhZGV1aS9wYWNrYWdlcy91aS90c3VwLmNvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvc2Vzc2lvbnMvY29tcGFzc2lvbmF0ZS1tYWdpY2FsLWZlcm1hdC9tbnQvcmFtcC1kcy9ncmFkZXVpL3BhY2thZ2VzL3VpXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9zZXNzaW9ucy9jb21wYXNzaW9uYXRlLW1hZ2ljYWwtZmVybWF0L21udC9yYW1wLWRzL2dyYWRldWkvcGFja2FnZXMvdWkvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlbnRyeToge1xuICAgIGluZGV4OiBcImxpYi9pbmRleC50c1wiLFxuICAgIFwidGFpbHdpbmQtcHJlc2V0XCI6IFwidGFpbHdpbmQtcHJlc2V0LnRzXCIsXG4gICAgLy8gYEBncmFkZXVpL3VpL2NvbnRyYWN0c2AgXHUyMDE0IHNlcnZlci1zYWZlIGVudHJ5cG9pbnQgdGhhdCBleHBvc2VzXG4gICAgLy8gdGhlIHR5cGVkIGNvbnRyYWN0cyByZWdpc3RyeSB3aXRob3V0IGRyYWdnaW5nIGluIGFueSBSZWFjdFxuICAgIC8vIGNvbXBvbmVudCBjb2RlLiBUaGUgbWFpbiBgLi9gIGVudHJ5IGJ1bmRsZXMgZXZlcnkgY29tcG9uZW50LCBzb1xuICAgIC8vIGltcG9ydGluZyBgQ09NUE9ORU5UX0NPTlRSQUNUU2AgZnJvbSBpdCBsb2FkcyBSZWFjdCBhdCBtb2R1bGVcbiAgICAvLyBpbml0IFx1MjAxNCB3aGljaCBjcmFzaGVzIGluIGEgU2VydmVyIENvbXBvbmVudCAvIEFQSSByb3V0ZSB3aXRoXG4gICAgLy8gXCJ1c2VFZmZlY3QgY2FuJ3QgYmUgdXNlZCBpbiBhIFNlcnZlciBDb21wb25lbnRcIi4gVGhpcyBzdWItZW50cnlcbiAgICAvLyBvbmx5IHB1bGxzIGluIFpvZCArIHRoZSBwZXItY29tcG9uZW50IGAqLmNvbnRyYWN0LnRzYCBmaWxlc1xuICAgIC8vICh3aGljaCB0aGVtc2VsdmVzIG9ubHkgaW1wb3J0IFpvZCksIHNvIGl0J3Mgc2FmZSBmcm9tIGFueXdoZXJlXG4gICAgLy8gKEVkZ2UgcnVudGltZSwgQVBJIHJvdXRlcywgTUNQIHNlcnZlcnMsIENMSSkuXG4gICAgXCJjb250cmFjdHNcIjogXCJsaWIvY29udHJhY3RzLnRzXCIsXG4gICAgLy8gU3ViLXBhdGggZW50cmllcyBmb3IgdGhlIE1hcCBhZGFwdGVycyBcdTIwMTQgbGV0IGNvbnN1bWVycyBwcmVsb2FkIGFcbiAgICAvLyBzcGVjaWZpYyBwcm92aWRlciB2aWEgYGltcG9ydCBcIkBncmFkZXVpL3VpL21hcC88cHJvdmlkZXI+XCJgIGFuZFxuICAgIC8vIHNraXAgdGhlIGR5bmFtaWMtaW1wb3J0IGJvdW5kYXJ5IHRoZSBkZWZhdWx0IGA8TWFwPmAgdXNlcy5cbiAgICBcIm1hcC9tYXBsaWJyZVwiOiBcImNvbXBvbmVudHMvdWkvbWFwL2FkYXB0ZXJzL21hcGxpYnJlLnRzXCIsXG4gICAgXCJtYXAvbWFwYm94XCI6IFwiY29tcG9uZW50cy91aS9tYXAvYWRhcHRlcnMvbWFwYm94LnRzXCIsXG4gICAgXCJtYXAvZ29vZ2xlXCI6IFwiY29tcG9uZW50cy91aS9tYXAvYWRhcHRlcnMvZ29vZ2xlLnRzXCIsXG4gIH0sXG4gIGZvcm1hdDogW1wiY2pzXCIsIFwiZXNtXCJdLFxuICBkdHM6IHRydWUsXG4gIHNwbGl0dGluZzogZmFsc2UsXG4gIHNvdXJjZW1hcDogdHJ1ZSxcbiAgLy8gY2xlYW46IGZhbHNlIG9uIHB1cnBvc2UgXHUyMDE0IGB0c3VwIC0td2F0Y2hgIHdvdWxkIG90aGVyd2lzZSBudWtlIHRoZVxuICAvLyBlbnRpcmUgZGlzdC8gZGlyZWN0b3J5IG9uIGV2ZXJ5IHJlYnVpbGQsIGluY2x1ZGluZyBkaXN0L3N0eWxlcy5jc3NcbiAgLy8gKHdoaWNoIGlzIHByb2R1Y2VkIGJ5IGEgc2VwYXJhdGUgYHRhaWx3aW5kY3NzYCBzdGVwKS4gVGhlIG9uZS1zaG90XG4gIC8vIGBidWlsZGAgc2NyaXB0IGhhbmRsZXMgY2xlYW51cCBleHBsaWNpdGx5IHZpYSBgcmltcmFmIGRpc3RgIGJlZm9yZVxuICAvLyB0c3VwIHJ1bnMuXG4gIGNsZWFuOiBmYWxzZSxcbiAgZXh0ZXJuYWw6IFtcbiAgICBcInJlYWN0XCIsXG4gICAgXCJyZWFjdC1kb21cIixcbiAgICBcInRhaWx3aW5kY3NzXCIsXG4gICAgXCJAcml2ZS1hcHAvcmVhY3QtY2FudmFzXCIsXG4gICAgLy8gTWFwIFNES3MgYXJlIG9wdGlvbmFsIHBlZXIgZGVwcyBcdTIwMTQgbmV2ZXIgYnVuZGxlIHRoZW0uXG4gICAgXCJtYXBsaWJyZS1nbFwiLFxuICAgIFwibWFwYm94LWdsXCIsXG4gICAgXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCIsXG4gIF0sXG4gIHRyZWVzaGFrZTogdHJ1ZSxcbiAgbWluaWZ5OiB0cnVlLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdXLFNBQVMsb0JBQW9CO0FBRTdYLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLE9BQU87QUFBQSxJQUNQLG1CQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBVW5CLGFBQWE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUliLGdCQUFnQjtBQUFBLElBQ2hCLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLEVBQ3JCLEtBQUs7QUFBQSxFQUNMLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNWCxPQUFPO0FBQUEsRUFDUCxVQUFVO0FBQUEsSUFDUjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsV0FBVztBQUFBLEVBQ1gsUUFBUTtBQUNWLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
