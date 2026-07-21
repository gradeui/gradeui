/**
 * BrightLocal vocabulary for the MCP App View — the "shared demo" fix.
 *
 * The MCP preview is a fully-inlined bundle (MCP Apps CSP: connect-src
 * 'none'), so the esm.sh path /external-sandbox uses for external design
 * systems can never work inside it — a brightlocal screen died with
 * "esm.sh failed to load @brightlocal/ui-components". This module bundles
 * the same vocabulary STATICALLY, mirroring external-sandbox's recipe:
 *
 *   1. The DS npm packages (@brightlocal/ui-components 2.20.0 +
 *      @brightlocal/icons 2.3.1 — devDeps of apps/docs, view-bundle-only)
 *      imported statically, sharing the bundle's single React via
 *      build-view.mjs's react alias.
 *   2. The registry lib modules (@brightlocal/proposal + friends) compiled
 *      lazily from BRIGHTLOCAL_REGISTRY.runtime.libModules source strings
 *      with the same sucrase pipeline as screens (compileModule), cached,
 *      cycle-guarded — the exact shape of external-sandbox's requireLib.
 *   3. CSS at activation: the registry token CSS (runtime.previewCss) +
 *      the Tailwind v4 SOURCE (externalTwCss over runtime.previewThemeCss)
 *      compiled by the SAME vendored Tailwind browser build
 *      external-sandbox uses — inlined into this bundle as text
 *      (virtual:tailwind-browser) and eval'd on first activation. No
 *      Workers, no network: CSP-clean.
 *
 * Import this module for its side effect (registers the resolver seam in
 * studio-render-core); call activateBrightlocalCss() when a brightlocal
 * screen is about to render.
 */

import * as BrightlocalUi from "@brightlocal/ui-components";
import * as BrightlocalIcons from "@brightlocal/icons";
import { BRIGHTLOCAL_REGISTRY } from "@gradeui/studio/registry";
import { externalTwCss } from "@/lib/external-ds-preview";
import {
  compileModule,
  registerImportResolver,
  resolveImport,
} from "@/lib/studio-render-core";
// The vendored Tailwind v4 browser build as TEXT (esbuild plugin in
// build-view.mjs) — same file external-sandbox loads from /vendor.
import tailwindBrowserSource from "virtual:tailwind-browser";

const DS_PKG = BRIGHTLOCAL_REGISTRY.package.name; // "@brightlocal/ui-components"
const ICONS_PKG = "@brightlocal/icons";
const LIB_MODULES: Readonly<Record<string, string>> =
  BRIGHTLOCAL_REGISTRY.runtime?.libModules ?? {};

// ─── Lib modules (lazy compile, cached, cycle-guarded) ─────────────────

const libCache = new Map<string, Record<string, unknown>>();

function requireLib(spec: string, seen: Set<string>): Record<string, unknown> {
  const cached = libCache.get(spec);
  if (cached) return cached;
  if (seen.has(spec)) throw new Error(`brightlocal lib module cycle at "${spec}"`);
  seen.add(spec);
  const source = LIB_MODULES[spec];
  if (source === undefined)
    throw new Error(`brightlocal vocab: unknown lib module "${spec}"`);
  const exports = compileModule(source, makeResolver(seen));
  libCache.set(spec, exports);
  return exports;
}

/** Resolver used INSIDE lib-module compilation: answers the brightlocal
 *  specifiers directly (threading the cycle guard through nested lib
 *  imports — the core's extension path would lose the seen-set), and
 *  delegates everything else (react, lucide-react, …) to the core's
 *  resolveImport. */
function makeResolver(seen: Set<string>): (path: string) => unknown {
  return (path: string): unknown => {
    const hit = resolveBrightlocal(path, seen);
    if (hit !== undefined) return hit;
    return resolveImport(path);
  };
}

function resolveBrightlocal(
  path: string,
  seen: Set<string> = new Set(),
): unknown {
  if (path === DS_PKG || path.startsWith(`${DS_PKG}/`)) return BrightlocalUi;
  if (path === ICONS_PKG || path.startsWith(`${ICONS_PKG}/`))
    return BrightlocalIcons;
  if (path in LIB_MODULES) return requireLib(path, seen);
  return undefined;
}

registerImportResolver({
  knows: (spec) =>
    spec === DS_PKG ||
    spec.startsWith(`${DS_PKG}/`) ||
    spec === ICONS_PKG ||
    spec.startsWith(`${ICONS_PKG}/`) ||
    spec in LIB_MODULES,
  resolve: (spec) => {
    const hit = resolveBrightlocal(spec);
    if (hit === undefined)
      throw new Error(`brightlocal vocab: unresolvable "${spec}"`);
    return hit;
  },
});

// ─── Detection + CSS activation ────────────────────────────────────────

/** A screen belongs to the brightlocal registry iff it imports from the
 *  "@brightlocal/" scope — the same signal the import rewriters use. */
export function isBrightlocalSource(source: string): boolean {
  return /from\s*["']@brightlocal\//.test(source);
}

let cssActivated = false;

/** Inject the brightlocal CSS stack (idempotent):
 *  1. token CSS (runtime.previewCss — the DS's own :root variables),
 *  2. the Tailwind v4 source as <style type="text/tailwindcss">,
 *  3. the vendored Tailwind browser build, eval'd once — it compiles the
 *     source against the live DOM and keeps watching via
 *     MutationObserver, exactly as on /external-sandbox. */
export function activateBrightlocalCss(): void {
  if (cssActivated) return;
  cssActivated = true;

  const tokens = document.createElement("style");
  tokens.id = "bl-tokens";
  tokens.textContent = BRIGHTLOCAL_REGISTRY.runtime?.previewCss ?? "";
  document.head.appendChild(tokens);

  const twSource = document.createElement("style");
  twSource.id = "bl-tw-source";
  twSource.setAttribute("type", "text/tailwindcss");
  twSource.textContent = externalTwCss(
    BRIGHTLOCAL_REGISTRY.runtime?.previewThemeCss,
  );
  document.head.appendChild(twSource);

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(tailwindBrowserSource)();
  } catch (err) {
    // Utilities missing but components still render — surface loudly.
    // eslint-disable-next-line no-console
    console.error("[brightlocal-vocab] tailwind browser build failed:", err);
  }
}
