// record-flow-lossless.mjs — record a WALKED FLOW (click links across
// screens + scroll) in the live /e/ embed as a PRISTINE, crisp mp4 by
// FRAME-STEPPING: screenshot every frame at true 2x-native density, then
// stitch with ffmpeg. Same flow-script format as record-flow.mjs, but
// where that one screen-records in real time (soft raster, esp. maps),
// this one renders at the content's NATURAL size with deviceScaleFactor
// 2 and captures genuine 2x PNG frames (2560px wide, sharp map tiles).
//
// WHY IT'S CRISPER
//   record-flow.mjs uses the embed's scale-to-viewport trick: content at
//   --w laid out inside a huge 2560x1600 viewport, then a real-time video
//   grab. That upscales raster content (the Google map) and softens it.
//   Here the viewport IS --w and deviceScaleFactor is 2, so every pixel
//   is captured 1:1 at 2x device density — exactly like capture-screens.
//   Screenshots are slow, but that's FINE: this is frame-stepping, not
//   real time. Each PNG becomes one 1/fps slice on playback.
//
//   Only the MOVING parts pay for that slowness: scroll + transition
//   frames take one real screenshot each. A DWELL (a static pause, made
//   generous so you can talk over it) takes ONE screenshot and hardlinks
//   it across the held frames — a 4s dwell is 1 shot, not 120.
//
// USAGE (repo root, dev server running):
//   node scripts/record-flow-lossless.mjs --flow=my-flow.json --out=demo.mp4
//   node scripts/record-flow-lossless.mjs --flow=my-flow.json --out=demo.mp4 --fps=30
//   node scripts/record-flow-lossless.mjs --flow=my-flow.json --out=demo.mp4 --keep-frames
//
// FLOW JSON (identical to record-flow.mjs):
//   {
//     "project": "<uuid>",
//     "start":   "<designId>",            // first screen
//     "w": 1280,                          // content layout width  (optional, default 1280)
//     "h": 834,                           // content layout height (optional, default 834)
//     "steps": [
//       { "dwell": 1400 },
//       { "click": "<css in the screen>", "waitFor": "<css that proves the next screen>" },
//       { "scroll": "bottom", "ms": 3500 },
//       { "scrollBy": 600, "ms": 1200 },
//       { "scrollTo": "<sel>", "ms": 1000 },
//       { "dwell": 900 }
//     ]
//   }
//   (any legacy "viewport" is IGNORED — capture size is (w x h) x2.)
//
// Reads the Supabase key from ./.mcp.json. ffmpeg comes from the
// ffmpeg-static devdep (no system ffmpeg needed).

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..");
const require = createRequire(path.join(REPO, "apps/mcp-server/package.json"));
const { chromium } = require("playwright");

// ffmpeg: prefer the ffmpeg-static binary (globbed from pnpm's store so
// it resolves regardless of which package declares it), else system PATH.
function resolveFfmpeg() {
  try { return require("ffmpeg-static"); } catch {}
  const pnpm = path.join(REPO, "node_modules/.pnpm");
  try {
    const dir = fs.readdirSync(pnpm).find((d) => d.startsWith("ffmpeg-static@"));
    if (dir) {
      const bin = path.join(pnpm, dir, "node_modules/ffmpeg-static/ffmpeg");
      if (fs.existsSync(bin)) return bin;
    }
  } catch {}
  return "ffmpeg"; // system PATH fallback
}
const FFMPEG = resolveFfmpeg();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const BASE = (args.base || "http://localhost:3000").replace(/\/+$/, "");
const DWELL_SCALE = Number(args["dwell-scale"]) || 1; // stretch pauses for talk-over
const FPS = Math.max(1, Number(args.fps) || 30);
const KEEP_FRAMES = Boolean(args["keep-frames"]);

