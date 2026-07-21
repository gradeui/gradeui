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
// v4: monotonic render gate (iOS race fix — see grade-preview-widget-fix.md).
// v5: poster re-probe on tool-result — status is monotonic but CONTENT must
//     refresh, or the early self-load leaves the panel one capture behind.
// v6: LIVE BY DEFAULT — when the host allows nested frames (claude.ai web),
//     the panel now renders the real interactive screen (the /e/<token>
//     embed) on tool-result instead of the PNG; the poster self-load is the
//     instant placeholder, and a toggle drops back to the static image.
// v7: poster slot default now matches the SERVER's capture default (light).
//     The old `colorMode || "dark"` polled latest-dark.png for calls that
//     omitted colorMode while the capture uploaded latest-light.png —
//     twelve 404 probes and a panel stuck on "Rendering…" (Ali, 21 Jul).
//     preview_image also ships the PNG as structuredContent.imageDataUri
//     now, so an apps-capable host paints instantly without polling.
export const PREVIEW_RESOURCE_URI = "ui://gradeui-mcp/preview-v7";

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
  /* Hosts give the panel iframe no gutter — on phones the stage hits the
     screen edge. Pad ourselves on narrow viewports (safe-area aware). */
  @media (max-width: 520px) {
    body {
      padding: 0 max(10px, env(safe-area-inset-left))
        calc(10px + env(safe-area-inset-bottom, 0px))
        max(10px, env(safe-area-inset-right));
    }
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
<div id="root">
<div class="bar">
  <div><span class="name" id="name">Grade screen</span><span class="dim" id="dim"></span></div>
  <div class="actions">
    <button id="live-btn" hidden>Live</button>
    <button id="open-btn" hidden>Open embed</button>
  </div>
</div>
<div class="stage" id="stage"><div class="empty">Rendering…</div></div>
<div id="status" style="font-size:11px;opacity:0.45;padding:6px 2px;font-family:ui-monospace,monospace;"></div>
</div>
<script>
(function () {
  // Lifecycle trace rendered into the panel itself — the only console we
  // have inside a host iframe we can't inspect. Reads like:
  //   v3 js✓ · init✓:claude-web · recv:tool-input · poster✓
  var dbg = ["v5", "js✓"];
  function mark(s) {
    dbg.push(s);
    var el = document.getElementById("status");
    // Cap the visible trace — iOS fires host-context-changed in bursts and
    // an ever-growing line churns layout (reportSize loops).
    if (el) el.textContent = dbg.slice(-14).join(" · ");
  }

  var nextId = 1;
  var pending = {};
  // MONOTONIC render state (iOS race fix): "painted" only ever goes
  // false -> true, and it is the ONLY gate on the poster path. The old
  // "gotResult" flag let an early tool-result (which may carry no image --
  // structuredContent is host-gated) permanently block the poster probe:
  // whichever message lost the race left the panel on "Rendering..."
  // forever. Nothing may ever move the panel backward from painted.
  var state = {
    embedUrl: null, imageDataUri: null, live: false, hostName: "",
    posterBase: "__POSTER_BASE__", args: null, painted: false, posterTries: 0
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
          appInfo: { name: "gradeui-preview", version: "0.5.0" },
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
      onInput(msg.params || {});
    } else if (msg.method === "ui/resource-teardown" && msg.id != null) {
      window.parent.postMessage({ jsonrpc: "2.0", id: msg.id, result: {} }, "*");
    }
  });

  function reportSize() {
    // Measure the CONTENT wrapper, never the document: scrollHeight is
    // floored at the iframe's viewport height, so once the host grows the
    // frame it can never shrink — every transient growth ratchets the gap
    // bigger (observed on iOS). #root's rect is honest in both directions.
    var root = document.getElementById("root");
    var rect = root.getBoundingClientRect();
    notify("ui/notifications/size-changed", {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height + rect.top),
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
    // Forward-only: once anything has painted, "Rendering…" is unreachable.
    state.painted = true;
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
    // Hosts REUSE one panel instance across calls (observed: claude-ios).
    // A new tool-input means a new render cycle: if we've already painted
    // a previous call's image, swap to the new target's poster now rather
    // than waiting for (a possibly payload-less) tool-result.
    if (state.painted) {
      refreshPoster();
    } else {
      tryPoster();
    }
  }

  function tryPoster() {
    // Gate on "painted" ONLY -- a tool-result without an image payload must
    // never block the poster path (that race froze iOS on "Rendering...").
    if (state.painted || !state.args) return;
    // Default must MATCH the server's capture default (colorMode ?? "light"
    // in tools.ts) — "dark" here polled a poster slot the capture never
    // wrote when the call omitted colorMode.
    var mode = state.args.colorMode || "light";
    var src = state.posterBase + "/" + state.args.screenId +
      "/latest-" + mode + ".png?v=" + Date.now();
    var probe = new Image();
    var settled = false;
    probe.onload = function () {
      settled = true;
      if (state.painted) return;
      mark("poster✓");
      state.imageDataUri = src;
      renderImage();
      reportSize();
    };
    probe.onerror = function () {
      settled = true;
      state.posterTries += 1;
      mark("poster✗" + state.posterTries);
      if (state.posterTries < 12) setTimeout(tryPoster, 4000);
    };
    // Watchdog: iOS can leave an Image() probe in limbo during reflow /
    // backgrounding — neither load nor error. Re-probe instead of sitting
    // silently on "Rendering…".
    setTimeout(function () {
      if (!settled && !state.painted) {
        state.posterTries += 1;
        mark("poster⌛" + state.posterTries);
        if (state.posterTries < 12) tryPoster();
      }
    }, 8000);
    probe.src = src;
  }

  // Content refresh — NOT gated on painted. The self-load paints the
  // PREVIOUS poster (it fires on tool-input, before a fresh capture
  // exists); when tool-result arrives without an image payload
  // (structuredContent is host-gated), the new capture has already been
  // uploaded to the same poster path — re-probe with a fresh cache-buster
  // and swap the pixels in place. Status stays forward-only.
  function refreshPoster() {
    if (!state.args) return;
    var mode = state.args.colorMode || "dark";
    var src = state.posterBase + "/" + state.args.screenId +
      "/latest-" + mode + ".png?v=" + Date.now();
    var probe = new Image();
    probe.onload = function () {
      state.imageDataUri = src;
      renderImage();
      reportSize();
      mark("poster↻");
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
    // Attempt the live render on ALL hosts, Desktop included. The host's
    // sandboxed panel iframe is the boundary; if a host genuinely refuses
    // the nested frame it comes up blank and the "Static" toggle is the
    // fallback. (Previously this blocked Desktop on the assumption it can't
    // nest frames — testing whether that was a red herring.)
    return true;
  }

  function onResult(result) {
    var sc = result.structuredContent || {};
    // Authoritative when it carries pixels; harmless when it doesn't —
    // a payload-less result (structuredContent is host-gated) must leave
    // the poster path running, never block it.
    var resultImg = sc.imageDataUri || sc.previewUrl || null;
    if (resultImg) {
      state.imageDataUri = resultImg;
    } else {
      mark("result:no-img");
      // The capture (if one ran) finished before this result was sent —
      // the fresh poster is already at the deterministic path. Re-probe
      // whether or not we've painted: first paint if we lost the race,
      // content upgrade if the self-load painted the previous capture.
      if (state.painted) {
        refreshPoster();
      } else {
        setTimeout(tryPoster, 0);
      }
    }
    state.embedUrl = sc.embedUrl || null;
    document.getElementById("name").textContent = sc.name || "Grade screen";
    document.getElementById("dim").textContent = sc.width && sc.height ? sc.width + "\\u00d7" + sc.height : "";

    var liveBtn = document.getElementById("live-btn");
    var openBtn = document.getElementById("open-btn");
    if (state.embedUrl) {
      openBtn.hidden = false;
      openBtn.textContent = "Open in tab";
      openBtn.onclick = function () {
        send("ui/open-link", { url: state.embedUrl });
      };
      if (liveAllowed()) {
        // LIVE BY DEFAULT: render the real interactive screen now. The
        // button toggles back to the static capture — handy if a host's CSP
        // blocks the nested frame and it comes up blank. The poster the
        // self-load already painted is the instant placeholder under this.
        liveBtn.hidden = false;
        state.live = true;
        liveBtn.textContent = "Live";
        liveBtn.setAttribute("data-on", "true");
        liveBtn.onclick = function () {
          state.live = !state.live;
          liveBtn.setAttribute("data-on", String(state.live));
          liveBtn.textContent = state.live ? "Live" : "Static";
          if (state.live) renderLive(); else renderImage();
        };
        renderLive();
        reportSize();
        return;
      }
    }
    if (state.imageDataUri) renderImage();
    reportSize();
  }

  send("ui/initialize", {
    protocolVersion: "2026-01-26",
    appInfo: { name: "gradeui-preview", version: "0.1.0" },
    // fullscreen: hosts that support it (spec display modes) get an
    // expand affordance on the panel — tap to see the render full-screen.
    appCapabilities: { availableDisplayModes: ["inline", "fullscreen"] },
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
