/**
 * Minimal interactive MCP App — a proof that an interactive UI renders and
 * responds inside the host's sandboxed iframe, with ZERO dependencies and
 * no build step. Independent of the Grade renderer: if this works in a
 * host but the full Grade preview doesn't, the problem is the Grade bundle,
 * not MCP Apps support.
 *
 * Self-contained HTML5, inline script only (the spec's default CSP allows
 * `script-src 'self' 'unsafe-inline'`), no network (`connect-src 'none'`).
 * Does the MCP Apps handshake so a strict host is happy, and reports its
 * size so the panel fits.
 */

export const INTERACTIVE_DEMO_URI = "ui://gradeui-mcp/interactive-demo-v1";

export const INTERACTIVE_DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; font-family: system-ui, sans-serif;
    color: light-dark(#171717, #fafafa); background: transparent; }
  #root { padding: 20px; max-width: 460px; }
  h2 { margin: 0 0 4px; font-size: 16px; }
  p.sub { margin: 0 0 16px; font-size: 13px; opacity: 0.65; }
  .row { display: flex; gap: 10px; align-items: center; margin: 12px 0; }
  button { font: inherit; font-size: 14px; cursor: pointer; padding: 8px 16px;
    border-radius: 10px; border: 1px solid light-dark(rgba(0,0,0,.15), rgba(255,255,255,.18));
    background: light-dark(#fff, #1a1a1a); color: inherit; }
  button:hover { background: light-dark(rgba(0,0,0,.05), rgba(255,255,255,.08)); }
  input { font: inherit; font-size: 14px; padding: 8px 12px; flex: 1;
    border-radius: 10px; border: 1px solid light-dark(rgba(0,0,0,.15), rgba(255,255,255,.18));
    background: light-dark(#fff, #1a1a1a); color: inherit; }
  .echo { font-size: 13px; min-height: 18px; opacity: 0.8; }
  .ok { color: #16a34a; font-weight: 600; }
</style>
</head>
<body>
<div id="root">
  <h2>MCP interactive check ✓</h2>
  <p class="sub">If clicking and typing update this panel, interactive MCP UI works in this host.</p>
  <div class="row">
    <button id="btn">Clicked 0 times</button>
    <span id="status"></span>
  </div>
  <div class="row">
    <input id="inp" placeholder="Type something…">
  </div>
  <div class="echo" id="echo"></div>
</div>
<script>
(function () {
  var n = 0;
  var btn = document.getElementById("btn");
  var status = document.getElementById("status");
  btn.addEventListener("click", function () {
    n++;
    btn.textContent = "Clicked " + n + " time" + (n === 1 ? "" : "s");
    status.innerHTML = '<span class="ok">interactive ✓</span>';
    reportSize();
  });
  var inp = document.getElementById("inp");
  var echo = document.getElementById("echo");
  inp.addEventListener("input", function () {
    echo.textContent = inp.value ? "You typed: " + inp.value : "";
    reportSize();
  });

  function notify(method, params) {
    window.parent.postMessage({ jsonrpc: "2.0", method: method, params: params || {} }, "*");
  }
  function reportSize() {
    var r = document.getElementById("root").getBoundingClientRect();
    notify("ui/notifications/size-changed", {
      width: Math.ceil(r.width), height: Math.ceil(r.height + r.top),
    });
  }

  // MCP Apps handshake — initiate, and also answer a host-initiated one.
  var ID = 1;
  window.addEventListener("message", function (ev) {
    var m = ev.data || {};
    if (m.id != null && m.method && /initiali[sz]e/i.test(String(m.method))) {
      window.parent.postMessage({ jsonrpc: "2.0", id: m.id, result: {
        protocolVersion: "2026-01-26",
        appInfo: { name: "gradeui-interactive-demo", version: "1.0.0" },
        appCapabilities: { availableDisplayModes: ["inline"] },
      } }, "*");
      notify("ui/notifications/initialized", {});
    } else if (m.method === "ui/resource-teardown" && m.id != null) {
      window.parent.postMessage({ jsonrpc: "2.0", id: m.id, result: {} }, "*");
    }
  });
  window.parent.postMessage({ jsonrpc: "2.0", id: ID++, method: "ui/initialize", params: {
    protocolVersion: "2026-01-26",
    appInfo: { name: "gradeui-interactive-demo", version: "1.0.0" },
    appCapabilities: { availableDisplayModes: ["inline"] },
  } }, "*");
  notify("ui/notifications/initialized", {});
  reportSize();
  window.addEventListener("resize", reportSize);
})();
</script>
</body>
</html>`;
