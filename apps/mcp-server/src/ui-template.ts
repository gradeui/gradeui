/**
 * The MCP App view for preview_screen — a single static HTML template
 * (SEP-1865, "MCP Apps", 2026-01-26).
 *
 * Registered once at ui://gradeui-mcp/preview and linked to the tool
 * via _meta.ui.resourceUri. Hosts may PREFETCH AND CACHE this resource, so
 * it must contain NO per-call data — the screenshot arrives per call via
 * the tool result's structuredContent (which the host forwards to the
 * iframe as ui/notifications/tool-result, and which is never added to
 * model context — a multi-MB data-URI costs zero tokens).
 *
 * Bridge: raw JSON-RPC over postMessage (no SDK needed) —
 *   ui/initialize → ui/notifications/initialized → ui/notifications/tool-input
 *   → ui/notifications/tool-result. We also emit ui/notifications/size-changed
 *   so the host sizes the iframe to the image.
 *
 * CSP: img-src data: is allowed by the default policy (the PNG needs no
 * declarations). The "Live" toggle nests the real gradeui.com/e/<token>
 * embed iframe — that needs frameDomains declared on the resource _meta,
 * and only works in hosts that permit nested frames. Claude DESKTOP
 * explicitly does not — so the view sniffs `hostInfo.name` from the
 * ui/initialize result and hides the Live button on desktop hosts.
 */

// Versioned URI: hosts may prefetch + cache ui:// resources indefinitely,
// so shipping a changed template under the same URI can silently serve the
// old panel. Bump the suffix whenever the template changes materially.
export const PREVIEW_RESOURCE_URI = "ui://gradeui-mcp/preview-v3";

/**
 * Bake the Supabase Storage poster base URL into the template.
 *
 * Why: claude.ai web (June 2026) renders the panel but does NOT forward
 * ui/notifications/tool-result to it — observed live: stage stuck on
 * "Rendering…" while the capture itself succeeded. The panel therefore
 * can't rely on structuredContent. It CAN see tool-input (the call
 * arguments: screenId + colorMode), and every capture is stored at a
 * deterministic public path — so given the base URL it self-loads
 * `<base>/<screenId>/latest-<mode>.png`, retrying while the capture is
 * still in flight. tool-result, when a host does deliver it, still wins.
 */
export function buildPreviewTemplate(posterBaseUrl: string): string {
  return PREVIEW_TEMPLATE_HTML.replace(
    "__POSTER_BASE__",
    posterBaseUrl.replace(/\/+$/, ""),
  );
}

export const PREVIEW_TEMPLATE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0;
    font-family: var(--font-sans, system-ui, sans-serif);
    color: var(--color-text-primary, light-dark(#171717, #fafafa));
    background: transparent;
  }
  .bar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 8px 2px 10px;
    font-size: 13px;
  }
  .name { font-weight: 500; }
  .dim { opacity: 0.6; margin-left: 8px; font-size: 12px; }
  .actions { display: flex; gap: 6px; }
  button {
    font: inherit; font-size: 12px; cursor: pointer;
    padding: 4px 10px; border-radius: 8px;
    border: 1px solid light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.18));
    background: transparent; color: inherit;
  }
  button:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08)); }
  .stage {
    border-radius: 12px; overflow: hidden;
    border: 1px solid light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.12));
    background: light-dark(#fff, #111);
  }
  .stage img { display: block; width: 100%; height: auto; }
  .stage iframe { display: block; width: 100%; border: 0; aspect-ratio: 16 / 10; }
  button[data-on="true"] { background: light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.12)); }
  .empty { padding: 32px; text-align: center; font-size: 13px; opacity: 0.6; }
</style>
</head>
<body>
<div class="bar">
  <div><span class="name" id="name">Grade screen</span><span class="dim" id="dim"></span></div>
  <div class="actions">
    <button id="live-btn" hidden>Live</button>
    <button id="open-btn" hidden>Open embed</button>
  </div>
