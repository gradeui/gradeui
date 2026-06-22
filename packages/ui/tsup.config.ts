import { defineConfig, type Options } from "tsup";

/*
 * ─────────────────────────────────────────────────────────────────────
 *  Two-config split — client entries vs. server-safe entries.
 *
 *  Why two configs:
 *  ────────────────
 *  The main `./` entry (lib/index.ts) bundles every React component in
 *  the design system, including every hook usage (useRef, useEffect,
 *  useState, useContext, …). Next.js 13+ App Router treats anything
 *  using those hooks as a Client Component, and refuses to compile a
 *  bundle that uses them without a top-of-file `"use client"`
 *  directive.
 *
 *  We can't just put `"use client"` at the top of `lib/index.ts`
 *  because `minify: true` rewrites the bundle and esbuild's minifier
 *  treats a bare top-of-file string literal as a useless expression
 *  statement and DROPS IT. (Verified May 2026 — that's exactly the
 *  bug that broke consume-app's build.)
 *
 *  The reliable fix is `banner: { js: '"use client";' }`: tsup hands
 *  the banner straight to esbuild, which appends it to the output AFTER
 *  minification, so it survives untouched.
 *
 *  But banner applies to every entry in the config — and we don't want
 *  it on the server-safe entries (`contracts`).
 *  Marking those `"use client"` would re-export them as client modules,
 *  which defeats the whole purpose of having `@gradeui/ui/contracts`
 *  as a Zod-only subpath consumable from Server Components, API routes,
 *  the Edge runtime, and MCP servers.
 *
 *  Hence: two configs. tsup runs both as separate esbuild builds and
 *  writes them into the same dist/ directory.
 * ─────────────────────────────────────────────────────────────────────
 */

const sharedOptions = {
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
    "leaflet",
  ],
  // Bundle @gradeui/contracts inline. The contracts package is
  // `"private": true` and never publishes to npm, so anything
  // consuming @gradeui/ui from outside the monorepo would otherwise
  // hit "Cannot find package '@gradeui/contracts'". Inlining it
  // (~80KB) makes the published bundle self-contained. The contracts
  // package stays in @gradeui/ui's devDependencies so pnpm still
  // links it at build time inside the workspace.
  noExternal: [
    "@gradeui/contracts",
    // Force-bundle lexical-beautiful-mentions. Its published ESM uses
    // extensionless re-exports (`export * from "./BeautifulMentionsPlugin"`)
    // which strict ESM resolvers (Vite SSR, Astro, @tailwindcss/node, plain
    // Node) reject — only webpack-style lenient resolvers tolerate them. If we
    // externalize it (the tsup default for dependencies), that broken
    // resolution is pushed onto every consumer of @gradeui/ui, so a downstream
    // app importing even <Section> from the barrel crashes. Inlining it here
    // lets esbuild add the extensions at OUR build time, so the published
    // bundle is self-contained and resolves cleanly everywhere.
    "lexical-beautiful-mentions",
  ],
  treeshake: true,
  minify: true,
} as const satisfies Partial<Options>;

export default defineConfig([
  // ── Client config ──────────────────────────────────────────────────
  //
  // Every entry that ends up shipping React components / hooks lives
  // here. The `"use client"` directive is injected via `onSuccess`
  // AFTER tsup finishes — esbuild's bundler refuses to honour a
  // module-level "use client" inside a bundle (warns "Module level
  // directives cause errors when bundled" and strips them), so the
  // `banner` option doesn't work for this. Post-processing the
  // emitted file on disk is the only reliable path.
  //
  // The map adapters use browser-only APIs (document, window,
  // dynamically-imported map SDKs) — even though the adapter modules
  // themselves don't call React hooks, anyone importing them from a
  // Server Component would crash on the browser-API references. Safer
  // to ship them as client modules too.
  {
    ...sharedOptions,
    entry: {
      index: "lib/index.ts",
      "map/maplibre": "components/ui/map/adapters/maplibre.ts",
      "map/mapbox": "components/ui/map/adapters/mapbox.ts",
      "map/google": "components/ui/map/adapters/google.ts",
      "map/leaflet": "components/ui/map/adapters/leaflet.ts",
    },
    async onSuccess() {
      const fs = await import("node:fs/promises");
      const CLIENT_FILES = [
        "dist/index.mjs",
        "dist/index.js",
        "dist/map/maplibre.mjs",
        "dist/map/maplibre.js",
        "dist/map/mapbox.mjs",
        "dist/map/mapbox.js",
        "dist/map/google.mjs",
        "dist/map/google.js",
        "dist/map/leaflet.mjs",
        "dist/map/leaflet.js",
      ];
      const DIRECTIVE = '"use client";\n';
      for (const file of CLIENT_FILES) {
        try {
          const content = await fs.readFile(file, "utf8");
          if (!content.startsWith(DIRECTIVE.trim())) {
            await fs.writeFile(file, DIRECTIVE + content);
          }
        } catch (err) {
          // File missing — fine if a sub-entry didn't emit (e.g. during
          // partial dev builds). Re-throw anything else.
          if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
        }
      }
    },
  },

  // ── Server-safe config ─────────────────────────────────────────────
  //
  // These entries MUST be importable from Server Components, API
  // routes, the Edge runtime, MCP servers, and CLIs. They contain
  // only Zod schemas, plain config objects, and pure data — no React,
  // no DOM, no `"use client"`.
  //
  // - `contracts` → `@gradeui/ui/contracts` — typed component registry
  //
  // (`tailwind-preset` was retired in the Tailwind v4 native-@theme
  //  migration — THEME-MIGRATION.md Phase A. Consumers now get the full
  //  theme from `@gradeui/ui/styles.css`; there is no JS config to
  //  extend.)
  {
    ...sharedOptions,
    entry: {
      contracts: "lib/contracts.ts",
    },
  },
]);
