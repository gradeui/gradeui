/**
 * The MCP App view for preview_screen_scaled — the canvas "Fit" view
 * reproduced inside an MCP App panel (SEP-1865).
 *
 * The thesis (and the payload fix): preview_screen ships a multi-MB PNG +
 * the full appSource in every result. This view ships NOTHING but an
 * embed URL — the screen streams live from the site's /e/<token> route in
 * a nested iframe, rendered at a VIRTUAL width (default 1280) and
 * transform-scaled to fit the panel, exactly like the Studio canvas's Fit
 * mode. The tool result is constant-size no matter how big the screen is.
 *
 * Nested-frame reality check: desktop hosts historically blocked nested
 * iframes in app views (see ui-template.ts). Like the poster panel's v6
 * "Live" mode, this view ATTEMPTS the frame on every host and reports
 * what happened in the status trace; when the frame never paints, the
 * panel shows the embed link instead of a silent blank. That trace is
 * the experiment's readout — if it says frame⌛ forever, the host still
 * blocks nesting.
 *
 * Bridge: same raw JSON-RPC over postMessage as ui-template.ts —
 * direction-agnostic ui/initialize, tool-input + tool-result handlers,
 * size-changed reports. Per-call data arrives via the tool result's
 * structuredContent ({ embedUrl, name, width, height, mode }); this
 * template is static and cacheable, so it carries no per-call data.
 */

// Versioned URI — hosts may prefetch + cache ui:// resources indefinitely;
// bump the suffix on material template changes (see ui-template.ts).
// v2: sandbox gains allow-same-origin. v1 shipped bare allow-scripts
//     (copied from the v6 Live mode) — the host ALLOWED the nested frame
//     (frame✓ in the trace, Cowork desktop 2026-06-10) but the embed
//     booted with an OPAQUE origin: localStorage access throws there, the
//     client boot dies pre-paint, and the frame sits blank while onload
//     still fires. We're nesting our own trusted site; same-origin is the
//     correct grant. (allow-scripts + allow-same-origin on a SAME-origin
//     child would be sandbox-escape-adjacent; this child is cross-origin
//     to the panel, so it simply restores the embed's real origin.)
// v3: blackbox instrumentation. (a) Visible "Booting…" stage + a boot
//     timer in the trace (boot:5s/10s/…) so a slow nested cold-compile
//     (probe-measured: >10s) reads as IN FLIGHT, not dead. (b) Listens
//     for `grade:embed-status` postMessage beacons from the nested embed
//     (EmbedScreen posts boot milestones to its parent) and appends them
//     to the trace — the only way to see inside a frame the host won't
//     let us inspect.
// v4: the refused-vs-dead discriminator. onload fires even when a host
//     CSP REFUSES the nested navigation (empty doc) — so frame✓ proves
//     nothing. contentWindow.length is cross-origin-readable: the loaded
//     embed mounts its inner Fast Frame (length 1); a refused frame stays
//     0 forever. Polled into the trace as kids:N.
// v5: THE BUILD. srcdoc_probe came back green (2026-06-10: srcdoc frames
//     work in this host AND act as a real 1280px viewport). The stage is
//     now the self-contained renderer bundle (PREVIEW_VIEW_HTML — React +
//     @gradeui/ui vocabulary + sucrase, proven interactive in-panel via
//     preview_screen) inside a srcdoc iframe at the VIRTUAL size,
//     Fit-scaled by the shell. No nested navigation, no network. The
//     shell is a postMessage PROXY: it answers the bundle's ui/initialize,
//     forwards the host's tool-result down (appSource + themeDraftJson),
//     and swallows the bundle's size-changed (the shell owns sizing).
//     The bundle text is substituted at registration via __BUNDLE_JSON__.
// v12: real lucide icons in the shell bar (Sun/Moon/Maximize2/Minimize2,
//     path data copied VERBATIM from the installed lucide-react dist —
//     not from memory; this version's Moon/Maximize2 differ from the
//     classic paths). Chrome LEVEL is final per Ali's 2026-06-11 verdict
//     (SCALED-PANEL-PLAN.md): slim bar stays, no Studio topbar takeover.
//     ui-toolbar.ts (the unused interim lookalike) deleted the same day.
import { PREVIEW_VIEW_HASH } from "./preview-view-html";