// Built-in demo: brightlocal All Locations -> Minus 1 Studios -> hub -> scroll.
const DEMO_FLOW = {
  project: "47e40175-0d55-4d21-960b-26bdf6b01282",
  start: "dmrotrgstba3l",
  w: 1280,
  steps: [
    { dwell: 1400 },
    { click: '[data-hook="location-card-minus-one-studios"]', waitFor: '[data-hook="hub-ai-insights"]' },
    { dwell: 1200 },
    { scroll: "bottom", ms: 3500 },
    { dwell: 900 },
  ],
};
const flow = args.flow ? JSON.parse(fs.readFileSync(args.flow, "utf8")) : DEMO_FLOW;

// THE CRISPNESS WIN: content at its NATURAL size (no scale-up), captured
// at deviceScaleFactor 2. viewport = W x H CSS px -> 2W x 2H device px.
// Default 1280x834 (834 is the min content height) -> 2560x1668 frames.
const W = flow.w ?? 1280;
const H = flow.h ?? 834;
const DEVICE_W = W * 2;
const DEVICE_H = H * 2;
const __d = new Date(); const __p = (n) => String(n).padStart(2, "0");
const __STAMP = `${__d.getFullYear()}${__p(__d.getMonth()+1)}${__p(__d.getDate())}-${__p(__d.getHours())}${__p(__d.getMinutes())}${__p(__d.getSeconds())}`;
const __stamp = (p) => p.replace(/(\.[^.]+)$/, `-${__STAMP}$1`);
const OUT = __stamp(args.out && args.out !== true ? args.out : `${flow.start}-flow-lossless.mp4`);

const mcp = JSON.parse(fs.readFileSync(path.join(REPO, ".mcp.json"), "utf8"));
const KEY = mcp.mcpServers["gradeui-dev"].env.SUPABASE_SERVICE_ROLE_KEY;
const SB = mcp.mcpServers["gradeui-dev"].env.SUPABASE_URL
  ? mcp.mcpServers["gradeui-dev"].env.SUPABASE_URL.replace(/\/+$/, "")
  : "https://fbftniekvvkbduwpuzfs.supabase.co";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sb(pathname, opts = {}) {
  return new Promise((res, rej) => {
    const req = https.request(new URL(SB + pathname), {
      method: opts.method || "GET",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", ...(opts.headers || {}) },
    }, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(d)); });
    req.on("error", rej);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}
async function ensureToken(project, designId) {
  const rows = JSON.parse(await sb(`/rest/v1/share_links?project_id=eq.${project}&design_id=eq.${designId}&mode=eq.view&revision_id=is.null&revoked=eq.false&order=created_at.desc&limit=1&select=token,color_mode`));
  if (rows[0]) {
    if (rows[0].color_mode !== "light") await sb(`/rest/v1/share_links?token=eq.${rows[0].token}`, { method: "PATCH", body: { color_mode: "light" } });
    return rows[0].token;
  }
  return JSON.parse(await sb(`/rest/v1/share_links`, { method: "POST", headers: { Prefer: "return=representation" }, body: { project_id: project, design_id: designId, mode: "view", color_mode: "light" } }))[0].token;
}

// Chrome to hide: the Next dev "N" nub + the flow Back chip (outer page),
// and the shell tweaker corner (inside the screen iframe). A CSP on the
// share page blocks injected <style> tags, so we hide via INLINE style
// (not blocked) driven by a MutationObserver — the chip mounts only after
// the first goto and re-renders through the flow, so a one-shot hide
// misses it. Installed once; self-maintaining.
async function installHiders(page) {
  await page.evaluate(() => {
    const hide = () => {
      document.querySelectorAll("nextjs-portal").forEach((n) => n.remove());
      document.querySelectorAll('[title="Back (Esc)"]').forEach((b) => b.style.setProperty("display", "none", "important"));
      document.querySelectorAll("button").forEach((b) => {
        if ((b.textContent || "").trim() === "← Back") b.style.setProperty("display", "none", "important");
      });
    };
    hide();
    new MutationObserver(hide).observe(document.documentElement, { childList: true, subtree: true });
  }).catch(() => {});
}
const iframe = (page) => page.frames().find((f) => f !== page.mainFrame());
// The shell tweaker corner is invisible when closed, so it's NOT hidden
// — that lets a flow OPEN it (key: "Alt+T") to demo theme switching.
async function hideInner(page) {}
// Re-assert both hiders (call after a navigation swaps the screen).
async function rehide(page) { await installHiders(page); await hideInner(page); }

