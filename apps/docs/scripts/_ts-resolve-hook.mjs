/**
 * Minimal ESM resolver hook so `node --experimental-strip-types` can run the
 * theme TS sources directly.
 *
 * The repo's TS uses extensionless relative imports ("./oklch") and a few
 * package imports ("@gradeui/core"). Node's strict ESM resolver wants
 * explicit extensions, so this hook appends ".ts" to relative imports that
 * resolve to a .ts file on disk. Package imports fall through to Node's
 * default resolver (which finds @gradeui/core via node_modules).
 *
 * This is dev-only tooling for themes-to-figma.mjs — it does not change any
 * library behaviour, it only lets the existing TS run under bare Node in an
 * environment where the platform-specific esbuild/tsx binary is unavailable.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[mc]?[jt]sx?$/.test(specifier)) {
    const parentPath = context.parentURL
      ? dirname(fileURLToPath(context.parentURL))
      : process.cwd();
    for (const ext of [".ts", ".tsx", ".mts"]) {
      const candidate = pathResolve(parentPath, specifier + ext);
      if (existsSync(candidate)) {
        return nextResolve(pathToFileURL(candidate).href, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
