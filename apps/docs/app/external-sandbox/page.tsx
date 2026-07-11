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
 * Protocol (deliberately tiny, v0):
 *   parent → iframe: { type: "ext:source", source, mode }  — render this
 *   iframe → parent: { type: "ext:ready" }                 — send me source
 *   iframe → parent: { type: "ext:error", message }        — compile/render failed
 *   iframe → parent: { type: "ext:rendered" }              — paint done
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
import { getActiveRegistry } from "@/lib/active-registry";

const REGISTRY = getActiveRegistry();

/** esm.sh module URLs. React is pinned and shared via import map so the
 *  DS package (externalized) resolves the same instance. */
const ESM = {
  react: "https://esm.sh/react@19.0.0",
  jsx: "https://esm.sh/react@19.0.0/jsx-runtime",
  jsxDev: "https://esm.sh/react@19.0.0/jsx-dev-runtime",
  reactDom: "https://esm.sh/react-dom@19.0.0",
  reactDomClient: "https://esm.sh/react-dom@19.0.0/client",
  sucrase: "https://esm.sh/sucrase@3.35.0",
};

function dsUrl(): string {
  const v = REGISTRY.package.version ? `@${REGISTRY.package.version}` : "";
  return `https://esm.sh/${REGISTRY.package.name}${v}?external=react,react-dom`;
}