// ── native view-transition control (the crispness win, part 2) ─────────
// The external-sandbox screen swap uses document.startViewTransition — a
// 200ms cross-fade + shared-element morph (e.g. the gds-lsg-map mini-map
// growing into the full LSG map), running in the same-origin sandbox
// iframe (apps/docs/app/external-sandbox/page.tsx). Frame-stepping that in
// REAL time is the bug this fixes: screenshots sample whatever partial
// state exists and a dwell then holds a mid-morph frame — the clip freezes
// half-morphed. Instead we take deterministic control of the transition's
// animation CLOCK: patch startViewTransition, and the instant its
// ::view-transition pseudo-elements are ready, PAUSE every one of their
// animations. We then seek their currentTime by exactly 1000/fps per frame
// and screenshot — an exact, smooth morph (same principle as render-motion's
// renderFrame seek, applied to the native VT timeline). finish() then
// completes it into the fully-settled target page. Only the external
// registry path animates; the gradeui fast-sandbox path swaps instantly
// (no startViewTransition), which falls through to the waitFor capture.
async function armVT(frame) {
  if (!frame) return;
  await frame.evaluate(() => {
    if (!window.__gradeVT) {
      const d = document;
      const hook = (window.__gradeVT = { armed: false, started: false, ready: false, done: false, anims: [], maxEnd: 0, unsupported: false });
      hook.arm = function () { this.armed = true; this.started = this.ready = this.done = false; this.anims = []; this.maxEnd = 0; };
      hook.seek = function (ms) { for (const a of this.anims) { try { const e = a.effect.getComputedTiming().endTime; a.currentTime = Math.min(ms, e); } catch {} } };
      hook.finishAll = function () { for (const a of this.anims) { try { a.finish(); } catch {} } };
      const orig = d.startViewTransition && d.startViewTransition.bind(d);
      if (!orig) { hook.unsupported = true; }
      else {
        d.startViewTransition = function (cb) {
          const t = orig(cb);
          hook.started = true;
          Promise.resolve(t.ready).then(() => {
            hook.anims = d.getAnimations().filter((a) => ((a.effect && a.effect.pseudoElement) || "").startsWith("::view-transition"));
            if (hook.armed) hook.anims.forEach((a) => a.pause());
            hook.maxEnd = hook.anims.reduce((m, a) => { try { return Math.max(m, a.effect.getComputedTiming().endTime); } catch { return m; } }, 0);
            hook.ready = true;
          }).catch(() => { hook.ready = true; });
          Promise.resolve(t.finished).catch(() => {}).finally(() => { hook.done = true; });
          return t;
        };
      }
    }
    window.__gradeVT.arm();
  }).catch(() => {});
}

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const framesFor = (ms, fallback) => Math.max(1, Math.round(((ms ?? fallback) / 1000) * FPS));

const token = await ensureToken(flow.project, flow.start);
const url = `${BASE}/e/${token}?w=${W}`;
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "grade-frames-"));
console.log(`lossless frame-step · ${DEVICE_W}x${DEVICE_H} (2x of ${W}x${H}) · ${FPS}fps · ${url}`);
console.log(`frames → ${framesDir}`);