</div>
<div class="stage" id="stage"><div class="empty">Rendering…</div></div>
<div id="status" style="font-size:11px;opacity:0.45;padding:6px 2px;font-family:ui-monospace,monospace;"></div>
<script>
(function () {
  // Lifecycle trace rendered into the panel itself — the only console we
  // have inside a host iframe we can't inspect. Reads like:
  //   v3 js✓ · init✓:claude-web · recv:tool-input · poster✓
  var dbg = ["v3", "js✓"];
  function mark(s) {
    dbg.push(s);
    var el = document.getElementById("status");
    if (el) el.textContent = dbg.join(" · ");
  }

  var nextId = 1;
  var pending = {};
  var state = {
    embedUrl: null, imageDataUri: null, live: false, hostName: "",
    posterBase: "__POSTER_BASE__", args: null, gotResult: false, posterTries: 0
  };

  function send(method, params) {
    var id = nextId++;
    window.parent.postMessage({ jsonrpc: "2.0", id: id, method: method, params: params }, "*");
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject };
    });
  }
  function notify(method, params) {
    window.parent.postMessage({ jsonrpc: "2.0", method: method, params: params }, "*");
  }
  window.addEventListener("message", function (event) {
    var msg = event.data || {};
    if (msg.id != null && pending[msg.id]) {
      var p = pending[msg.id];
      delete pending[msg.id];
      if (msg.error) p.reject(msg.error); else p.resolve(msg.result);
      return;
    }
    if (msg.method) mark("recv:" + String(msg.method).replace("ui/notifications/", ""));
    // Direction-agnostic handshake: we initiate ui/initialize, but if the
    // HOST initiates instead (implementations differ), answer it rather
    // than ignoring the request — otherwise neither side completes init.
    if (msg.id != null && msg.method && /initiali[sz]e/i.test(String(msg.method))) {
      window.parent.postMessage({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2026-01-26",
          appInfo: { name: "gradeui-preview", version: "0.3.0" },
          appCapabilities: { availableDisplayModes: ["inline"] },
        },
      }, "*");
      mark("host-init✓");
      notify("ui/notifications/initialized", {});
      return;
    }
    if (msg.method === "ui/notifications/tool-result") {
      onResult(msg.params || {});
    } else if (msg.method === "ui/notifications/tool-input") {
      onInput(msg.params || {});
    } else if (msg.method === "ui/resource-teardown" && msg.id != null) {
      window.parent.postMessage({ jsonrpc: "2.0", id: msg.id, result: {} }, "*");
    }
  });

  function reportSize() {
    notify("ui/notifications/size-changed", {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    });
  }

  function renderImage() {
    var stage = document.getElementById("stage");
    stage.innerHTML = "";
    var img = document.createElement("img");
    img.alt = "Screen preview";
    img.onload = reportSize;
    img.src = state.imageDataUri;
    stage.appendChild(img);
  }

  // Self-serve fallback: some hosts render this panel but never forward
  // ui/notifications/tool-result (observed: claude.ai web, June 2026).
  // tool-input gives us the call args, and posters live at a deterministic
  // public path — so load the poster directly, retrying while the capture
  // (~10s on a cold function) is still in flight. A real tool-result, if
  // it ever arrives, overrides this.
  function onInput(params) {
    var args = params.arguments || params.input || params.toolInput || {};
    if (!args.screenId) { mark("input:no-id"); return; }
    if (state.posterBase.indexOf("__") === 0) { mark("no-base"); return; }
    state.args = args;
    state.posterTries = 0;
    tryPoster();
  }

  function tryPoster() {
    if (state.gotResult || !state.args) return;
    var mode = state.args.colorMode || "dark";
    var src = state.posterBase + "/" + state.args.screenId +
      "/latest-" + mode + ".png?v=" + Date.now();
    var probe = new Image();
    probe.onload = function () {
      if (state.gotResult) return;
      mark("poster✓");
      state.imageDataUri = src;
      renderImage();
      reportSize();
    };
    probe.onerror = function () {
      state.posterTries += 1;
      mark("poster✗" + state.posterTries);
      if (state.posterTries < 12) setTimeout(tryPoster, 4000);
    };
    probe.src = src;
  }

  function renderLive() {
    var stage = document.getElementById("stage");
    stage.innerHTML = "";
    var f = document.createElement("iframe");
    f.src = state.embedUrl;
    f.setAttribute("sandbox", "allow-scripts");
    f.title = "Live Grade screen";
    f.onload = reportSize;
    stage.appendChild(f);
    setTimeout(reportSize, 300);
  }

  // Desktop hosts explicitly disallow nested iframes in app views.
  // BLOCKLIST, not allowlist: claude.ai web renders panels but may send no
  // hostInfo.name in the ui/initialize result, so requiring a non-empty
  // name hid the Live button on the one host that supports it. Unknown
  // hosts get the button; worst case the nested frame is blocked by host
  // CSP and the user toggles back to the PNG.
  function liveAllowed() {
    return !/desktop/i.test(state.hostName);
  }

  function onResult(result) {
    var sc = result.structuredContent || {};
    state.gotResult = true;
    state.imageDataUri = sc.imageDataUri || sc.previewUrl || state.imageDataUri;
    state.embedUrl = sc.embedUrl || null;
    document.getElementById("name").textContent = sc.name || "Grade screen";
    document.getElementById("dim").textContent = sc.width && sc.height ? sc.width + "\\u00d7" + sc.height : "";

    var liveBtn = document.getElementById("live-btn");
    var openBtn = document.getElementById("open-btn");
    if (state.embedUrl) {
      openBtn.hidden = false;
      openBtn.onclick = function () {
        send("ui/open-link", { url: state.embedUrl });
      };
      if (liveAllowed()) {
        liveBtn.hidden = false;
        liveBtn.onclick = function () {
          state.live = !state.live;
          liveBtn.setAttribute("data-on", String(state.live));
          if (state.live) renderLive(); else renderImage();
        };
      }
    }
    if (state.imageDataUri) renderImage();
    reportSize();
  }

  send("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "gradeui-preview", version: "0.1.0" },
    appCapabilities: { availableDisplayModes: ["inline"] },
  }).then(function (result) {
    state.hostName =
      (result && result.hostInfo && result.hostInfo.name) || "";
    mark("init✓:" + (state.hostName || "?"));
    notify("ui/notifications/initialized", {});
    reportSize();
  }).catch(function (e) {
    mark("init✗" + ((e && e.message) ? ":" + e.message : ""));
  });

  if (window.ResizeObserver) {
    new ResizeObserver(reportSize).observe(document.documentElement);
  }
})();
</script>
</body>
</html>`;
