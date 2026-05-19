// ../sessions/eager-wizardly-carson/mnt/ramp-ds/gradeui/packages/ui/tsup.config.ts
import { defineConfig } from "tsup";
var tsup_config_default = defineConfig({
  entry: {
    index: "lib/index.ts",
    "tailwind-preset": "tailwind-preset.ts",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc2Vzc2lvbnMvZWFnZXItd2l6YXJkbHktY2Fyc29uL21udC9yYW1wLWRzL2dyYWRldWkvcGFja2FnZXMvdWkvdHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL3Nlc3Npb25zL2VhZ2VyLXdpemFyZGx5LWNhcnNvbi9tbnQvcmFtcC1kcy9ncmFkZXVpL3BhY2thZ2VzL3VpL3RzdXAuY29uZmlnLnRzXCI7Y29uc3QgX19pbmplY3RlZF9kaXJuYW1lX18gPSBcIi9zZXNzaW9ucy9lYWdlci13aXphcmRseS1jYXJzb24vbW50L3JhbXAtZHMvZ3JhZGV1aS9wYWNrYWdlcy91aVwiO2NvbnN0IF9faW5qZWN0ZWRfaW1wb3J0X21ldGFfdXJsX18gPSBcImZpbGU6Ly8vc2Vzc2lvbnMvZWFnZXItd2l6YXJkbHktY2Fyc29uL21udC9yYW1wLWRzL2dyYWRldWkvcGFja2FnZXMvdWkvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidHN1cFwiO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBlbnRyeToge1xuICAgIGluZGV4OiBcImxpYi9pbmRleC50c1wiLFxuICAgIFwidGFpbHdpbmQtcHJlc2V0XCI6IFwidGFpbHdpbmQtcHJlc2V0LnRzXCIsXG4gICAgLy8gU3ViLXBhdGggZW50cmllcyBmb3IgdGhlIE1hcCBhZGFwdGVycyBcdTIwMTQgbGV0IGNvbnN1bWVycyBwcmVsb2FkIGFcbiAgICAvLyBzcGVjaWZpYyBwcm92aWRlciB2aWEgYGltcG9ydCBcIkBncmFkZXVpL3VpL21hcC88cHJvdmlkZXI+XCJgIGFuZFxuICAgIC8vIHNraXAgdGhlIGR5bmFtaWMtaW1wb3J0IGJvdW5kYXJ5IHRoZSBkZWZhdWx0IGA8TWFwPmAgdXNlcy5cbiAgICBcIm1hcC9tYXBsaWJyZVwiOiBcImNvbXBvbmVudHMvdWkvbWFwL2FkYXB0ZXJzL21hcGxpYnJlLnRzXCIsXG4gICAgXCJtYXAvbWFwYm94XCI6IFwiY29tcG9uZW50cy91aS9tYXAvYWRhcHRlcnMvbWFwYm94LnRzXCIsXG4gICAgXCJtYXAvZ29vZ2xlXCI6IFwiY29tcG9uZW50cy91aS9tYXAvYWRhcHRlcnMvZ29vZ2xlLnRzXCIsXG4gIH0sXG4gIGZvcm1hdDogW1wiY2pzXCIsIFwiZXNtXCJdLFxuICBkdHM6IHRydWUsXG4gIHNwbGl0dGluZzogZmFsc2UsXG4gIHNvdXJjZW1hcDogdHJ1ZSxcbiAgLy8gY2xlYW46IGZhbHNlIG9uIHB1cnBvc2UgXHUyMDE0IGB0c3VwIC0td2F0Y2hgIHdvdWxkIG90aGVyd2lzZSBudWtlIHRoZVxuICAvLyBlbnRpcmUgZGlzdC8gZGlyZWN0b3J5IG9uIGV2ZXJ5IHJlYnVpbGQsIGluY2x1ZGluZyBkaXN0L3N0eWxlcy5jc3NcbiAgLy8gKHdoaWNoIGlzIHByb2R1Y2VkIGJ5IGEgc2VwYXJhdGUgYHRhaWx3aW5kY3NzYCBzdGVwKS4gVGhlIG9uZS1zaG90XG4gIC8vIGBidWlsZGAgc2NyaXB0IGhhbmRsZXMgY2xlYW51cCBleHBsaWNpdGx5IHZpYSBgcmltcmFmIGRpc3RgIGJlZm9yZVxuICAvLyB0c3VwIHJ1bnMuXG4gIGNsZWFuOiBmYWxzZSxcbiAgZXh0ZXJuYWw6IFtcbiAgICBcInJlYWN0XCIsXG4gICAgXCJyZWFjdC1kb21cIixcbiAgICBcInRhaWx3aW5kY3NzXCIsXG4gICAgXCJAcml2ZS1hcHAvcmVhY3QtY2FudmFzXCIsXG4gICAgLy8gTWFwIFNES3MgYXJlIG9wdGlvbmFsIHBlZXIgZGVwcyBcdTIwMTQgbmV2ZXIgYnVuZGxlIHRoZW0uXG4gICAgXCJtYXBsaWJyZS1nbFwiLFxuICAgIFwibWFwYm94LWdsXCIsXG4gICAgXCJAZ29vZ2xlbWFwcy9qcy1hcGktbG9hZGVyXCIsXG4gIF0sXG4gIHRyZWVzaGFrZTogdHJ1ZSxcbiAgbWluaWZ5OiB0cnVlLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJVLFNBQVMsb0JBQW9CO0FBRXhXLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLE9BQU87QUFBQSxJQUNQLG1CQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBLElBSW5CLGdCQUFnQjtBQUFBLElBQ2hCLGNBQWM7QUFBQSxJQUNkLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsUUFBUSxDQUFDLE9BQU8sS0FBSztBQUFBLEVBQ3JCLEtBQUs7QUFBQSxFQUNMLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNWCxPQUFPO0FBQUEsRUFDUCxVQUFVO0FBQUEsSUFDUjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsV0FBVztBQUFBLEVBQ1gsUUFBUTtBQUNWLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