const browser = await chromium.launch({ headless: true, channel: "chromium" }).catch(() => chromium.launch({ headless: true }));
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// ── frame timeline + capture helpers ──────────────────────────────────
// `frame` is the OUTPUT frame index (what ffmpeg stitches, f%06d.png).
// MOVING frames (scroll, transition) each need a real screenshot. A DWELL
// is static, so it costs ONE screenshot that we then HARDLINK across the
// remaining indices — same inode, ~zero disk + microseconds — instead of
// re-shooting an identical screen dwell*fps times. `realShots` tracks how
// many actual (slow) screenshots we took vs the total frame count.
let frame = 0;
let realShots = 0;
let shotWallMs = 0;
const framePath = (i) => path.join(framesDir, `f${String(i).padStart(6, "0")}.png`);
// Take a real screenshot into the next index; return its path.
async function shoot() {
  const p = framePath(frame);
  const t0 = Date.now();
  await page.screenshot({ path: p, type: "png" });
  shotWallMs += Date.now() - t0;
  realShots++;
  frame++;
  return p;
}
// Repeat an already-captured PNG across the next `n` indices (hardlink,
// with a copy fallback for exotic filesystems that reject cross-refs).
function hold(src, n) {
  for (let i = 0; i < n; i++) {
    const dest = framePath(frame);
    try { fs.linkSync(src, dest); } catch { fs.copyFileSync(src, dest); }
    frame++;
  }
}

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
await installHiders(page);
// Wait for the first screen to actually PAINT before we capture a single
// frame — the brightlocal external sandbox cold-boots esm.sh modules +
// the Google map, which can take 5-15s. Nothing is captured during the
// boot, so it's trimmed from the video for free (frame 0 is a live screen).
const bootStart = Date.now();
await page.waitForFunction(() => {
  const f = document.querySelector("iframe"); const d = f && f.contentDocument;
  return d && d.body && (d.body.innerText || "").trim().length > 40;
}, { timeout: 45000 });
// Settle: let the map tiles, fonts, and the double-buffered preview commit
// so frame 0 is fully painted (mirrors capture-screens' settle wait).
await sleep(4500);
await rehide(page);
console.log(`booted + settled in ${((Date.now() - bootStart) / 1000).toFixed(1)}s — capturing`);

