/**
 * MCP App View — inline interactive preview of a Grade screen.
 *
 * Consumer of the ONE renderer (`@/lib/studio-render-core`): identical
 * vocabulary + sucrase compile as Studio's fast-sandbox, none of the Studio
 * chrome. The screen's JSX arrives over the MCP Apps `tool-result`
 * notification; we compile it and render directly in the host's sandboxed
 * iframe — no nested frame, no runtime network (the spec default CSP is
 * connect-src 'none'; everything is bundled inline).
 *
 * Handshake: raw JSON-RPC over postMessage (no SDK). This is deliberate —
 * it's what renders in the broadest set of hosts (incl. Cowork). Host theme
 * (light/dark) is read from the ui/initialize result and host-context
 * notifications and applied via Grade's `.dark` class; the screen's own
 * `mode` is a fallback.
 */

import * as React from "react";
import { createRoot } from "react-dom/client";
import {
  compile,
  healMissingLucideImports,
  preResolveUnknownImports,
  PreviewWrap,
  FailurePanel,
  RenderErrorBoundary,
  setProjectModules,
} from "@/lib/studio-render-core";
import { GradeLogo } from "@/components/grade-logo";
// BrightLocal vocabulary — side-effect import registers the resolver for
// "@brightlocal/*" specifiers (the shared-demo registry). CSS activates
// only when a brightlocal screen actually arrives.
import {
  isBrightlocalSource,
  activateBrightlocalCss,
} from "./brightlocal-vocab";
// Map SDK stub — side-effect import. The panel's CSP can never load a
// real Google map; this resolves "@vis.gl/react-google-maps" to inert
// components that trip the screens' own gm_authFailure fallback
// (wireframe grid) instead of killing the whole screen at import time.
import "./visgl-offline-stub";

/** Registry decision for a payload: the project's registryId is
 *  authoritative; the import sniff only covers payloads from an older
 *  server that didn't send it. */