// v12 is the TEMPLATE version (bump on shell changes); the bundle hash
// busts host resource caches whenever the renderer bundle is rebuilt.
export const PREVIEW_SCALED_URI = `ui://gradeui-mcp/preview-scaled-v12-${PREVIEW_VIEW_HASH}`;

/**
 * srcdoc_probe — SCALED-PANEL-PLAN.md step 0. One question: does THIS
 * host allow a srcdoc iframe in a panel, and is it a real viewport at
 * the size we set? The stage is a 1280×800 srcdoc frame (Fit-scaled to
 * the panel) whose content paints green "desktop ✓ 1280px viewport"
 * ONLY when `@media (min-width: 1024px)` matches inside it. Green =
 * v5 is fully green-lit. Red "mobile ✗" = srcdoc allowed but viewport
 * not honoured. Empty stage = host polices srcdoc too.
 */
export const SRCDOC_PROBE_URI = "ui://gradeui-mcp/srcdoc-probe-v1";

export const SRCDOC_PROBE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; font:13px ui-monospace,monospace;
         color: light-dark(#171717,#fafafa); background:transparent; }
  #stage { position:relative; overflow:hidden; border-radius:12px;
           border:1px solid light-dark(rgba(0,0,0,.1),rgba(255,255,255,.12)); }
  #stage iframe { position:absolute; top:0; left:0; border:0;
                  width:1280px; height:800px; transform-origin:top left; }
</style></head><body>
<div id="root">
  <div style="padding:8px 2px 10px">srcdoc viewport probe</div>
  <div id="stage"></div>
  <div id="status" style="font-size:11px;opacity:.45;padding:6px 2px"></div>
