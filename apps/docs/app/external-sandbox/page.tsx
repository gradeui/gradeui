"use client";

/**
 * /external-sandbox — the FAST renderer for EXTERNAL design systems.
 *
 * Why this exists: Fast Frame precompiles only gradeui, and the Sandpack
 * parity renderer takes ~a minute to npm-install an external DS's tree
 * (and its iframe proved a black box for the v4 CSS pipeline). This page
 * is the third way, proven by the BrightLocal live probe: the DS is
 * fetched ONCE from esm.sh as a prebundled ES module (its React
 * externalized and mapped to this page's copy via an import map), the
 * screen source is sucrase-compiled in the browser, and the vendored
 * Tailwind v4 build compiles utilities against the registry's token CSS.
 * Cold boot is a few seconds; subsequent source updates re-render
 * near-instantly (modules cached, only the screen recompiles).
 *
 * Protocol (deliberately tiny, v0 + selection):
 *   parent → iframe: { type: "ext:source", source, mode, css? } — render this
 *                    (css = project overrides, upserted as the last <style>)
 *   parent → iframe: { type: "ext:select-mode", on }       — arm/disarm the selection agent
 *   parent → iframe: { type: "ext:clear-selection" }       — drop the persistent ring
 *   parent → iframe: { type: "grade:select-by-source-id", id } — breadcrumb
 *                    traversal (same name as Fast Frame so the path bar
 *                    doesn't branch on renderer)
 *   iframe → parent: { type: "ext:ready" }                 — send me source
 *   iframe → parent: { type: "ext:error", message }        — compile/render failed
 *   iframe → parent: { type: "ext:rendered" }              — paint done
 *   iframe → parent: { type: "ext:select", selection }     — SelectionPayload from the agent
 *   iframe → parent: { type: "ext:selection-cleared" }     — Escape inside the iframe
 *   iframe → parent: { type: "ext:zoom-gesture", factor }  — pinch/ctrl+wheel over the screen
 *   iframe → parent: { type: "ext:content-height", height }— rendered page height (share Fit)
 *
 * This page renders with ITS OWN React (esm.sh copy) inside the iframe —
 * fully isolated from the host app's React, so there's no double-React
 * hazard and no bundler coupling to the external package.
 */

import * as React from "react";
// The screen compiler — BUNDLED by Next from node_modules (^3.35.0 in
// apps/docs), not fetched from esm.sh at runtime: sucrase has no React
// coupling, and the CDN fetch was a prod-outage single point of failure
// ("Failed to fetch dynamically imported module: esm.sh/sucrase@3.35.1"
// on gradeui.com). Namespace import so the shape matches the old
// esm.sh module (`m.sucrase.transform`).
import * as sucraseModule from "sucrase";
import {
  externalTwCss,
  EXTERNAL_FONT_VARS_CSS,
  EXTERNAL_FONTS_URL,
} from "@/lib/external-ds-preview";
import { getActiveRegistry, getRegistryById } from "@/lib/active-registry";
import {
  installStudioSelectionAgent,
  type SelectionAgentHandle,
  type SelectionPayload,
} from "@/lib/studio-selection-agent";

// Which registry this iframe renders. This is a SEPARATE module
// instance from the parent window's — the per-project override can't
// reach us — so the host passes the registry id on the iframe URL
// (?registry=brightlocal). Resolved at effect start (window exists);
// the env default keeps standalone opens working. Module-scope `let`
// matches this page's single-instance style.
let REGISTRY = getActiveRegistry();
function resolveRegistryFromUrl(): void {
  const id = new URLSearchParams(window.location.search).get("registry");
  REGISTRY = getRegistryById(id) ?? getActiveRegistry();
}

/** esm.sh module URLs. React is pinned and shared via import map so the
 *  DS package (externalized) resolves the same instance. */
const ESM = {
  react: "https://esm.sh/react@19.0.0",
  jsx: "https://esm.sh/react@19.0.0/jsx-runtime",
  jsxDev: "https://esm.sh/react@19.0.0/jsx-dev-runtime",
  reactDom: "https://esm.sh/react-dom@19.0.0",
  reactDomClient: "https://esm.sh/react-dom@19.0.0/client",
  // sucrase is deliberately NOT here — it's bundled (see the static
  // import at the top). Note for the bundled version: >=3.35.1 needed;
  // the 3.35.0 parser rejects TS type arguments in call expressions.
};