function isBrightlocalPayload(p: ScreenPayload): boolean {
  if (p.registryId) return p.registryId === "brightlocal";
  return isBrightlocalSource(p.appSource);
}
import {
  generateTheme,
  themeToCSSVars,
  injectFontFaces,
  builtInThemes,
  defaultThemeId,
} from "@/lib/themes";
import { Sun, Moon, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
// Leaflet's CSS, bundled inline (the sandbox can't fetch it from a CDN).
import "leaflet/dist/leaflet.css";

// Force Grade's <Map> onto the worker-free Leaflet adapter in this View:
// maplibre's Web Worker is blocked by the sandbox CSP, Leaflet's raster
// tiles are not. (Studio/embed never set these, so they keep maplibre.)
{
  const g = globalThis as unknown as Record<string, unknown>;
  g.__gradeMapProvider = "leaflet";
  g.__gradeLeafletCssBundled = true;
}

// ─── Raw MCP Apps handshake (JSON-RPC over postMessage) ────────────────
let nextId = 1;
const pending: Record<
  number,
  { resolve: (v: unknown) => void; reject: (e: unknown) => void }
> = {};

function send(method: string, params: unknown): Promise<unknown> {
  const id = nextId++;
  window.parent.postMessage({ jsonrpc: "2.0", id, method, params }, "*");
  return new Promise((resolve, reject) => {
    pending[id] = { resolve, reject };
  });
}
function notify(method: string, params?: unknown): void {
  window.parent.postMessage({ jsonrpc: "2.0", method, params: params ?? {} }, "*");
}

const root = createRoot(document.getElementById("root")!);

// Grade switches dark via a `.dark` class on the root element.
function applyMode(mode: "light" | "dark" | undefined): void {
  if (!mode) return;
  const dark = mode === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

// Project theme tokens, when the tool sends them, layered as :root vars.
function applyThemeVars(vars: Record<string, string> | undefined): void {
  if (!vars || Object.keys(vars).length === 0) return;
  let el = document.getElementById("gds-theme-vars") as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = "gds-theme-vars";
    document.head.appendChild(el);
  }
  // `:root,.dark` — NOT just `:root`. The bundle's static CSS includes the
  // @gradeui/ui globals copy, whose stale `.dark{--primary:…}` palette
  // matches ANY element with the class — including PreviewShell's own
  // wrapper div (which adds `dark` alongside the <html> class). A var
  // redefined on a DESCENDANT beats an inherited :root value, so in dark
  // mode every screen painted the ui copy's old salmon theme no matter
  // what we injected at :root (the 2026-06-11 "pink progress bar" bug —
  // proven live by flipping this selector in the rendered bundle).
  // Emitting the same block under `.dark` wins the tie against the static
  // rule (same specificity, this sheet is appended last). The site never
  // hits this because it applies vars INLINE on the elements it themes.
  el.textContent =
    ":root,.dark{" +
    Object.entries(vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(";") +
    "}";
}

// Read host context (theme today; platform/viewport/locale available) from
// either the initialize result or a host-context-changed notification.
function applyHostContext(ctx: unknown): void {
  if (ctx && typeof ctx === "object") {
    // Host tells us the live display mode (inline / fullscreen); keep the
    // header's expand/collapse icon in sync with whatever the host actually
    // did — it may switch us without our asking.
    const dm = (ctx as { displayMode?: "inline" | "fullscreen" }).displayMode;
    if (dm === "inline" || dm === "fullscreen") pushDisplayMode?.(dm);
  }
  if (ctx && typeof ctx === "object" && "theme" in ctx) {
    const theme = (ctx as { theme?: "light" | "dark" }).theme;
    applyMode(theme);
    // Keep the header's light/dark toggle in sync with the host theme.
    if (theme) pushMode?.(theme);
  }
}

// Report content height so the host sizes the panel to fit. Measures #root,
// never the document (document.scrollHeight is floored at the iframe
// viewport, so it can only grow, never shrink to fit).
function reportSize(): void {
  const el = document.getElementById("root");
  const rect = (el ?? document.documentElement).getBoundingClientRect();
  const height = Math.ceil(rect.height + (el ? rect.top : 0));
  const width = Math.ceil(rect.width);
  if (height > 0) notify("ui/notifications/size-changed", { height, width });
}

// ─── Preview chrome (header + 4:3 frame + debug footer) ────────────────
//
// The MCP panel wraps the rendered screen in a slim band of Grade chrome:
// brand + light/dark + an "open full" link-out (the /e/ embed the tool
// hands us in structuredContent), the screen locked to a 4:3 frame, and a
// debug footer showing the live frame resolution. The screen still renders
// DIRECTLY (no nested iframe) — this just frames it.

type ScreenPayload = {
  appSource: string;
  embedUrl?: string | null;
  mode?: "light" | "dark";
  themeVars?: Record<string, string>;
  /** The project's saved theme draft (ThemeInput JSON). Generated +
   *  applied client-side, exactly like the share / embed views. */
  themeDraftJson?: string | null;
  /** The PROJECT's design-system registry ("brightlocal" | "gradeui" |
   *  null). Authoritative — a brightlocal project renders with the
   *  brightlocal vocab + CSS and never Grade's. Source-sniffing is only
   *  the fallback for payloads from an older server. */
  registryId?: string | null;
  /** Project shared components ({name → JSX module source}). */
  sharedComponents?: Record<string, string> | null;
  name?: string;
  /** BARE mode (preview_screen_scaled v7): no header, no footer, no 4:3
   *  frame — the screen renders edge-to-edge filling the viewport. Used
   *  when this bundle runs as a GUEST inside another panel's Fit-scaled
   *  srcdoc frame: the outer shell owns the chrome at 1:1 (otherwise the
   *  chrome scales down with the screen — the "double chrome" bug) and
   *  the host-fullscreen affordance moves to the shell. */
  bare?: boolean;
};

// The postMessage handler lives outside React; the shell publishes its
// setters here so a tool-result (or a host theme change) can drive it. A
// payload that arrives before the shell's effect runs is buffered.
let pushScreen: ((p: ScreenPayload) => void) | null = null;
let pushMode: ((mode: "light" | "dark") => void) | null = null;
let pushDisplayMode: ((mode: "inline" | "fullscreen") => void) | null = null;
let pendingPayload: ScreenPayload | null = null;
function deliverScreen(p: ScreenPayload): void {
  if (pushScreen) pushScreen(p);
  else pendingPayload = p;
}

/** send() with a deadline — some hosts silently IGNORE ui/* requests
 *  they don't implement (observed: request-display-mode + open-link in
 *  the desktop app, 21 Jul 2026); the promise then hangs forever and the
 *  control looks dead. A timeout turns "host ignored us" into a
 *  rejection the caller can fall back from. */
function sendT(method: string, params: unknown, ms = 700): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error(`host timeout: ${method}`));
      }
    }, ms);
    send(method, params).then(
      (r) => {
        if (!done) {
          done = true;
          clearTimeout(t);
          resolve(r);
        }
      },
      (e) => {
        if (!done) {
          done = true;
          clearTimeout(t);
          reject(e);
        }
      },
    );
  });
}

