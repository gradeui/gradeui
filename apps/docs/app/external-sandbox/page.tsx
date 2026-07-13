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
 *   parent → iframe: { type: "ext:source", source, mode }  — render this
 *   parent → iframe: { type: "ext:select-mode", on }       — arm/disarm the selection agent
 *   parent → iframe: { type: "ext:clear-selection" }       — drop the persistent ring
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
  // 3.35.1, NOT .0 — the .0 parser rejects TS type arguments in call
  // expressions ("useState<Date | undefined>(...)" → Unexpected token),
  // which sidecar example preludes hit. Matches apps/docs' local pin.
  sucrase: "https://esm.sh/sucrase@3.35.1",
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

    async function loadModules() {
      const [react, jsx, jsxDev, reactDom, reactDomClient, sucrase, ds, lucide, motion, recharts, confetti, icons] =
        await Promise.all([
          importUrl(ESM.react),
          importUrl(ESM.jsx),
          importUrl(ESM.jsxDev),
          importUrl(ESM.reactDom),
          importUrl(ESM.reactDomClient),
          importUrl(ESM.sucrase),
          importUrl(dsUrl()),
          importUrl("https://esm.sh/lucide-react@0.475.0?external=react"),
          importUrl("https://esm.sh/motion@12.29.2/react?external=react"),
          // Preview-vocab packages the system prompt licenses (rules 6/6a).
          importUrl("https://esm.sh/recharts@3.7.0?external=react,react-dom"),
          importUrl("https://esm.sh/canvas-confetti@1.9.3"),
          // Companion packages (icons etc.) — best-effort; a DS without
          // them just resolves to an empty namespace.
          ...Object.keys(REGISTRY.runtime?.dependencies ?? {}).map((name) =>
            importUrl(
              `https://esm.sh/${name}@${REGISTRY.runtime!.dependencies![name]}?external=react,react-dom`
            ).catch(() => ({})),
          ),
        ]);
      return { react, jsx, jsxDev, reactDom, reactDomClient, sucrase, ds, lucide, motion, recharts, confetti, icons };
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
        new Function("module", "exports", "require", code)(mod, mod.exports, makeRequire(m as never));
        const App = (mod.exports.default ?? Object.values(mod.exports)[0]) as unknown;
        if (typeof App !== "function") throw new Error("screen has no component export");
        if (!reactRoot) {
          reactRoot = m.reactDomClient.createRoot(rootRef.current!);
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
    // clear, sibling outlines. The two registry seams are parameters:
    // the part attribute (BrightLocal: data-hook) and component-name
    // resolution (their hooks name INSTANCES — "settings-save-button"
    // — so the suffix map turns them into component names; unmatched
    // parts fall back to the agent's kebab→Pascal).
    let agent: SelectionAgentHandle | null = null;
    const suffixMap = REGISTRY.selection.partSuffixMap ?? {};
    const suffixes = Object.keys(suffixMap).sort((a, b) => b.length - a.length);
    const resolveComponentName = (part: string): string | undefined => {
      const sfx = suffixes.find((x) => part === x || part.endsWith(`-${x}`));
      return sfx ? suffixMap[sfx] : undefined;
    };
    const installAgent = () => {
      if (agent) return;
      agent = installStudioSelectionAgent({
        root: document,
        overlayHost: document.body,
        partAttribute: REGISTRY.selection.partAttribute,
        resolveComponentName,
        reportSelected: (selection: SelectionPayload) =>
          post({ type: "ext:select", selection }),
        reportCleared: () => post({ type: "ext:selection-cleared" }),
      });
    };
    const teardownAgent = () => {
      agent?.teardown();
      agent = null;
    };

    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; source?: string; mode?: string; on?: boolean } | null;
      if (d?.type === "ext:source" && typeof d.source === "string") {
        void render(d.source, d.mode ?? "light");
      } else if (d?.type === "ext:select-mode") {
        if (d.on) installAgent();
        else teardownAgent();
      } else if (d?.type === "ext:clear-selection") {
        agent?.clear();
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
    void loadModules().then((m) => {
      if (disposed) return;
      modules = m as never;
      setStatus("ready — waiting for source");
      post({ type: "ext:ready" });
      // Standalone/debug path: ?screen=<id> renders straight from the
      // Studio localStorage record, no parent required.
      const screenId = new URLSearchParams(window.location.search).get("screen");
      if (screenId) {
        try {
          const raw = window.localStorage.getItem(`grade:screen:${screenId}`);
          if (raw) void render(JSON.parse(raw).source, "light");
        } catch {
          /* ignore */
        }
      }
    }).catch((e) => {
      setStatus(`module load failed: ${e instanceof Error ? e.message : e}`);
      post({ type: "ext:error", message: String(e) });
    });

    return () => {
      disposed = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("wheel", onWheel);
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