// ── drive the flow, emitting frames throughout at the target fps ──────
for (const step of flow.steps) {
  // A "section" marker = a natural intersection: add a longer breath.
  if (step.section) step.dwell = (step.dwell || 0) + (flow.sectionPause ?? 1500);
  if (step.dwell) step.dwell = Math.round(step.dwell * DWELL_SCALE);
  // KEYPRESS into the screen (iframe window) — e.g. "Alt+T" opens the
  // shell tweaker. Dispatched synthetically so it fires the app handler
  // without needing focus.
  if (step.key) {
    const parts = String(step.key).split("+");
    const k = parts.pop();
    const mods = parts.map((p) => p.toLowerCase());
    await iframe(page).evaluate(({ k, mods }) => {
      const code = k.length === 1 ? "Key" + k.toUpperCase() : k;
      window.dispatchEvent(new KeyboardEvent("keydown", {
        key: k.length === 1 ? k.toLowerCase() : k, code,
        altKey: mods.includes("alt"), ctrlKey: mods.includes("ctrl"),
        metaKey: mods.includes("meta") || mods.includes("cmd"), shiftKey: mods.includes("shift"),
        bubbles: true,
      }));
    }, { k, mods });
    await sleep(400); // let the panel open / any CSS settle
    await rehide(page);
  }
  // Native <select> change (e.g. the tweaker preset dropdown → a theme).
  if (step.select) {
    await iframe(page).locator(step.select).first().selectOption(String(step.value));
    await sleep(450); // let the re-skin settle before the held dwell frame
    await rehide(page);
  }
  // CLICK: click a goto element. If it fires a native view transition,
  // step the morph deterministically (see armVT). Otherwise (instant swap)
  // capture the swap in real time, bounded by waitFor. Either way, the
  // transition is guaranteed COMPLETE before the following dwell captures.
  if (step.click) {
    await rehide(page);          // clean VT snapshots (chrome out of the capture)
    await armVT(iframe(page));   // patch + arm the VT hook in the sandbox frame
    await iframe(page).locator(step.click).first().click();

    // Did a native view transition start? The goto round-trips via
    // postMessage before the sandbox's render() calls startViewTransition,
    // so poll briefly rather than assuming it's synchronous.
    let vt = false;
    for (let i = 0; i < 40; i++) { // up to ~2s
      vt = await iframe(page).evaluate(() => !!(window.__gradeVT && window.__gradeVT.started)).catch(() => false);
      if (vt) break;
      await sleep(50);
    }

    if (vt) {
      // Wait for the pseudo-elements (paused at ~0), then STEP the clock:
      // seek by 1000/fps per frame across the real animation duration.
      await iframe(page).waitForFunction(() => window.__gradeVT.ready === true, { timeout: 8000 }).catch(() => {});
      const meta = await iframe(page).evaluate(() => ({ maxEnd: window.__gradeVT.maxEnd, n: window.__gradeVT.anims.length })).catch(() => ({ maxEnd: 0, n: 0 }));
      if (meta.n > 0 && meta.maxEnd > 0) {
        const dt = 1000 / FPS;
        const vtSteps = Math.max(1, Math.ceil(meta.maxEnd / dt));
        for (let i = 0; i <= vtSteps; i++) {
          const ms = Math.min(i * dt, meta.maxEnd);
          await iframe(page).evaluate((m) => window.__gradeVT.seek(m), ms).catch(() => {});
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r()))).catch(() => {});
          await shoot(); // the morph is MOVING — a real screenshot per frame
        }
      }
      // Complete the transition into the fully-settled target screen.
      await iframe(page).evaluate(() => window.__gradeVT.finishAll()).catch(() => {});
      await iframe(page).waitForFunction(() => window.__gradeVT.done === true, { timeout: 5000 }).catch(() => {});
    } else if (step.waitFor) {
      // Instant-swap path (no native VT) — capture it in real time,
      // bounded, polling the selector that proves the next screen.
      const maxSwapFrames = Math.round(FPS * 1.5);
      let arrived = false;
      for (let i = 0; i < maxSwapFrames; i++) {
        await shoot();
        arrived = await iframe(page).evaluate((sel) => !!document.querySelector(sel), step.waitFor).catch(() => false);
        if (arrived) break;
      }
      if (!arrived) await iframe(page).waitForFunction((sel) => !!document.querySelector(sel), step.waitFor, { timeout: 30000 }).catch(() => {});
    }

    // MUST-FIX guarantee: never let a dwell hold a mid-morph frame. Block
    // until no ::view-transition pseudo remains AND (if given) the target
    // has settled — worst case a clean cut to the finished target page.
    await iframe(page).waitForFunction(
      (sel) => {
        const running = document.getAnimations().some((a) => ((a.effect && a.effect.pseudoElement) || "").startsWith("::view-transition"));
        return !running && (sel ? !!document.querySelector(sel) : true);
      },
      step.waitFor || null,
      { timeout: 8000 },
    ).catch(() => {});
    // Brief real-time settle (no frames captured) so the freshly-committed
    // target screen's fills / map tiles finish painting before the next
    // dwell takes its single held screenshot.
    await sleep(300);

    await rehide(page); // the swap re-rendered the screen — re-arm the hiders
  }

  // SCROLL (human-eased, easeInOutQuad), frame-stepped. Instead of sleeping
  // through the animation, we set each interpolated scrollTop and capture
  // ONE frame per animation step — sized so the scroll lasts `ms` at `fps`.
  //   scroll: "top" | "bottom"   — smooth to an end
  //   scrollBy: <px>             — relative "scroll down a bit"
  //   scrollTo: "<selector>"     — bring an element into view (~140px down)
  if (step.scroll || step.scrollBy != null || step.scrollTo) {
    // Resolve from/target once (deterministic — same DOM throughout).
    const plan = await iframe(page).evaluate((s) => {
      const vps = [...document.querySelectorAll("[data-radix-scroll-area-viewport]")];
      const v = vps.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
      if (!v) return null;
      const max = v.scrollHeight - v.clientHeight;
      let target = v.scrollTop;
      if (s.mode === "top") target = 0;
      else if (s.mode === "bottom") target = max;
      else if (s.by != null) target = v.scrollTop + s.by;
      else if (s.sel) {
        const el = document.querySelector(s.sel);
        if (el) { const r = el.getBoundingClientRect(); const vr = v.getBoundingClientRect(); target = v.scrollTop + (r.top - vr.top) - 140; }
      }
      target = Math.max(0, Math.min(max, target));
      return { from: v.scrollTop, target };
    }, { mode: typeof step.scroll === "string" ? step.scroll : null, by: step.scrollBy, sel: step.scrollTo }).catch(() => null);

    if (plan && plan.from !== plan.target) {
      const steps = framesFor(step.ms, 900);
      for (let i = 0; i <= steps; i++) {
        const top = plan.from + (plan.target - plan.from) * easeInOutQuad(i / steps);
        await iframe(page).evaluate((y) => {
          const vps = [...document.querySelectorAll("[data-radix-scroll-area-viewport]")];
          const v = vps.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
          if (v) v.scrollTop = y;
        }, top).catch(() => {});
        await shoot(); // scroll is MOVING — a real screenshot per frame
      }
    }
  }

  // DWELL: hold a STATIC screen. Take ONE screenshot, then hardlink it
  // across the remaining frames — generous multi-second pauses (to talk
  // over / let viewers absorb) cost exactly one slow screenshot each.
  if (step.dwell) {
    await rehide(page);
    const n = framesFor(step.dwell, 0);
    const still = await shoot();
    if (n > 1) hold(still, n - 1);
  }
}