function dsUrl(): string {
  const v = REGISTRY.package.version ? `@${REGISTRY.package.version}` : "";
  return `https://esm.sh/${REGISTRY.package.name}${v}?external=react,react-dom`;
}

/** Dynamic import via variable indirection. A LITERAL string inside
 *  import() is type-checked as a module specifier — `tsc` tries to
 *  resolve the https:// URL and fails the production build. Routing
 *  the URL through a parameter keeps the runtime behaviour identical
 *  while opting out of specifier resolution. */
const importUrl = (url: string): Promise<Record<string, unknown>> =>
  import(/* webpackIgnore: true */ url);

export default function ExternalSandboxPage() {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState("booting…");

  React.useEffect(() => {
    // FIRST: pin the registry from ?registry= — everything below
    // (dsUrl, companion deps, selection config, preview CSS) reads it.
    resolveRegistryFromUrl();
    let disposed = false;
    let reactRoot: { render: (n: unknown) => void; unmount: () => void } | null = null;
    let pendingSource: { source: string; mode: string } | null = null;
    let modules: Record<string, unknown> | null = null;
    let rendering = false;

    const post = (msg: Record<string, unknown>) => {
      try {
        window.parent.postMessage(msg, "*");
      } catch {
        /* standalone open — fine */
      }
    };

    /** Fallback namespace for a preview-vocab package that failed to
     *  load: any property access throws a named, actionable error, so a
     *  chart screen fails with "recharts failed to load — reload" while
     *  every non-chart screen renders untouched. */
    function unavailable(label: string): Record<string, unknown> {
      return new Proxy(
        {},
        {
          get(_t, k) {
            if (k === "then" || k === "__esModule" || k === "default") return undefined;
            throw new Error(
              `"${label}" failed to load from esm.sh — reload the preview to retry.`,
            );
          },
        },
      );
    }

    async function loadModules() {
      const [react, jsx, jsxDev, reactDom, reactDomClient, ds, lucide, motion, recharts, confetti, icons] =
        await Promise.all([
          importUrl(ESM.react),
          importUrl(ESM.jsx),
          importUrl(ESM.jsxDev),
          importUrl(ESM.reactDom),
          importUrl(ESM.reactDomClient),
          importUrl(dsUrl()),
          importUrl("https://esm.sh/lucide-react@0.475.0?external=react"),
          importUrl("https://esm.sh/motion@12.29.2/react?external=react"),
          // Preview-vocab packages the system prompt licenses (rules 6/6a).
          // BEST-EFFORT with a lazy-throwing fallback: these are only
          // needed by screens that actually chart/celebrate, but they
          // used to load as hard Promise.all members — one esm.sh flake
          // on recharts killed EVERY screen, chart or not ("Failed to
          // fetch dynamically imported module: esm.sh/recharts", July
          // 2026, a sidebar screen with zero charts). Failure now
          // resolves to a proxy that throws a named error only if the
          // screen actually touches the package.
          importUrl("https://esm.sh/recharts@3.7.0?external=react,react-dom").catch(
            () => unavailable("recharts"),
          ),
          importUrl("https://esm.sh/canvas-confetti@1.9.3").catch(
            () => unavailable("canvas-confetti"),
          ),
          // Companion packages (icons etc.) — best-effort; a DS without
          // them just resolves to an empty namespace.
          ...Object.keys(REGISTRY.runtime?.dependencies ?? {}).map((name) =>
            importUrl(
              `https://esm.sh/${name}@${REGISTRY.runtime!.dependencies![name]}?external=react,react-dom`
            ).catch(() => ({})),
          ),
        ]);
      // sucrase is BUNDLED (static import above), not esm.sh-fetched: it
      // has no React coupling, and a third-party CDN fetch for the
      // compiler took the whole renderer down in prod ("Failed to fetch
      // dynamically imported module: esm.sh/sucrase"). Only React + the
      // DS module + preview vocab stay external (isolation requires it).
      return { react, jsx, jsxDev, reactDom, reactDomClient, sucrase: sucraseModule, ds, lucide, motion, recharts, confetti, icons };
    }

    /** esm.sh fetches flake under parallel load (grid mounts a dozen
     *  iframes) — "Failed to fetch dynamically imported module" killed
     *  tiles permanently because the boot was one-shot. Retry with
     *  backoff; successes are HTTP-cached so retries are cheap. */
    async function loadModulesWithRetry() {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await loadModules();
        } catch (e) {
          lastErr = e;
          setStatus(`design system fetch failed — retrying (${attempt + 1}/3)…`);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
      throw lastErr;
    }

    /** Wrap a namespace so accessing a MISSING export throws a named
     *  error ("X has no export Y") instead of handing React `undefined`
     *  and dying with minified error #130 that names nothing. */
    function guarded(ns: Record<string, unknown>, label: string) {
      return new Proxy(ns, {
        get(t, k) {
          if (typeof k === "string" && !(k in t) && k !== "then" && k !== "__esModule" && k !== "default") {
            throw new Error(`"${label}" has no export "${k}" — check the import name`);
          }
          return (t as Record<string | symbol, unknown>)[k];
        },
      });
    }

    function makeRequire(m: NonNullable<typeof modules>) {
      const companions = Object.keys(REGISTRY.runtime?.dependencies ?? {});
      return (p: string): unknown => {
        if (p === "react") return m.react;
        if (p === "react/jsx-runtime") return m.jsx;
        if (p === "react/jsx-dev-runtime") return m.jsxDev;
        if (p === "react-dom") return m.reactDom;
        if (p === "react-dom/client") return m.reactDomClient;
        if (p === "lucide-react") return guarded(m.lucide as never, "lucide-react");
        if (p === "motion" || p === "motion/react") return m.motion;
        if (p === "recharts") return m.recharts;
        if (p === "canvas-confetti") return m.confetti;
        if (p === REGISTRY.package.name || p.startsWith(`${REGISTRY.package.name}/`)) return guarded(m.ds as never, REGISTRY.package.name);
        const companion = companions.find((c) => p === c || p.startsWith(`${c}/`));
        if (companion) return guarded((m.icons ?? {}) as never, companion);
        if (p.endsWith(".css")) return {};
        throw new Error(`external-sandbox: unknown module "${p}"`);
      };
    }

    // The DOM node the react root was created on. Tracked so a render
    // can detect DETACHMENT: Next's hydration re-render (or HMR) can
    // replace the page tree AFTER our effect captured rootRef — the DS
    // then renders into an orphaned div and the screen looks blank
    // while ext:rendered still fires. The screen mount races this more
    // often than the lazy grid previews (it pushes at ext:ready).
    let rootHost: HTMLElement | null = null;
    async function render(source: string, mode: string) {
      if (disposed || !modules) return;
      if (rendering) {
        pendingSource = { source, mode };
        return;
      }
      rendering = true;
      try {
        document.documentElement.classList.toggle("dark", mode === "dark");
        const m = modules as Record<string, any>;
        const { code } = m.sucrase.transform(source, {
          transforms: ["typescript", "jsx", "imports"],
          production: true,
        });
        const mod = { exports: {} as Record<string, unknown> };
        // React rides as an AMBIENT parameter, not just via require:
        // sucrase compiles JSX to React.createElement, and screens that
        // never `import React` (templates, model output) would otherwise
        // throw "React is not defined" — asynchronously, inside React's
        // concurrent render, so our try/catch never saw it and the
        // screen just looked blank while ext:rendered still fired.
        new Function("module", "exports", "require", "React", code)(
          mod,
          mod.exports,
          makeRequire(m as never),
          m.react,
        );
        const App = (mod.exports.default ?? Object.values(mod.exports)[0]) as unknown;
        if (typeof App !== "function") throw new Error("screen has no component export");
        // Re-anchor if our container left the document (see rootHost).
        let host = rootRef.current;
        if (!host || !host.isConnected) {
          // Cast matches rootRef's element type — createRoot only needs
          // a container, but `host` is typed by the ref it re-anchors.
          host = document.getElementById("root") as HTMLDivElement | null;
        }
        if (!host) throw new Error("render root missing from document");
        if (reactRoot && rootHost !== host) {
          try {
            reactRoot.unmount();
          } catch {
            /* stale root — nothing to unmount into */
          }
          reactRoot = null;
        }
        if (!reactRoot) {
          reactRoot = m.reactDomClient.createRoot(host);
          rootHost = host;
        }
        reactRoot!.render(m.react.createElement(App));
        setStatus("");
        post({ type: "ext:rendered" });
        // Paint settles a frame later — report the fresh height then.
        requestAnimationFrame(() =>
          post({
            type: "ext:content-height",
            height: Math.ceil(document.documentElement.scrollHeight),
          }),
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        setStatus(`render error: ${message}`);
        post({ type: "ext:error", message });
      } finally {
        rendering = false;
        if (pendingSource) {
          const next = pendingSource;
          pendingSource = null;
          void render(next.source, next.mode);
        }
      }
    }

    // Select mode — the REAL Studio selection agent, same module Fast
    // Frame and Sandpack run (two-agent rule → three renderers, one
    // agent). Full parity: hover ring, persistent ring with corner
    // handles + dimension badge, activation suppression, Escape-to-
    // clear, sibling outlines. The registry seams are parameters:
    // the part attribute (BrightLocal: data-slot — their components
    // stamp kebab-case COMPONENT names shadcn-style, so the agent's
    // default kebab→Pascal resolves directly), the instance-label
    // attribute (data-hook — surfaces as the display name in the
    // breadcrumb/path bar), and — only for registries whose parts name
    // INSTANCES (no nameAttribute declared) — a suffix-map resolver.
    let agent: SelectionAgentHandle | null = null;
    // Standalone-preview storage listener (registered after module
    // load if a #screen= key is present) — held here for cleanup.
    let onStandaloneStorage: ((e: StorageEvent) => void) | null = null;
    const suffixMap = REGISTRY.selection.partSuffixMap ?? {};
    const suffixes = Object.keys(suffixMap).sort((a, b) => b.length - a.length);
    const resolveComponentName = (part: string): string | undefined => {
      const sfx = suffixes.find((x) => part === x || part.endsWith(`-${x}`));
      return sfx ? suffixMap[sfx] : undefined;
    };
    // When the registry declares a nameAttribute, its partAttribute
    // values are component-shaped (data-slot) — the suffix resolver
    // would only misfire on them ("card-header" has no suffix entry →
    // unknown). Legacy instance-named parts keep the resolver.
    const partsAreComponents = Boolean(REGISTRY.selection.nameAttribute);
    const installAgent = () => {
      if (agent) return;
      agent = installStudioSelectionAgent({
        root: document,
        overlayHost: document.body,
        partAttribute: REGISTRY.selection.partAttribute,
        nameAttribute: REGISTRY.selection.nameAttribute,
        resolveComponentName: partsAreComponents
          ? undefined
          : resolveComponentName,
        reportSelected: (selection: SelectionPayload) =>
          post({ type: "ext:select", selection }),
        reportCleared: () => post({ type: "ext:selection-cleared" }),
      });
    };
    const teardownAgent = () => {
      agent?.teardown();
      agent = null;
    };

    // Project CSS overrides — upserted as the LAST <style> in <head> on
    // every source push, so project-level patches (e.g. `:root {
    // --sidebar-width: 264px; }` or `[data-slot="sidebar-container"] {
    // width: 264px !important; }`) win the cascade over the registry's
    // token CSS injected at bootstrap below. Cheap to re-set; removed
    // content clears cleanly (empty string).
    const applyProjectCss = (css: string) => {
      let el = document.querySelector(
        "style[data-grade-project-css]",
      ) as HTMLStyleElement | null;
      if (!el) {
        el = document.createElement("style");
        el.setAttribute("data-grade-project-css", "");
        document.head.appendChild(el);
      } else if (el !== document.head.lastElementChild) {
        document.head.appendChild(el); // keep it LAST as other styles land
      }
      if (el.textContent !== css) el.textContent = css;
    };

    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; source?: string; mode?: string; on?: boolean; css?: string; id?: string } | null;
      if (d?.type === "ext:source" && typeof d.source === "string") {
        if (typeof d.css === "string") applyProjectCss(d.css);
        void render(d.source, d.mode ?? "light");
      } else if (d?.type === "ext:select-mode") {
        if (d.on) installAgent();
        else teardownAgent();
      } else if (d?.type === "ext:clear-selection") {
        agent?.clear();
      } else if (d?.type === "grade:select-by-source-id") {
        // Breadcrumb / path-bar traversal — the parent asks us to
        // re-select an ancestor by its data-gds-source-id. Fast Frame
        // has handled this since the path bar shipped; the external
        // renderer silently dropped it (two-renderer parity miss —
        // "can't traverse up the breadcrumbs"). Same shape: the agent
        // runs its standard resolve heuristics and emits a fresh
        // selection back through ext:select.
        if (typeof d.id === "string" && d.id) {
          agent?.selectBySourceId(d.id);
        }
      }
    };
    window.addEventListener("message", onMessage);

    // Pinch / ctrl+wheel over the screen — the parent owns the camera,
    // so forward the gesture out (the fast sandbox's grade:zoom-gesture
    // pattern). Same math as useZoomGestures: exponential mapping,
    // multiplicative factors coalesced to one post per frame.
    let zoomAcc = 1;
    let zoomRaf: number | null = null;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault(); // stop the browser's own page zoom
      zoomAcc *= Math.exp(-e.deltaY * 0.01);
      if (zoomRaf === null) {
        zoomRaf = requestAnimationFrame(() => {
          zoomRaf = null;
          const factor = zoomAcc;
          zoomAcc = 1;
          if (factor !== 1) post({ type: "ext:zoom-gesture", factor });
        });
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    // Content-height reporting — the share view's responsive artboard
    // frames the WHOLE page (like the fast sandbox's onContentHeight).
    // ResizeObserver on <body> catches reflows (fonts, images, source
    // updates); dedupe so observer chatter doesn't spam the parent.
    let lastReportedH = 0;
    const reportHeight = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      if (h > 0 && h !== lastReportedH) {
        lastReportedH = h;
        post({ type: "ext:content-height", height: h });
      }
    };
    const heightRo = new ResizeObserver(reportHeight);
    heightRo.observe(document.body);

    // Import map FIRST — the DS module is fetched with
    // ?external=react,react-dom, so its bare "react" imports need a map
    // pinning them to the same esm.sh copy this page renders with.
    // Injected before any dynamic import below touches those
    // specifiers (Chrome supports multiple/late import maps as long as
    // the specifier hasn't been resolved yet).
    if (!document.querySelector('script[data-grade-external-importmap]')) {
      const im = document.createElement("script");
      im.type = "importmap";
      im.setAttribute("data-grade-external-importmap", "");
      im.textContent = JSON.stringify({
        imports: {
          react: ESM.react,
          "react/jsx-runtime": ESM.jsx,
          "react/jsx-dev-runtime": ESM.jsxDev,
          "react-dom": ESM.reactDom,
          "react-dom/client": ESM.reactDomClient,
        },
      });
      document.head.appendChild(im);
    }

    // Style bootstrap — token CSS, the v4 source sheet, fonts, and the
    // vendored (same-origin) v4 compiler, in that order.
    const plain = document.createElement("style");
    plain.textContent = `${REGISTRY.runtime?.previewCss ?? ""}\n:root {\n${EXTERNAL_FONT_VARS_CSS}\n}\nbody { background: var(--background); color: var(--foreground); font-family: var(--font-sans, system-ui, sans-serif); margin: 0; }`;
    document.head.appendChild(plain);
    const tw = document.createElement("style");
    tw.setAttribute("type", "text/tailwindcss");
    tw.textContent = externalTwCss(REGISTRY.runtime?.previewThemeCss);
    document.head.appendChild(tw);
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = EXTERNAL_FONTS_URL;
    document.head.appendChild(fonts);
    const twScript = document.createElement("script");
    twScript.src = "/vendor/tailwindcss-browser-4.3.0.js";
    document.head.appendChild(twScript);

    setStatus("loading design system…");
    /** GRID CONCURRENCY GUARD: the project grid mounts many of these
     *  iframes at once and they all race esm.sh for the same uncached
     *  DS module — parallel first-fetches flake ("Failed to fetch
     *  dynamically imported module: …ui-components…", July 2026, on
     *  localhost AND live) while a single screen loads fine. Same-origin
     *  frames share the Web Locks API, so serialize the boot: the first
     *  frame warms the HTTP cache, the rest reuse it near-instantly.
     *  No-op where Web Locks is unavailable. */
    const loadModulesSerialized = (): Promise<Awaited<ReturnType<typeof loadModules>>> =>
      typeof navigator !== "undefined" && navigator.locks?.request
        ? (navigator.locks.request(
            "grade-ext-module-boot",
            () => loadModulesWithRetry(),
          ) as Promise<Awaited<ReturnType<typeof loadModules>>>)
        : loadModulesWithRetry();

    void loadModulesSerialized().then((m) => {
      if (disposed) return;
      modules = m as never;
      setStatus("ready — waiting for source");
      post({ type: "ext:ready" });
      // Standalone-preview handoff — parity with /fast-sandbox. Studio's
      // "Open preview in new tab" writes `{ source, name }` JSON under a
      // `grade:screen:<id>` localStorage key and opens `#screen=<key>`;
      // we render from that record (no parent iframe required), set the
      // tab title, and live-update via `storage` events as the Studio
      // canvas keeps writing. The older `?screen=<bare-id>` debug form
      // still works.
      const hashMatch = window.location.hash.match(/[#&]screen=([^&]+)/);
      const queryId = new URLSearchParams(window.location.search).get("screen");
      const screenKey = hashMatch
        ? decodeURIComponent(hashMatch[1])
        : queryId
          ? `grade:screen:${queryId}`
          : null;
      if (screenKey) {
        const applyScreenPayload = (raw: string | null) => {
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw) as { source?: string; name?: string; css?: string };
            // Project CSS overrides ride the standalone payload too —
            // apply BEFORE render so first paint already has them.
            if (typeof parsed.css === "string") applyProjectCss(parsed.css);
            if (typeof parsed.source === "string") void render(parsed.source, "light");
            if (typeof parsed.name === "string") {
              const title = `${parsed.name} - Preview - Grade`;
              document.title = title;
              // Next's metadata pass re-applies the default title after
              // this effect on first mount — defer a frame so ours wins.
              requestAnimationFrame(() => {
                document.title = title;
              });
            }
          } catch {
            /* corrupt record — leave the empty preview */
          }
        };
        try {
          applyScreenPayload(window.localStorage.getItem(screenKey));
        } catch {
          /* storage disabled */
        }
        onStandaloneStorage = (e: StorageEvent) => {
          if (e.key !== screenKey || e.newValue == null) return;
          applyScreenPayload(e.newValue);
        };
        window.addEventListener("storage", onStandaloneStorage);
      }
    }).catch((e) => {
      setStatus(`module load failed: ${e instanceof Error ? e.message : e}`);
      post({ type: "ext:error", message: String(e) });
    });

    return () => {
      disposed = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("wheel", onWheel);
      if (onStandaloneStorage)
        window.removeEventListener("storage", onStandaloneStorage);
      if (zoomRaf !== null) cancelAnimationFrame(zoomRaf);
      heightRo.disconnect();
      teardownAgent();
      reactRoot?.unmount();
      plain.remove();
      tw.remove();
      fonts.remove();
      twScript.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Hide Next's dev-overlay badge inside this RENDERER document —
          it stamps an "N issues" circle onto every preview tile (the
          hydration noise belongs to the rendered SCREEN, and our own
          error strip / snag UI is the surface for that). Dev-only
          element; no-op in production builds. */}
      <style>{`nextjs-portal { display: none !important; }`}</style>
      <div ref={rootRef} id="root" />
      {status ? (
        <div
          style={{
            position: "fixed",
            bottom: 6,
            right: 10,
            font: "11px ui-monospace, monospace",
            color: "#888",
            zIndex: 2147483647,
          }}
        >
          {status}
        </div>
      ) : null}
    </>
  );
}
