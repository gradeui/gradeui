/**
 * Builds the MCP App preview View into a single self-contained HTML and
 * emits it as a TS module the MCP server bundles
 * (apps/mcp-server/src/preview-view-html.ts).
 *
 * One renderer: this View imports the shared core (@/lib/studio-render-core),
 * the same vocabulary + sucrase compile Studio's fast-sandbox uses.
 *
 * Output is fully inlined (no runtime network) because the MCP Apps default
 * CSP is connect-src 'none'. CSS = the canonical compiled Tailwind (the same
 * globals.css fast-sandbox/embed use) + the @gradeui/ui component styles.
 *
 * Run: `pnpm -F @gradeui/docs build:preview-view`
 * Requires devDeps in apps/docs: esbuild, @tailwindcss/cli,
 * @modelcontextprotocol/ext-apps.
 */

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url)); // apps/docs/preview-view
const docs = path.resolve(here, ".."); // apps/docs
const repoRoot = path.resolve(docs, "..", ".."); // repo root
const distDir = path.join(here, "dist");
fs.mkdirSync(distDir, { recursive: true });

// 1. Compile the canonical Tailwind CSS (the same globals.css the Next routes
//    use), so utilities + the safelist match every other renderer.
//    Execute the .bin shim directly — it's a shell script with a shebang, so
//    it must NOT be passed to `node` (that's the "missing ) after argument
//    list" error). Running it directly lets its shebang dispatch to node.
const twBin = path.join(docs, "node_modules", ".bin", "tailwindcss");
execFileSync(
  twBin,
  [
    "-i",
    path.join(docs, "app", "globals.css"),
    "-o",
    path.join(distDir, "full.css"),
    "--minify",
  ],
  { cwd: docs, stdio: "inherit" },
);

// 2. Bundle the View. Alias react/react-dom to a single copy so the SDK's
//    hooks share React with the render tree.
const esbuild = require("esbuild");
const reactDir = path.dirname(require.resolve("react"));
const reactDomDir = path.dirname(require.resolve("react-dom"));
await esbuild.build({
  entryPoints: [path.join(here, "view.tsx")],
  bundle: true,
  format: "iife",
  outfile: path.join(distDir, "bundle.js"),
  alias: {
    "@": docs,
    react: reactDir,
    "react-dom": reactDomDir,
    // The sandbox CSP blocks maplibre's Web Worker, so the View forces
    // Grade's <Map> onto the worker-free Leaflet adapter. The maplibre /
    // mapbox / google adapters are reachable but never called — alias their
    // SDKs to an empty stub so ~800KB of dead code isn't bundled. (Can't use
    // esbuild `external` here: a dynamic import() of an external isn't
    // allowed in the single-file iife format.) Leaflet IS bundled.
    "maplibre-gl": path.join(here, "empty-map-sdk.js"),
    "mapbox-gl": path.join(here, "empty-map-sdk.js"),
    "@googlemaps/js-api-loader": path.join(here, "empty-map-sdk.js"),
  },
  jsx: "automatic",
  // Inline images (Leaflet's CSS references marker/layer PNGs) as data URIs
  // so the bundle stays self-contained — no external image fetches, which
  // the sandbox would block anyway.
  loader: {
    ".css": "css",
    ".png": "dataurl",
    ".svg": "dataurl",
    ".gif": "dataurl",
  },
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  logLevel: "warning",
  plugins: [
    // virtual:tailwind-browser → the vendored Tailwind v4 browser build as
    // TEXT. brightlocal-vocab evals it at activation to JIT-compile the
    // registry's utilities in-sandbox (CSP blocks the CDN route external-
    // sandbox's sibling page uses same-origin). Keep the vendored file in
    // lockstep with /external-sandbox — same compiler, same output.
    {
      name: "virtual-tailwind-browser",
      setup(build) {
        build.onResolve({ filter: /^virtual:tailwind-browser$/ }, () => ({
          path: "tailwind-browser",
          namespace: "virtual-text",
        }));
        build.onLoad({ filter: /.*/, namespace: "virtual-text" }, () => ({
          contents: fs.readFileSync(
            path.join(docs, "public", "vendor", "tailwindcss-browser-4.3.0.js"),
            "utf8",
          ),
          loader: "text",
        }));
      },
    },
  ],
});

// 3. Assemble one self-contained HTML document.
const full = fs.readFileSync(path.join(distDir, "full.css"), "utf8");
const comp = fs.readFileSync(path.join(distDir, "bundle.css"), "utf8");
const js = fs.readFileSync(path.join(distDir, "bundle.js"), "utf8");
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>Grade Preview</title><style>${full}</style><style>${comp}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
fs.writeFileSync(path.join(distDir, "mcp-view.html"), html);

// 4. Emit as a TS module the MCP server bundles.
const ts = `// AUTO-GENERATED by apps/docs/preview-view/build-view.mjs — do not edit by hand.\n/* eslint-disable */\nexport const PREVIEW_VIEW_URI = "ui://gradeui-mcp/preview-inline-v1";\nexport const PREVIEW_VIEW_HTML = ${JSON.stringify(html)};\n`;
fs.writeFileSync(
  path.join(repoRoot, "apps", "mcp-server", "src", "preview-view-html.ts"),
  ts,
);

console.log(
  `Built MCP preview view → preview-view/dist/mcp-view.html + apps/mcp-server/src/preview-view-html.ts (${(
    html.length /
    1048576
  ).toFixed(2)} MB)`,
);