export default function ExternalSandboxPage() {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = React.useState("booting…");

  React.useEffect(() => {
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
          import(/* webpackIgnore: true */ ESM.react),
          import(/* webpackIgnore: true */ ESM.jsx),
          import(/* webpackIgnore: true */ ESM.jsxDev),
          import(/* webpackIgnore: true */ ESM.reactDom),
          import(/* webpackIgnore: true */ ESM.reactDomClient),
          import(/* webpackIgnore: true */ ESM.sucrase),
          import(/* webpackIgnore: true */ dsUrl()),
          import(/* webpackIgnore: true */ "https://esm.sh/lucide-react@0.475.0?external=react"),
          import(/* webpackIgnore: true */ "https://esm.sh/motion@12.29.2/react?external=react"),
          // Preview-vocab packages the system prompt licenses (rules 6/6a).
          import(/* webpackIgnore: true */ "https://esm.sh/recharts@3.7.0?external=react,react-dom"),
          import(/* webpackIgnore: true */ "https://esm.sh/canvas-confetti@1.9.3"),
          // Companion packages (icons etc.) — best-effort; a DS without
          // them just resolves to an empty namespace.
          ...Object.keys(REGISTRY.runtime?.dependencies ?? {}).map((name) =>
            import(
              /* webpackIgnore: true */ `https://esm.sh/${name}@${REGISTRY.runtime!.dependencies![name]}?external=react,react-dom`
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

    // Click-to-select (v1): when the parent enables select mode, clicks
    // resolve the nearest part-attributed ancestor and ship a
    // ScreenSelection-shaped payload up. Suffix map turns BrightLocal's
    // instance hooks ("settings-save-button") into component names.
    let selectOn = false;
    const partAttr = REGISTRY.selection.partAttribute;
    const suffixMap = REGISTRY.selection.partSuffixMap ?? {};
    const suffixes = Object.keys(suffixMap).sort((a, b) => b.length - a.length);
    const kebabToPascal = (k: string) =>
      k.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    /** Shared by click + hover: nearest part-attributed ancestor (else the
     *  raw target) plus its resolved DS component name. */
    const resolveTarget = (target: Element | null) => {
      const el = target?.closest?.(`[${partAttr}]`) ?? target;
      if (!el) return null;
      const part = el.getAttribute?.(partAttr) ?? undefined;
      const sfx = part ? suffixes.find((x) => part === x || part.endsWith(`-${x}`)) : undefined;
      const componentName = sfx ? suffixMap[sfx] : part ? kebabToPascal(part) : undefined;
      return { el, part, componentName };
    };

    /**
     * Hover outline + measure overlay for select mode — the external-DS
     * mirror of Fast Frame's installMeasureAgent (fast-sandbox/page.tsx),
     * fused with selection targeting: the outline snaps to the SAME
     * element a click would select (nearest part-attributed ancestor),
     * and the label names the resolved component plus its rendered size.
     * External DSes ship full-value hex tokens (shadcn-style --primary),
     * not gradeui's oklch channel pairs, so colours use var()+color-mix
     * with a blue fallback rather than oklch(var(--selected)).
     */
    let hover: { onMove: (e: MouseEvent) => void; onLeave: () => void; host: HTMLDivElement; raf: number } | null = null;
    function installHoverOverlay() {
      const host = document.createElement("div");
      host.setAttribute("data-ext-hover-overlay", "");
      host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483600;";
      const box = document.createElement("div");
      box.style.cssText =
        "position:absolute;display:none;border-radius:2px;" +
        "border:1px solid var(--primary, #3b82f6);" +
        "background:color-mix(in srgb, var(--primary, #3b82f6) 8%, transparent);";
      const label = document.createElement("div");
      label.style.cssText =
        "position:absolute;display:none;padding:2px 6px;border-radius:4px;" +
        "background:var(--primary, #3b82f6);color:var(--primary-foreground, #fff);" +
        "font:600 11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;";
      host.append(box, label);
      document.body.appendChild(host);
      const hide = () => {
        box.style.display = "none";
        label.style.display = "none";
      };
      const state = {
        host,
        raf: 0,
        onMove(e: MouseEvent) {
          cancelAnimationFrame(state.raf);
          state.raf = requestAnimationFrame(() => {
            const hit = resolveTarget(e.target as Element | null);
            const el = hit?.el;
            if (!el || host.contains(el) || el === document.body || el === document.documentElement) {
              hide();
              return;
            }
            const r = el.getBoundingClientRect();
            if (r.width <= 0 || r.height <= 0) {
              hide();
              return;
            }
            box.style.display = "block";
            box.style.left = `${r.left}px`;
            box.style.top = `${r.top}px`;
            box.style.width = `${r.width}px`;
            box.style.height = `${r.height}px`;
            const name = hit.componentName ?? el.tagName.toLowerCase();
            label.textContent = `${name} · ${Math.round(r.width)} × ${Math.round(r.height)}`;
            label.style.display = "block";
            // Above the box; flip below when there's no headroom.
            label.style.left = `${Math.max(2, r.left)}px`;
            label.style.top =
              r.top >= 26 ? `${r.top - 24}px` : `${Math.min(window.innerHeight - 24, r.bottom + 4)}px`;
          });
        },
        onLeave: hide,
      };
      document.addEventListener("mousemove", state.onMove, true);
      document.documentElement.addEventListener("mouseleave", state.onLeave, true);
      return state;
    }
    function teardownHoverOverlay() {
      if (!hover) return;
      cancelAnimationFrame(hover.raf);
      document.removeEventListener("mousemove", hover.onMove, true);
      document.documentElement.removeEventListener("mouseleave", hover.onLeave, true);
      hover.host.remove();
      hover = null;
    }

    const onClick = (e: MouseEvent) => {
      if (!selectOn) return;
      e.preventDefault();
      e.stopPropagation();
      const hit = resolveTarget(e.target as Element | null);
      if (!hit) return;
      const { el, part, componentName } = hit;
      const rect = el.getBoundingClientRect();
      post({
        type: "ext:select",
        selection: {
          tag: el.tagName?.toLowerCase() ?? "",
          text: ((el as HTMLElement).innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
          outerHTML: (el.outerHTML ?? "").slice(0, 500),
          rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
          part,
          componentName,
        },
      });
    };
    document.addEventListener("click", onClick, true);

    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; source?: string; mode?: string; on?: boolean } | null;
      if (d?.type === "ext:source" && typeof d.source === "string") {
        void render(d.source, d.mode ?? "light");
      } else if (d?.type === "ext:select-mode") {
        selectOn = Boolean(d.on);
        document.body.style.cursor = selectOn ? "crosshair" : "";
        if (selectOn && !hover) hover = installHoverOverlay();
        else if (!selectOn) teardownHoverOverlay();
      }
    };
    window.addEventListener("message", onMessage);

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
      document.removeEventListener("click", onClick, true);
      teardownHoverOverlay();
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