await ctx.close();
await browser.close();

if (frame === 0) {
  console.error("No frames captured — check the flow steps.");
  process.exit(1);
}

// ── STITCH — mathematically lossless h264 (qp 0, yuv444p keeps full chroma) ─
console.log(`\nstitching ${frame} frames @ ${FPS}fps → ${OUT}`);
await new Promise((res, rej) => {
  const ff = spawn(FFMPEG, [
    "-y",
    "-framerate", String(FPS),
    "-start_number", "0",
    "-i", path.join(framesDir, "f%06d.png"),
    "-c:v", "libx264",
    "-qp", "0",
    "-pix_fmt", "yuv444p",
    "-movflags", "+faststart",
    OUT,
  ], { stdio: "ignore" });
  ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c))));
});

if (!KEEP_FRAMES) fs.rmSync(framesDir, { recursive: true, force: true });

const secs = frame / FPS;
console.log(`\n✅ ${OUT}`);
console.log(`   ${DEVICE_W}x${DEVICE_H} · ${frame} frames · ${secs.toFixed(1)}s @ ${FPS}fps · lossless h264 (qp0/yuv444p)`);
console.log(`   screenshots: ${realShots} real shots for ${frame} frames (dwells held from 1 shot each)`);
console.log(`   capture wall-time: ${(shotWallMs / 1000).toFixed(1)}s of shooting for ${secs.toFixed(1)}s of video (~${(shotWallMs / 1000 / secs).toFixed(1)}s wall per video-second)`);
if (KEEP_FRAMES) console.log(`   frames kept → ${framesDir}`);
console.log(`   note: for editing/grading workflows, re-stitch the frames with`);
console.log(`         -c:v prores_ks -profile:v 3   (ProRes 422 HQ, editor-friendly), or`);
console.log(`         -c:v ffv1                       (FFV1, truly lossless archival).`);
