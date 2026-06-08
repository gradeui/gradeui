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
} from "@/lib/studio-render-core";

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
  el.textContent =
    ":root{" +
    Object.entries(vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(";") +
    "}";
}

// Read host context (theme today; platform/viewport/locale available) from
// either the initialize result or a host-context-changed notification.
function applyHostContext(ctx: unknown): void {
  if (ctx && typeof ctx === "object" && "theme" in ctx) {
    applyMode((ctx as { theme?: "light" | "dark" }).theme);
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

function renderScreen(
  appSource: string,
  mode?: "light" | "dark",
  themeVars?: Record<string, string>,
): void {
  applyMode(mode);
  applyThemeVars(themeVars);
  const src = healMissingLucideImports(appSource);
  void preResolveUnknownImports(src).then(() => {
    const { Component, error } = compile(src);
    if (error || !Component) {
      root.render(<FailurePanel error={error ?? new Error("No component")} />);
      requestAnimationFrame(reportSize);
      return;
    }
    const Compiled = Component;
    root.render(
      <RenderErrorBoundary fallback={(e) => <FailurePanel error={e} />}>
        <PreviewWrap>
          <Compiled />
        </PreviewWrap>
      </RenderErrorBoundary>,
    );
    requestAnimationFrame(reportSize);
    window.setTimeout(reportSize, 200);
    window.setTimeout(reportSize, 800);
  });
}

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
    };
    if (sc.appSource) renderScreen(sc.appSource, sc.mode, sc.themeVars);
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
  opts?: { mode?: "light" | "dark"; theme?: "light" | "dark"; themeVars?: Record<string, string> },
) => {
  renderScreen(appSource, opts?.theme ?? opts?.mode, opts?.themeVars);
};
