import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// POC config: React renderer (so Grade's React components work) + Tailwind v4
// via the vite plugin (same major Grade uses). Output is static by default —
// components render to HTML with zero JS unless a `client:*` directive is added.
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    // Bundle @gradeui/ui (and its deps) through Vite's lenient resolver instead
    // of loading it via Node's strict ESM. Without this, SSR externalizes the
    // package and Node chokes on `lexical-beautiful-mentions`'s extensionless
    // ESM import (a transitive dep of Composer). Vite adds the extension and
    // resolves it fine.
    ssr: { noExternal: ["@gradeui/ui"] },
  },
});