// Open a link: direct window.open FIRST (we're inside a user gesture —
// works when the panel's sandbox allows popups, returns null when
// blocked), and only then ask the host. Never both, so no double-open
// on hosts where each path works.
function openExternal(url: string): void {
  let w: Window | null = null;
  try {
    w = window.open(url, "_blank", "noopener");
  } catch {
    /* sandbox threw — fall through to the host */
  }
  if (w) return;
  send("ui/open-link", { url }).catch(() => {
    /* host declined / no handler — nothing else we can do from here */
  });
}

// Ask the host to switch the panel between inline and fullscreen. We
// declared both in `availableDisplayModes` at init, so a capable host
// honours this. A host that IGNORES the request (sendT timeout) gets the
// NATIVE fallback: take this document itself fullscreen via the
// Fullscreen API — needs the iframe's allow="fullscreen", so it can
// still fail, in which case the icon stays as-is (no optimistic flip, so
// the control never lies about the real mode). Escape exits native
// fullscreen without us — the fullscreenchange listener below keeps the
// icon honest.
if (typeof document !== "undefined") {
  document.addEventListener("fullscreenchange", () => {
    pushDisplayMode?.(document.fullscreenElement ? "fullscreen" : "inline");
  });
}
function requestDisplayMode(mode: "inline" | "fullscreen"): void {
  // Already in NATIVE fullscreen → plain exit, no host round-trip.
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
    return;
  }
  sendT("ui/request-display-mode", { mode })
    .then((result) => {
      const applied =
        (result &&
          typeof result === "object" &&
          (result as { mode?: "inline" | "fullscreen" }).mode) ||
        mode;
      if (applied === "inline" || applied === "fullscreen")
        pushDisplayMode?.(applied);
    })
    .catch(() => {
      if (mode === "fullscreen" && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          /* host + native both unavailable — leave the icon as-is */
        });
      }
    });
}