</div>
<script>
(function(){
  var dbg=["srcdoc-v1","js\\u2713"];
  function mark(s){dbg.push(s);document.getElementById("status").textContent=dbg.slice(-10).join(" \\u00b7 ");}
  var inner='<!DOCTYPE html><html><head><style>'+
    'body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;'+
    'font:700 64px system-ui;background:#fff}'+
    '#r::after{content:"mobile \\u2717 (narrow viewport)";color:#c00}'+
    '@media (min-width:1024px){#r::after{content:"desktop \\u2713 1280px viewport";color:#0a0}}'+
    '</style></head><body><div id="r"></div></body></html>';
  var stage=document.getElementById("stage");
  var f=document.createElement("iframe");
  f.setAttribute("sandbox","allow-scripts");
  f.onload=function(){mark("srcdoc-load\\u2713");};
  f.srcdoc=inner;
  stage.appendChild(f);
  function fit(){var w=stage.clientWidth;if(!w)return;var s=w/1280;
    f.style.transform="scale("+s+")";stage.style.height=Math.round(800*s)+"px";
    mark("fit:"+Math.round(s*100)+"%");
    window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/size-changed",
      params:{width:Math.ceil(document.getElementById("root").getBoundingClientRect().width),
              height:Math.ceil(document.getElementById("root").getBoundingClientRect().height)}},"*");}
  // Minimal SEP handshake (direction-agnostic, same as the other views).
  window.addEventListener("message",function(ev){var m=ev.data||{};
    if(m.id!=null&&m.method&&/initiali[sz]e/i.test(String(m.method))){
      window.parent.postMessage({jsonrpc:"2.0",id:m.id,result:{protocolVersion:"2026-01-26",
        appInfo:{name:"gradeui-srcdoc-probe",version:"0.1.0"},
        appCapabilities:{availableDisplayModes:["inline"]}}},"*");
      window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized",params:{}},"*");
      mark("host-init\\u2713");}});
  window.parent.postMessage({jsonrpc:"2.0",id:1,method:"ui/initialize",
    params:{protocolVersion:"2026-01-26",appInfo:{name:"gradeui-srcdoc-probe",version:"0.1.0"},
    appCapabilities:{availableDisplayModes:["inline"]}}},"*");
  window.parent.postMessage({jsonrpc:"2.0",method:"ui/notifications/initialized",params:{}},"*");
  if(window.ResizeObserver)new ResizeObserver(fit).observe(document.documentElement);
  setTimeout(fit,100);
})();
</script></body></html>`;

export const PREVIEW_SCALED_HTML = `<!DOCTYPE html>
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
  @media (max-width: 520px) {
    body {
      padding: 0 max(10px, env(safe-area-inset-left))
        calc(10px + env(safe-area-inset-bottom, 0px))
        max(10px, env(safe-area-inset-right));
    }
  }
  .bar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; padding: 8px 2px 10px; font-size: 13px;
  }
  .name { font-weight: 500; }
  .dim { opacity: 0.6; margin-left: 8px; font-size: 12px; font-variant-numeric: tabular-nums; }
  .actions { display: flex; gap: 6px; }
  button {
    font: inherit; font-size: 12px; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 4px 10px; border-radius: 8px;
    border: 1px solid light-dark(rgba(0,0,0,0.15), rgba(255,255,255,0.18));
    background: transparent; color: inherit;
  }
  /* Icon-only buttons (lucide SVGs) — squarer hit area than the text
     "Open in tab" button, same height. */
  #mode-btn, #fs-btn { padding: 4px 6px; }
  button:hover { background: light-dark(rgba(0,0,0,0.05), rgba(255,255,255,0.08)); }
  /* The Fit stage: a clipping viewport whose height is set from the
     virtual size × the computed scale; the iframe inside is laid out at
     FULL virtual size and transform-scaled down — the same maths as the
     canvas Fit view (scale to width, aspect preserved). */
  .stage {
    position: relative; overflow: hidden;
    border-radius: 12px;
    border: 1px solid light-dark(rgba(0,0,0,0.1), rgba(255,255,255,0.12));
    background: light-dark(#fff, #111);
  }
  .stage iframe {
    position: absolute; top: 0; left: 0; border: 0; display: block;
    transform-origin: top left;
  }
  .empty { padding: 32px; text-align: center; font-size: 13px; opacity: 0.6; }
  .empty a { color: inherit; }
</style>
</head>
<body>
<div id="root">
<div class="bar">
  <div style="display:flex;align-items:center;gap:8px;min-width:0">
    <!-- The Grade pixel "G" — verbatim from apps/docs/components/
         grade-logo.tsx (fill=currentColor, inherits the bar's text
         colour). Keep in sync with that component. -->
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" role="img" aria-label="Grade" style="flex-shrink:0">
      <rect y="4" width="4" height="4"/><rect y="8" width="4" height="4"/><rect y="12" width="4" height="4"/><rect y="16" width="4" height="4"/><rect y="20" width="4" height="4"/><rect y="24" width="4" height="4"/>
      <rect x="4" y="28" width="4" height="4"/><rect x="8" y="28" width="4" height="4"/><rect x="12" y="28" width="4" height="4"/><rect x="16" y="28" width="4" height="4"/>
      <rect x="24" y="20" width="4" height="4"/><rect x="20" y="24" width="4" height="4"/>
      <path d="M20 28H24L22 30L20 32V28Z"/><path d="M24 24H28L26 26L24 28V24Z"/><path d="M4 4H8L6 6L4 8V4Z"/><path d="M22 22L24 20V24H20L22 22Z"/><path d="M2 2L4 0V4H0L2 2Z"/><path d="M18 26L20 24V28H16L18 26Z"/>
      <rect x="28" y="28" width="4" height="4"/><rect x="28" y="24" width="4" height="4"/><rect x="28" y="20" width="4" height="4"/><rect x="28" y="16" width="4" height="4"/><rect x="24" y="16" width="4" height="4"/>
      <path d="M24 4H28V8L26 6L24 4Z"/><path d="M0 28H4V32L2 30L0 28Z"/>
      <rect x="20" y="16" width="4" height="4"/><rect x="16" y="16" width="4" height="4"/><rect x="28" y="4" width="4" height="4"/>
      <path d="M28 0L30 2L32 4H28V0Z"/><path d="M4 24L6 26L8 28H4V24Z"/>
      <rect x="24" width="4" height="4"/><rect x="20" width="4" height="4"/><rect x="16" width="4" height="4"/><rect x="12" width="4" height="4"/><rect x="8" width="4" height="4"/><rect x="4" width="4" height="4"/>
    </svg>
    <span class="name" id="name">Grade screen</span><span class="dim" id="dim"></span>
  </div>
  <div class="actions">
    <!-- Icon content is injected by JS (ICONS map) — real lucide SVGs,
         never unicode glyph stand-ins. -->
    <button id="mode-btn" title="Toggle light/dark" aria-label="Toggle light/dark" hidden></button>
    <button id="fs-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen" hidden></button>
    <button id="open-btn" hidden>Open in tab</button>
  </div>
</div>
<div class="stage" id="stage"><div class="empty">Connecting…</div></div>
<div id="status" style="font-size:11px;opacity:0.45;padding:6px 2px;font-family:ui-monospace,monospace;"></div>
</div>
<script>
(function () {
  // Lifecycle trace — the only console we have inside a host's sandboxed
  // panel iframe. Reads like: v1 js✓ · init✓:cowork · recv:tool-result ·
  // frame✓ · fit:62%
  var dbg = ["scaled-v12", "js✓"];

  // ── lucide icons ────────────────────────────────────────────────────
  // Path data copied VERBATIM from the installed lucide-react dist
  // (node_modules/lucide-react/dist/esm/icons/{sun,moon,maximize-2,
  // minimize-2}.js) — the same icons the real preview header renders.
  // Do not hand-edit; re-copy from the package if lucide is upgraded.
  // Sizes mirror the React header: 14px for sun/moon (h-3.5), 16px for
  // the fullscreen pair (h-4).
  function lucideSvg(size, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size +
      '" height="' + size + '" viewBox="0 0 24 24" fill="none"' +
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
      ' stroke-linejoin="round" aria-hidden="true" style="display:block">' +
      inner + "</svg>";
  }
  var ICONS = {
    sun: lucideSvg(14, '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
    moon: lucideSvg(14, '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>'),
    maximize2: lucideSvg(16, '<path d="M15 3h6v6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/><path d="M9 21H3v-6"/>'),
    minimize2: lucideSvg(16, '<path d="m14 10 7-7"/><path d="M20 10h-6V4"/><path d="m3 21 7-7"/><path d="M4 14h6v6"/>')
  };
  function mark(s) {
    dbg.push(s);
    var el = document.getElementById("status");
    if (el) el.textContent = dbg.slice(-14).join(" · ");
  }

  var nextId = 1;
  var pending = {};
  var state = {
    embedUrl: null,
    vw: 1280, vh: 800,        // virtual render size
    frame: null, framePainted: false,
    displayMode: "inline",
  };

  function send(method, params) {
    var id = nextId++;
    window.parent.postMessage({ jsonrpc: "2.0", id: id, method: method, params: params }, "*");
    return new Promise(function (resolve, reject) {
      pending[id] = { resolve: resolve, reject: reject };
    });
  }
  // send() with a deadline. Some hosts silently IGNORE ui/* requests they
  // don't implement (observed: request-display-mode + open-link in the
  // desktop app, 21 Jul 2026) — the promise then hangs forever and the
  // button looks dead. A timeout turns "host ignored us" into a rejection
  // the caller can fall back from.
  function sendT(method, params, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () {
        if (!done) { done = true; reject(new Error("host timeout: " + method)); }
      }, ms || 700);
      send(method, params).then(function (r) {
        if (!done) { done = true; clearTimeout(t); resolve(r); }
      }, function (e) {
        if (!done) { done = true; clearTimeout(t); reject(e); }
      });
    });
  }
  function notify(method, params) {
    window.parent.postMessage({ jsonrpc: "2.0", method: method, params: params }, "*");
  }
  window.addEventListener("message", function (event) {
    // HOST traffic only — the child srcdoc frame's messages are handled
    // by the proxy listener below. Without this guard the child's
    // ui/initialize REQUEST also hit the direction-agnostic handshake
    // here, which answered it UPWARD to the host ("response for an
    // unknown message ID").
    if (state.frame && event.source === state.frame.contentWindow) return;
    var msg = event.data || {};
    if (msg.id != null && pending[msg.id]) {
      var p = pending[msg.id];
      delete pending[msg.id];
      if (msg.error) p.reject(msg.error); else p.resolve(msg.result);
      return;
    }
    if (msg.method) mark("recv:" + String(msg.method).replace("ui/notifications/", ""));
    // Direction-agnostic handshake (see ui-template.ts).
    if (msg.id != null && msg.method && /initiali[sz]e/i.test(String(msg.method))) {
      window.parent.postMessage({
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2026-01-26",
          appInfo: { name: "gradeui-preview-scaled", version: "0.1.0" },
          appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
        },
      }, "*");
      mark("host-init✓");
      notify("ui/notifications/initialized", {});
      return;
    }
    if (msg.method === "ui/notifications/tool-result") {
      onResult(msg.params || {});
    } else if (msg.method === "ui/notifications/tool-input") {
      state.inputParams = msg.params || {};
    } else if (msg.method && /host.?context/i.test(String(msg.method))) {
      // Host reports the LIVE display mode (it can change without us
      // asking — user hits Escape in fullscreen). Keep the icon honest
      // and re-fit: the panel just changed size.
      var ctx = (msg.params || {});
      var dm = ctx.displayMode || (ctx.hostContext || {}).displayMode;
      if (dm === "inline" || dm === "fullscreen") {
        state.displayMode = dm;
        updateFsBtn();
        setTimeout(applyFit, 50);
      }
    } else if (msg.method === "ui/resource-teardown" && msg.id != null) {
      window.parent.postMessage({ jsonrpc: "2.0", id: msg.id, result: {} }, "*");
    }
  });

  // ── fullscreen (shell-owned; the bare bundle has no chrome) ─────────
  // Same mechanism the renderer's old header used: ask the host via
  // ui/request-display-mode, trust host-context-changed for the truth.
  function updateFsBtn() {
    var b = document.getElementById("fs-btn");
    b.innerHTML = state.displayMode === "fullscreen" ? ICONS.minimize2 : ICONS.maximize2;
    b.title = state.displayMode === "fullscreen" ? "Exit fullscreen" : "Fullscreen";
  }
  function wireFullscreen() {
    var b = document.getElementById("fs-btn");
    b.hidden = false;
    updateFsBtn();
    // NATIVE fallback path: when the host ignores request-display-mode
    // (sendT timeout), take the panel document itself fullscreen via the
    // Fullscreen API — needs the iframe's allow="fullscreen", so it can
    // still fail; then we hide the button rather than lie. Escape exits
    // native fullscreen without us — sync the icon from the event.
    document.addEventListener("fullscreenchange", function () {
      state.displayMode = document.fullscreenElement ? "fullscreen" : "inline";
      updateFsBtn();
      setTimeout(applyFit, 50);
    });
    b.onclick = function () {
      // Already in NATIVE fullscreen → plain exit, no host round-trip.
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
        return;
      }
      var next = state.displayMode === "fullscreen" ? "inline" : "fullscreen";
      sendT("ui/request-display-mode", { mode: next }, 700).then(function (r) {
        var applied = (r && r.displayMode) || (r && r.mode) || next;
        if (applied === "inline" || applied === "fullscreen") {
          state.displayMode = applied;
        }
        updateFsBtn();
        mark("fs:" + state.displayMode);
        setTimeout(applyFit, 50);
      }).catch(function () {
        if (next === "fullscreen" && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().then(function () {
            mark("fs:native");
          }).catch(function () {
            mark("fs✗ (host+native)");
            b.hidden = true;
          });
        } else {
          mark("fs✗ (host lacks display-mode)");
          b.hidden = true;
        }
      });
    };
  }

  function reportSize() {
    var root = document.getElementById("root");
    var rect = root.getBoundingClientRect();
    notify("ui/notifications/size-changed", {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height + rect.top),
    });
  }

  /** The Fit maths: scale the virtual canvas to the stage's width,
   *  set the stage's height from the scaled virtual height. CLAMPED at
   *  100% — same as the canvas's fitZoom (Math.min(1, …)): a 390px
   *  phone screen in a 940px panel renders at 1:1 and centres, never
   *  magnified (the 188% blow-up bug, 2026-06-10). */
  function applyFit() {
    var stage = document.getElementById("stage");
    if (!state.frame) return;
    var w = stage.clientWidth;
    if (!w) return;
    var scale = Math.min(1, w / state.vw);
    state.frame.style.width = state.vw + "px";
    state.frame.style.height = state.vh + "px";
    state.frame.style.transform = "scale(" + scale + ")";
    // Centre when the (scaled) virtual width is narrower than the panel.
    var scaledW = Math.round(state.vw * scale);
    state.frame.style.left = Math.max(0, Math.round((w - scaledW) / 2)) + "px";
    stage.style.height = Math.round(state.vh * scale) + "px";
    var pct = Math.round(scale * 100);
    document.getElementById("dim").textContent =
      (pct === 100 ? "1:1" : "Fit \\u00b7 " + pct + "%") +
      " \\u00b7 " + state.vw + "\\u00d7" + state.vh;
    mark("fit:" + pct + "%");
    reportSize();
  }

  // The renderer bundle (PREVIEW_VIEW_HTML) — substituted at resource
  // registration: JSON.stringify'd, "<" escaped to \\u003c.
  var BUNDLE = __BUNDLE_JSON__;

  // ── child proxy ─ the bundle thinks WE are the host ─────────────────
  // It speaks SEP JSON-RPC to window.parent (us). Answer its initialize,
  // deliver the real host's tool-input/result down, swallow its
  // size-changed (the shell owns sizing via the Fit transform), forward
  // open-link up.
  window.addEventListener("message", function (event) {
    var cw = state.frame && state.frame.contentWindow;
    if (!cw || event.source !== cw) return;
    var m = event.data || {};
    if (m.id != null && m.method && /initiali[sz]e/i.test(String(m.method))) {
      cw.postMessage({ jsonrpc: "2.0", id: m.id, result: {
        protocolVersion: "2026-01-26",
        hostInfo: { name: "gradeui-scaled-shell", version: "0.1.0" },
        hostCapabilities: {},
      } }, "*");
      mark("child-init✓");
      deliverToChild();
      return;
    }
    if (m.method === "ui/notifications/initialized") {
      mark("child-ready");
      deliverToChild();
      return;
    }
    if (m.method === "ui/notifications/size-changed") return;
    if (m.id != null && m.method === "ui/open-link") {
      send("ui/open-link", m.params || {});
      cw.postMessage({ jsonrpc: "2.0", id: m.id, result: {} }, "*");
      return;
    }
    if (m.id != null && m.method) {
      cw.postMessage({ jsonrpc: "2.0", id: m.id, result: {} }, "*");
    }
  });

  // Deliver tool-input + tool-result into the child. Retried — the
  // bundle may not be listening yet on the first attempt.
  var delivered = 0;
  function deliverToChild() {
    var cw = state.frame && state.frame.contentWindow;
    if (!cw || !state.resultParams || delivered > 6) return;
    delivered++;
    if (state.inputParams) {
      cw.postMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-input", params: state.inputParams }, "*");
    }
    cw.postMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-result", params: state.resultParams }, "*");
    mark("sent:" + delivered);
  }

  function renderFrame() {
    var stage = document.getElementById("stage");
    stage.innerHTML = "";
    var f = document.createElement("iframe");
    // srcdoc = inline document, NO navigation — the green-probed path
    // (srcdoc_probe 2026-06-10: real 1280px viewport inside the panel).
    // allow-scripts only; the renderer bundle is storage-safe by design.
    f.setAttribute("sandbox", "allow-scripts");
    f.title = "Grade screen (scaled, in-panel render)";
    f.onload = function () {
      mark("bundle-load✓");
      applyFit();
      deliverToChild();
      setTimeout(deliverToChild, 800);
      setTimeout(deliverToChild, 2500);
    };
    state.frame = f;
    f.srcdoc = BUNDLE;
    stage.appendChild(f);
    applyFit();
  }

  function onResult(result) {
    var sc = (result && result.structuredContent) || {};
    if (!sc.appSource) mark("result:no-source");
    state.resultParams = result || {};
    state.vw = sc.width || 1280;
    state.vh = sc.height || 800;
    document.getElementById("name").textContent = sc.name || "Grade screen";
    if (sc.embedUrl) {
      var openBtn = document.getElementById("open-btn");
      openBtn.hidden = false;
      openBtn.onclick = function () {
        // Direct window.open FIRST (we're inside a user gesture; works
        // when the panel's sandbox allows popups) — returns null when
        // blocked, and only then do we fall back to asking the host.
        // Never both: no double-open on hosts where each path works.
        var w = null;
        try { w = window.open(sc.embedUrl, "_blank", "noopener"); } catch (e) {}
        if (w) { mark("open:direct"); return; }
        send("ui/open-link", { url: sc.embedUrl });
        mark("open:host");
      };
    }
    wireFullscreen();
    wireModeToggle(sc);
    renderFrame();
  }

  // Light/dark parity with the standard preview panel. The bare bundle
  // has no chrome, so the SHELL owns the toggle: flip mode on the stored
  // result params and re-deliver — the bundle re-renders with the other
  // theme slot. (Same message channel as everything else; no new
  // protocol.)
  function wireModeToggle(sc) {
    var b = document.getElementById("mode-btn");
    b.hidden = false;
    var apply = function () {
      var m = (state.resultParams.structuredContent || {}).mode || "light";
      // Single toggle shows the mode you'd switch TO (sun while dark).
      b.innerHTML = m === "dark" ? ICONS.sun : ICONS.moon;
      b.title = m === "dark" ? "Switch to light" : "Switch to dark";
    };
    apply();
    b.onclick = function () {
      var s = state.resultParams.structuredContent || {};
      s.mode = s.mode === "dark" ? "light" : "dark";
      state.resultParams.structuredContent = s;
      delivered = 0; // re-open the delivery budget for the re-render
      deliverToChild();
      apply();
      mark("mode:" + s.mode);
    };
  }

  send("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "gradeui-preview-scaled", version: "0.1.0" },
    appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
  }).then(function (result) {
    var hostName = (result && result.hostInfo && result.hostInfo.name) || "";
    mark("init✓:" + (hostName || "?"));
    notify("ui/notifications/initialized", {});
    reportSize();
  }).catch(function (e) {
    mark("init✗" + ((e && e.message) ? ":" + e.message : ""));
  });

  if (window.ResizeObserver) {
    new ResizeObserver(applyFit).observe(document.documentElement);
  }
})();
</script>
</body>
</html>`;
