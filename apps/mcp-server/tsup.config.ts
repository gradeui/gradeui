import { defineConfig } from "tsup";

/**
 * Bundle the stdio MCP server to a single runnable dist/index.js.
 *
 * `@gradeui/studio` ships RAW .ts source (its package `main` points at
 * src/index.ts), so node can't import it directly — it MUST be bundled
 * here (esbuild transpiles its TS as it inlines it). Everything else stays
 * external and is resolved from the monorepo's node_modules at runtime:
 *   - @gradeui/ui/contracts → a built dist artifact (dist/contracts.mjs)
 *   - @supabase/supabase-js, @modelcontextprotocol/sdk, zod → real npm deps
 *
 * So the server runs from inside the repo (where node_modules exists). The
 * shebang banner makes dist/index.js directly executable as the `bin`.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node18",
  noExternal: ["@gradeui/studio"],
  // `@gradeui/studio`'s validator imports the full `typescript` compiler for
  // its JSX walker. Bundling TS inlines ~10MB AND breaks at runtime — TS uses
  // dynamic require(), which an ESM bundle can't satisfy ("Dynamic require not
  // supported"). Keep it (and the other CJS-ish runtime deps) external so node
  // resolves them from node_modules at runtime instead.
  external: ["typescript", "zod", "@supabase/supabase-js", "@gradeui/ui"],
  banner: { js: "#!/usr/bin/env node" },
  clean: true,
  sourcemap: true,
  dts: false,
});