function PreviewShell() {
  const [payload, setPayload] = React.useState<ScreenPayload | null>(null);
  const [mode, setMode] = React.useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const [compiled, setCompiled] = React.useState<{
    Component: React.ComponentType | null;
    error: Error | null;
  }>({ Component: null, error: null });
  const [res, setRes] = React.useState<{ w: number; h: number } | null>(null);
  const [displayMode, setDisplayMode] = React.useState<"inline" | "fullscreen">(
    "inline",
  );
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  // Publish the bridges; flush any payload that beat us to mount.
  React.useEffect(() => {
    const apply = (p: ScreenPayload) => {
      applyMode(p.mode);
      applyThemeVars(p.themeVars);
      if (p.mode) setMode(p.mode);
      setPayload(p);
    };
    pushScreen = apply;
    pushMode = (m) => setMode(m);
    pushDisplayMode = (m) => setDisplayMode(m);
    if (pendingPayload) {
      apply(pendingPayload);
      pendingPayload = null;
    }
    return () => {
      pushScreen = null;
      pushMode = null;
      pushDisplayMode = null;
    };
  }, []);

  // Compile whenever the source changes (heal + esm pre-resolve first).
  React.useEffect(() => {
    if (!payload?.appSource) {
      setCompiled({ Component: null, error: null });
      return;
    }
    let cancelled = false;
    // Register project shared components BEFORE compiling — the
    // screen's "@project/components" import resolves from this set.
    setProjectModules(payload.sharedComponents ?? null);
    const src = healMissingLucideImports(payload.appSource);
    // BrightLocal project → inject the registry's token CSS + boot the
    // bundled Tailwind v4 browser build (idempotent) BEFORE the render,
    // so first paint already has the DS's utilities.
    if (isBrightlocalPayload(payload)) activateBrightlocalCss();
    void preResolveUnknownImports(src).then(() => {
      if (cancelled) return;
      setCompiled(compile(src));
      requestAnimationFrame(reportSize);
      window.setTimeout(reportSize, 200);
      window.setTimeout(reportSize, 800);
    });
    return () => {
      cancelled = true;
    };
  }, [payload?.appSource, payload?.sharedComponents]);

  // Toggling light/dark re-skins the rendered screen via the <html> class.
  React.useEffect(() => {
    applyMode(mode);
    requestAnimationFrame(reportSize);
  }, [mode]);

  // Apply the PROJECT theme — same resolution as SharedScreen/EmbedScreen:
  // parse the draft and generate the ramp set; on a missing OR malformed
  // draft fall back to builtInThemes[defaultThemeId] — never to the
  // bundle's baked-in CSS. Recomputes on a mode toggle so the project's
  // dark palette shows in dark mode too.
  //
  // The fallback is the 2026-06-11 dark-mode-parity fix: the old code
  // `if (!draft) return;` left a draft-less project on the HANDWRITTEN
  // globals.css defaults, while every desktop surface (GradeThemeProvider,
  // embed, share) explicitly applies the GENERATED default theme. The two
  // look close in light and visibly different in dark — "MCP dark mode
  // defaults to a different theme". Resolution must stay byte-identical
  // to embed-screen.tsx's: draft → generateTheme, anything else →
  // builtInThemes[defaultThemeId].
  React.useEffect(() => {
    // BrightLocal projects are themed by the REGISTRY's own token CSS
    // (activateBrightlocalCss) — Grade's generated theme vars must not
    // repaint them (both define --background/--primary/…). Drop any
    // previously-applied Grade vars and stand down.
    if (payload && isBrightlocalPayload(payload)) {
      document.getElementById("gds-theme-vars")?.remove();
      return;
    }
    const draft = payload?.themeDraftJson;
    let theme = builtInThemes[defaultThemeId];
    if (draft) {
      try {
        theme = generateTheme(JSON.parse(draft));
      } catch {
        /* malformed draft — use the generated default, same as desktop */
      }
    }
    applyThemeVars(themeToCSSVars(theme, mode));
    // Custom uploaded faces — same contract as every other surface: the
    // vars name the family, the @font-face tag materialises it.
    injectFontFaces(theme.typography.fontFaces);
  }, [payload?.appSource, payload?.registryId, payload?.themeDraftJson, mode]);

  // Live frame resolution for the footer + host panel sizing.
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      setRes({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) });
      reportSize();
    };
    measure();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const Compiled = compiled.Component;
  const seg =
    "inline-flex h-5 w-6 items-center justify-center rounded-sm transition";
  const iconBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground";

  const bare = Boolean(payload?.bare);

  return (
    <div
      className={
        "flex w-full flex-col bg-background" +
        // Fullscreen fills the viewport so the stage can centre + letterbox
        // a contained 4:3 frame; inline sizes to the frame's own height.
        // Bare mode always fills the viewport — the scaled srcdoc frame
        // IS the virtual screen, edge to edge.
        (displayMode === "fullscreen" || bare ? " h-screen" : "") +
        (mode === "dark" ? " dark" : "")
      }
      data-mode={mode}
      data-bare={bare ? "" : undefined}
    >
      {/* Header — brand + light/dark + open-full. display:none in bare
          mode — the outer shell owns chrome at 1:1 (v7, double-chrome
          fix). */}
      <header style={bare ? { display: "none" } : undefined} className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <GradeLogo size={18} className="shrink-0 text-foreground" />
          {payload?.name ? (
            <span className="truncate text-sm font-medium text-foreground">
              {payload.name}
            </span>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              Preview
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-md border border-border/60 p-0.5">
            <button
              type="button"
              onClick={() => setMode("light")}
              aria-pressed={mode === "light"}
              title="Light"
              className={
                seg +
                (mode === "light"
                  ? " bg-foreground/10 text-foreground"
                  : " text-muted-foreground hover:text-foreground")
              }
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode("dark")}
              aria-pressed={mode === "dark"}
              title="Dark"
              className={
                seg +
                (mode === "dark"
                  ? " bg-foreground/10 text-foreground"
                  : " text-muted-foreground hover:text-foreground")
              }
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              requestDisplayMode(
                displayMode === "fullscreen" ? "inline" : "fullscreen",
              )
            }
            aria-pressed={displayMode === "fullscreen"}
            title={
              displayMode === "fullscreen" ? "Exit full screen" : "Full screen"
            }
            aria-label={
              displayMode === "fullscreen" ? "Exit full screen" : "Full screen"
            }
            className={iconBtn}
          >
            {displayMode === "fullscreen" ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
          {payload?.embedUrl ? (
            <button
              type="button"
              onClick={() => openExternal(payload.embedUrl!)}
              title="Open in new tab"
              aria-label="Open in new tab"
              className={iconBtn}
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      {/* Stage → 4:3 frame. The FRAME is a light surface (the screen's own
          canvas), so a short screen reads as seamless background, never a
          black void. In fullscreen the stage fills the viewport and centres
          a height-contained 4:3 frame, with the dark canvas-fill as an
          intentional letterbox surround; inline the frame is full-width. */}
      <div
        className={
          bare
            ? "relative min-h-0 flex-1"
            : displayMode === "fullscreen"
              ? "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3"
              : "relative w-full"
        }
        style={
          !bare && displayMode === "fullscreen"
            ? { background: "var(--gds-canvas-fill)" }
            : undefined
        }
      >
        <div
          ref={frameRef}
          className={
            // Bare: no 4:3 lock, no ring, no radius — the screen IS the
            // frame, edge to edge; the outer shell draws the border.
            bare
              ? "relative h-full w-full overflow-hidden bg-background"
              : "relative overflow-hidden rounded-lg bg-background ring-1 ring-border/40"
          }
          style={
            bare
              ? undefined
              : displayMode === "fullscreen"
                ? {
                    aspectRatio: "4 / 3",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }
                : { aspectRatio: "4 / 3", width: "100%" }
          }
        >
          <div className="absolute inset-0 overflow-auto">
            {Compiled ? (
              <RenderErrorBoundary fallback={(e) => <FailurePanel error={e} />}>
                <PreviewWrap>
                  <Compiled />
                </PreviewWrap>
              </RenderErrorBoundary>
            ) : compiled.error ? (
              <FailurePanel error={compiled.error} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="animate-pulse text-sm text-muted-foreground">
                  Loading preview…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug footer — live frame resolution. More grade chrome lands
          here over time (this is the "controls/debug" shelf). Hidden in
          bare mode — the shell's trace is the debug surface there. */}
      <footer style={bare ? { display: "none" } : undefined} className="flex h-7 shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-background/80 px-3 font-mono text-[11px] text-muted-foreground backdrop-blur-md">
        <span>Grade · MCP preview</span>
        <span className="tabular-nums">{res ? `${res.w}×${res.h}` : "—"}</span>
      </footer>
    </div>
  );
}

root.render(<PreviewShell />);

window.addEventListener("message", (event: MessageEvent) => {
  const msg = (event.data ?? {}) as {
    id?: number;
    method?: string;
    params?: Record<string, unknown>;
    result?: { hostContext?: unknown };
    error?: unknown;
  };
  // Reply to a request we sent.
  if (msg.id != null && pending[msg.id]) {
    const p = pending[msg.id];
    delete pending[msg.id];
    if (msg.error) p.reject(msg.error);
    else p.resolve(msg.result);
    return;
  }
  // Answer a host-initiated initialize (implementations differ on direction).
  if (msg.id != null && msg.method && /initiali[sz]e/i.test(String(msg.method))) {
    window.parent.postMessage(
      {
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2026-01-26",
          appInfo: { name: "gradeui-preview", version: "1.0.0" },
          appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
        },
      },
      "*",
    );
    notify("ui/notifications/initialized");
    return;
  }
  if (msg.method === "ui/notifications/tool-result") {
    const sc = (msg.params?.structuredContent ?? {}) as {
      appSource?: string;
      mode?: "light" | "dark";
      themeVars?: Record<string, string>;
      themeDraftJson?: string | null;
      registryId?: string | null;
      embedUrl?: string | null;
      name?: string;
      bare?: boolean;
    };
    if (sc.appSource)
      deliverScreen({
        appSource: sc.appSource,
        embedUrl: sc.embedUrl ?? null,
        mode: sc.mode,
        themeVars: sc.themeVars,
        themeDraftJson: sc.themeDraftJson ?? null,
        registryId: sc.registryId ?? null,
        name: sc.name,
        // v7 bare mode — this cherry-pick is exactly where the flag got
        // dropped the first time; keep it in sync with ScreenPayload.
        bare: Boolean(sc.bare),
      });
  } else if (msg.method && /host.?context/i.test(String(msg.method))) {
    applyHostContext(msg.params);
  } else if (msg.method === "ui/resource-teardown" && msg.id != null) {
    window.parent.postMessage({ jsonrpc: "2.0", id: msg.id, result: {} }, "*");
  }
});

send("ui/initialize", {
  protocolVersion: "2026-01-26",
  appInfo: { name: "gradeui-preview", version: "1.0.0" },
  appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
})
  .then((result) => {
    notify("ui/notifications/initialized");
    applyHostContext((result as { hostContext?: unknown } | undefined)?.hostContext);
    reportSize();
  })
  .catch(() => {
    /* host may initiate instead; handled above */
  });

// Keep the reported height honest as the screen reflows.
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(() => reportSize()).observe(document.documentElement);
}
window.addEventListener("resize", reportSize);

// Test bridge (Playwright): __gradeRenderScreen(appSource, { mode?, theme?, themeVars? })
(window as unknown as Record<string, unknown>).__gradeRenderScreen = (
  appSource: string,
  opts?: {
    mode?: "light" | "dark";
    theme?: "light" | "dark";
    themeVars?: Record<string, string>;
    themeDraftJson?: string | null;
    registryId?: string | null;
    embedUrl?: string;
    name?: string;
  },
) => {
  deliverScreen({
    appSource,
    mode: opts?.theme ?? opts?.mode,
    themeVars: opts?.themeVars,
    themeDraftJson: opts?.themeDraftJson ?? null,
    registryId: opts?.registryId ?? null,
    embedUrl: opts?.embedUrl ?? null,
    name: opts?.name,
  });
};
