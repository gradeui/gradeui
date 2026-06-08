/**
 * MCP App View — inline interactive preview of a Grade screen.
 *
 * Consumer of the ONE renderer (`@/lib/studio-render-core`): identical
 * vocabulary + sucrase compile as Studio's fast-sandbox, none of the Studio
 * chrome. Uses the official MCP Apps SDK (`useApp`) for the host handshake,
 * so it gets host context for free — `theme` (drives Grade's `.dark` class),
 * `platform`, `containerDimensions` (viewport), `locale`, `safeAreaInsets`.
 * The screen's JSX arrives via `ontoolresult`; we compile it and render it
 * directly in the host's sandboxed iframe — no nested frame, no runtime
 * network (the spec default CSP is connect-src 'none'; everything inlined).
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import {
  compile,
  healMissingLucideImports,
  preResolveUnknownImports,
  PreviewWrap,
  FailurePanel,
  RenderErrorBoundary,
} from "@/lib/studio-render-core";

interface ScreenState {
  appSource: string;
  mode?: "light" | "dark";
  themeVars?: Record<string, string>;
}

// Report content height so the host sizes the panel to fit. Measures #root,
// never the document (document.scrollHeight is floored at the iframe
// viewport, so it can only grow, never shrink to fit).
function reportSize(): void {
  const root = document.getElementById("root");
  const rect = (root ?? document.documentElement).getBoundingClientRect();
  const height = Math.ceil(rect.height + (root ? rect.top : 0));
  const width = Math.ceil(rect.width);
  if (height > 0) {
    window.parent.postMessage(
      { jsonrpc: "2.0", method: "ui/notifications/size-changed", params: { height, width } },
      "*",
    );
  }
}

// Compiles + renders one screen. Compile is sync, but the esm.sh pre-resolve
// is async, so we stage it through state.
function ScreenRender({ appSource }: { appSource: string }) {
  const [state, setState] = useState<{
    Component: React.ComponentType | null;
    error: Error | null;
  }>({ Component: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const src = healMissingLucideImports(appSource);
      await preResolveUnknownImports(src);
      if (!cancelled) setState(compile(src));
    })();
    return () => {
      cancelled = true;
    };
  }, [appSource]);

  useEffect(() => {
    requestAnimationFrame(reportSize);
    const t1 = window.setTimeout(reportSize, 200);
    const t2 = window.setTimeout(reportSize, 800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [state]);

  if (state.error) return <FailurePanel error={state.error} />;
  if (!state.Component) return null; // compiling
  const Compiled = state.Component;
  return (
    <RenderErrorBoundary fallback={(e) => <FailurePanel error={e} />}>
      <PreviewWrap>
        <Compiled />
      </PreviewWrap>
    </RenderErrorBoundary>
  );
}

// Test bridge — lets a Playwright/browser harness drive render + theme
// without standing up a full host. Production uses the SDK handshake below;
// these setters are wired to the same React state.
let bridge: {
  setScreen?: (s: ScreenState) => void;
  setForcedTheme?: (t: "light" | "dark" | undefined) => void;
} = {};

function PreviewApp() {
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  const [screen, setScreen] = useState<ScreenState | null>(null);
  const [forcedTheme, setForcedTheme] = useState<"light" | "dark" | undefined>();

  const { app, isConnected, error } = useApp({
    appInfo: { name: "gradeui-preview", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (instance) => {
      instance.onhostcontextchanged = (ctx) =>
        setHostContext((prev) => ({ ...prev, ...ctx }));
      instance.ontoolresult = (result) => {
        const sc = (result?.structuredContent ?? {}) as ScreenState & {
          appSource?: string;
        };
        if (sc.appSource)
          setScreen({ appSource: sc.appSource, mode: sc.mode, themeVars: sc.themeVars });
      };
    },
  });

  useEffect(() => {
    if (app) setHostContext(app.getHostContext());
  }, [app]);

  useEffect(() => {
    bridge = { setScreen, setForcedTheme };
    return () => {
      bridge = {};
    };
  }, []);

  // Dark/light. The host's theme wins (matches Claude's light/dark); the
  // screen's own mode is a fallback; forcedTheme is the test override.
  // Grade switches dark via a `.dark` class on the root.
  const dark = (forcedTheme ?? hostContext?.theme ?? screen?.mode) === "dark";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  // Project theme tokens, when the tool sends them, layered as :root vars.
  useEffect(() => {
    if (!screen?.themeVars) return;
    let el = document.getElementById("gds-theme-vars") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "gds-theme-vars";
      document.head.appendChild(el);
    }
    el.textContent =
      ":root{" +
      Object.entries(screen.themeVars)
        .map(([k, v]) => `${k}:${v}`)
        .join(";") +
      "}";
  }, [screen?.themeVars]);

  // Honor the host's safe-area insets (mobile hosts) like the SDK example.
  const insets = hostContext?.safeAreaInsets;
  const padStyle: React.CSSProperties = insets
    ? {
        paddingTop: insets.top,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
      }
    : {};

  // A screen we already have always wins — a transient/again handshake
  // state must never blank a rendered preview.
  if (screen) {
    return (
      <div style={padStyle}>
        <ScreenRender appSource={screen.appSource} />
      </div>
    );
  }
  if (error) {
    return (
      <FailurePanel
        error={error instanceof Error ? error : new Error(String(error))}
      />
    );
  }
  return (
    <div style={padStyle} className="p-6 text-sm text-muted-foreground">
      {isConnected ? "Waiting for a screen…" : "Connecting…"}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<PreviewApp />);

// Keep the reported height honest as the screen reflows.
if (typeof ResizeObserver !== "undefined") {
  const ro = new ResizeObserver(() => reportSize());
  ro.observe(document.documentElement);
}
window.addEventListener("resize", reportSize);

// Test bridge (Playwright): __gradeRenderScreen(appSource, { mode?, theme?, themeVars? })
(window as unknown as Record<string, unknown>).__gradeRenderScreen = (
  appSource: string,
  opts?: { mode?: "light" | "dark"; theme?: "light" | "dark"; themeVars?: Record<string, string> },
) => {
  if (opts?.theme) bridge.setForcedTheme?.(opts.theme);
  bridge.setScreen?.({ appSource, mode: opts?.mode, themeVars: opts?.themeVars });
};
