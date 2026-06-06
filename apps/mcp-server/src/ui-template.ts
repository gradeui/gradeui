/**
 * The MCP App view for preview_screen — a single static HTML template
 * (SEP-1865, "MCP Apps", 2026-01-26).
 *
 * Registered once at ui://gradeui-screens/preview and linked to the tool
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
 * CSP: the default policy already allows img-src data: — the PNG needs no
 * declarations at all, which keeps this app maximally plain/trustable
 * (no external-domain warnings from the host).
 */

export const PREVIEW_RESOURCE_URI = "ui://gradeui-screens/preview";

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
  .empty { padding: 32px; text-align: center; font-size: 13px; opacity: 0.6; }
</style>
</head>
<body>
<div class="bar">
  <div><span class="name" id="name">Grade screen</span><span class="dim" id="dim"></span></div>
  <div class="actions">
    <button id="open-btn" hidden>Open embed</button>
  </div>
</div>
<div class="stage" id="stage"><div class="empty">Rendering…</div></div>
<script>
(function () {
  var nextId = 1;
  var pending = {};
  var state = { embedUrl: null, imageDataUri: null };

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
    if (msg.method === "ui/notifications/tool-result") {
      onResult(msg.params || {});
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

  function onResult(result) {
    var sc = result.structuredContent || {};
    state.imageDataUri = sc.imageDataUri || null;
    state.embedUrl = sc.embedUrl || null;
    document.getElementById("name").textContent = sc.name || "Grade screen";
    document.getElementById("dim").textContent = sc.width && sc.height ? sc.width + "\\u00d7" + sc.height : "";

    var openBtn = document.getElementById("open-btn");
    if (state.embedUrl) {
      openBtn.hidden = false;
      openBtn.onclick = function () {
        send("ui/open-link", { url: state.embedUrl });
      };
    }
    if (state.imageDataUri) renderImage();
    reportSize();
  }

  send("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "gradeui-preview", version: "0.1.0" },
    appCapabilities: { availableDisplayModes: ["inline"] },
  }).then(function () {
    notify("ui/notifications/initialized", {});
    reportSize();
  }).catch(function () { /* host without apps support never loads this */ });

  if (window.ResizeObserver) {
    new ResizeObserver(reportSize).observe(document.documentElement);
  }
})();
</script>
</body>
</html>`;
