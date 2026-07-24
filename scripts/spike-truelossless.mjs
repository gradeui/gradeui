// spike-truelossless.mjs — EXPERIMENTAL SPIKE (step 3): TRUE LOSSLESS flow
// capture that renders SMOOTH view transitions, via a fundamentally
// DETERMINISTIC frame-production mechanism. Companion research to
// record-flow-lossless.mjs (which frame-steps screenshots but FREEZES on view
// transitions because the native CSS VT runs on the browser's real-time
// animation clock, so a screenshot loop can't sample it).
//
// ── WHAT WE TRIED, AND WHAT WON ─────────────────────────────────────────
// PRIMARY ANGLE (per the spike brief): HeadlessExperimental.beginFrame — drive
// the compositor to produce ONE frame at an EXPLICIT virtual frame time.
//   VERDICT ON THIS MACHINE (macOS arm64, Playwright 1.59.1 / Chromium 147):
//   NOT AVAILABLE.
//     • New headless (channel:"chromium", --headless=new): the entire
//       `HeadlessExperimental` CDP domain is GONE — beginFrame "wasn't found".
//     • Old headless (chrome-headless-shell, the default headless:true):
//       the domain EXISTS but is non-functional on macOS:
//         - no flags      → "only supported if BeginFrameControl is enabled"
//         - +--enable-begin-frame-control → "only supported with
//           --run-all-compositor-stages-before-draw"
//         - +both flags   → the page TARGET tears down on the first beginFrame
//           (no crash log; the frame sink just closes), across
//           --disable-gpu / swiftshader / GPU.
//         - Target.createTarget({enableBeginFrameControl:true}) is the honest
//           one: "BeginFrameControl is not supported on MacOS yet".
//   So beginFrame is a dead end here. (It may still work on Linux CI, where
//   headless BeginFrameControl is implemented — worth revisiting there.)
//
// FALLBACK MECHANISM THAT WORKS (this script): deterministic WAAPI scrubbing.
//   A view transition is, under the hood, a set of real Web-Animations on the
//   ::view-transition-* pseudo-elements. We don't need to sample a real-time
//   clock at all — we SCRUB those animations:
//     1. Trigger the VT (a real click, exactly as a viewer would).
//     2. The moment the `-ua-view-transition-*` animations exist, PAUSE them
//        and set currentTime = 0.
//     3. For each output frame, set currentTime = frame/fps*1000 (still
//        paused) and screenshot. Every frame is an EXACT, reproducible slice
//        of the morph — independent of wall-clock, GPU load, or screenshot
//        latency.
//     4. finish() the animations to let the VT complete and reveal the live
//        destination, then settle + dwell.
//   Everything else (dwells, scrolls) reuses record-flow-lossless.mjs's proven
//   deterministic handling (manual scrollTop interpolation; held dwells).
//   Output is genuine 2x-native PNG frames → mathematically-lossless h264.
//
// USAGE (repo root, dev server running):
//   node scripts/spike-truelossless.mjs                       # built-in spike flow, 60fps
//   node scripts/spike-truelossless.mjs --fps=60 --out=~/Desktop/brightlocal-videos/truelossless-spike.mp4
//   node scripts/spike-truelossless.mjs --flow=my-flow.json --keep-frames
//   node scripts/spike-truelossless.mjs --base=https://gradeui.com
//
// Reads the Supabase key from ./.mcp.json (never printed). ffmpeg from the
// ffmpeg-static devdep. Does NOT modify record-flow.mjs / record-flow-lossless.mjs.

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

// ── ffmpeg (globbed from pnpm store, else PATH) — same as the sibling scripts ─
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
  return "ffmpeg";
}
const FFMPEG = resolveFfmpeg();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const BASE = (args.base || "http://localhost:3000").replace(/\/+$/, "");
const FPS = Math.max(1, Number(args.fps) || 60);
const KEEP_FRAMES = Boolean(args["keep-frames"]);
const expandTilde = (p) => (p && p.startsWith("~") ? path.join(os.homedir(), p.slice(1)) : p);

// The exact tiny spike flow from the brief: hub → dwell → scroll to the Local
// Search Grid → dwell → click the mini-map card (shared-element VT morphing the
// mini map into the full LSG map) → dwell.
const DEMO_FLOW = {
  project: "47e40175-0d55-4d21-960b-26bdf6b01282",
  start: "dmrurue2wmp9u",
  w: 1280,
  h: 834,
  steps: [
    { dwell: 1000 },
    { scrollTo: '[data-hook="hub-local-search-grid"]', ms: 1200 },
    { dwell: 1000 },
    { click: '[data-grade-transition="cross-fade"]' },
    { dwell: 3000 },
  ],
};
const flow = args.flow ? JSON.parse(fs.readFileSync(expandTilde(args.flow), "utf8")) : DEMO_FLOW;

const W = flow.w ?? 1280;
const H = flow.h ?? 834;
const DEVICE_W = W * 2;
const DEVICE_H = H * 2;
const OUT = expandTilde(
  args.out && args.out !== true
    ? args.out
    : path.join(os.homedir(), "Desktop/brightlocal-videos/truelossless-spike.mp4"),
);
fs.mkdirSync(path.dirname(OUT), { recursive: true });

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

// ── chrome hiders (copied from record-flow-lossless.mjs; CSP blocks <style>,
// so hide via inline style + a self-maintaining MutationObserver) ───────────
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
async function hideInner(page) {
  const frame = iframe(page);
  if (frame) await frame.evaluate(() => {
    document.querySelectorAll('[data-slot="shell-tweaker"]').forEach((t) => t.style.setProperty("display", "none", "important"));
  }).catch(() => {});
}
async function rehide(page) { await installHiders(page); await hideInner(page); }

const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const framesFor = (ms, fallback) => Math.max(1, Math.round(((ms ?? fallback) / 1000) * FPS));

const token = await ensureToken(flow.project, flow.start);
const url = `${BASE}/e/${token}?w=${W}`;
const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "grade-truelossless-"));
console.log(`TRUE-LOSSLESS spike (WAAPI VT scrub) · ${DEVICE_W}x${DEVICE_H} (2x of ${W}x${H}) · ${FPS}fps`);
console.log(`url    → ${url}`);
console.log(`frames → ${framesDir}`);

const browser = await chromium.launch({ headless: true, channel: "chromium" }).catch(() => chromium.launch({ headless: true }));
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

// ── frame timeline (identical model to record-flow-lossless.mjs) ────────────
let frame = 0;
let realShots = 0;
let shotWallMs = 0;
const framePath = (i) => path.join(framesDir, `f${String(i).padStart(6, "0")}.png`);
async function shoot() {
  const p = framePath(frame);
  const t0 = Date.now();
  // animations:"allow" is ESSENTIAL — the VT pseudo-animations are paused +
  // scrubbed by us; "disabled" would fast-forward finite animations and wreck
  // the morph. "allow" captures the exact paused/scrubbed state.
  await page.screenshot({ path: p, type: "png", animations: "allow" });
  shotWallMs += Date.now() - t0;
  realShots++;
  frame++;
  return p;
}
function hold(src, n) {
  for (let i = 0; i < n; i++) {
    const dest = framePath(frame);
    try { fs.linkSync(src, dest); } catch { fs.copyFileSync(src, dest); }
    frame++;
  }
}

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
await installHiders(page);
// Wait for the first screen to PAINT — the brightlocal external sandbox
// cold-boots esm.sh + the Google map (~5-15s). Nothing is captured during boot.
const bootStart = Date.now();
await page.waitForFunction(() => {
  const f = document.querySelector("iframe"); const d = f && f.contentDocument;
  return d && d.body && (d.body.innerText || "").trim().length > 40;
}, { timeout: 45000 });
await sleep(4500); // settle map tiles / fonts / double-buffered preview
await rehide(page);
console.log(`booted + settled in ${((Date.now() - bootStart) / 1000).toFixed(1)}s — capturing`);

// ── the VT scrubber: the heart of the spike ─────────────────────────────────
// Click, then deterministically scrub the resulting view-transition. Returns a
// summary for logging. If NO view transition materialises, falls back to the
// lossless script's "capture frames while polling waitFor" behaviour so a
// plain client-nav still records.
async function clickAndScrubVT(step) {
  const fr = iframe(page);
  // A real click, exactly as a viewer would — this fires the app's onClick,
  // which calls document.startViewTransition under the hood.
  await fr.locator(step.click).first().click();

  // Detect the VT animations IN-PAGE (fast, no round-trips), pause them, pin to
  // 0, and read the transition duration from the animation timing.
  const detected = await fr.evaluate(async () => {
    const isVT = (a) => (a.animationName || "").startsWith("-ua-view-transition");
    const start = performance.now();
    let anims = [];
    while (performance.now() - start < 1200) {
      anims = document.getAnimations().filter(isVT);
      if (anims.length) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    if (!anims.length) return { found: false };
    let duration = 0;
    for (const a of anims) {
      try {
        const t = a.effect.getComputedTiming();
        // endTime = delay + iterations*duration + endDelay (ms)
        if (Number.isFinite(t.endTime)) duration = Math.max(duration, t.endTime);
        a.pause();
        a.currentTime = 0;
      } catch {}
    }
    return { found: true, count: anims.length, duration };
  });

  if (!detected.found) {
    // No VT — behave like record-flow-lossless.mjs's click branch.
    if (step.waitFor) {
      const maxSwapFrames = Math.round(FPS * 1.5);
      let arrived = false;
      for (let i = 0; i < maxSwapFrames; i++) {
        await shoot();
        arrived = await page.evaluate((sel) => {
          const f = document.querySelector("iframe"); const d = f && f.contentDocument;
          return !!(d && d.querySelector(sel));
        }, step.waitFor).catch(() => false);
        if (arrived) break;
      }
    }
    await rehide(page);
    return { vt: false };
  }

  // Scrub. Duration falls back to 600ms if the timing was 0/NaN. We render one
  // extra settled frame at the end (currentTime === duration).
  const duration = detected.duration && detected.duration > 0 ? detected.duration : 600;
  const scrubFrames = Math.max(1, Math.ceil((duration / 1000) * FPS));
  const t0Frame = frame;
  for (let i = 0; i <= scrubFrames; i++) {
    const ct = Math.min(i * (1000 / FPS), duration);
    // Re-assert pause + set currentTime every frame. This both keeps the VT
    // alive across the (slow, real-time) screenshots and guarantees each frame
    // is an exact slice — the screenshot latency never leaks into the morph.
    const ok = await fr.evaluate((ct) => {
      const isVT = (a) => (a.animationName || "").startsWith("-ua-view-transition");
      const anims = document.getAnimations().filter(isVT);
      if (!anims.length) return false;
      for (const a of anims) { try { a.pause(); a.currentTime = ct; } catch {} }
      return true;
    }, ct).catch(() => false);
    // Keep chrome hidden (the destination mounts mid-transition).
    await installHiders(page);
    await shoot();
    if (!ok && i > 0) break; // anims vanished (VT ended early) — stop scrubbing
  }

  // Finish the VT so the live destination is revealed for the dwell.
  await fr.evaluate(() => {
    const isVT = (a) => (a.animationName || "").startsWith("-ua-view-transition");
    for (const a of document.getAnimations().filter(isVT)) { try { a.finish(); } catch {} }
  }).catch(() => {});
  await rehide(page);
  return { vt: true, count: detected.count, duration, scrubbedFrames: frame - t0Frame };
}

// ── drive the flow ──────────────────────────────────────────────────────────
const notes = [];
for (const step of flow.steps) {
  if (step.click) {
    const r = await clickAndScrubVT(step);
    if (r.vt) {
      notes.push(`VT scrubbed: ${r.count} anims · ${Math.round(r.duration)}ms · ${r.scrubbedFrames} frames`);
      // Let the destination (LSG full map) load its tiles before the next dwell
      // holds a single frame, so the held frame shows a settled screen.
      await sleep(4000);
      await rehide(page);
    } else {
      notes.push("click: no view transition detected (plain nav / static)");
    }
  }

  if (step.scroll || step.scrollBy != null || step.scrollTo) {
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
        await shoot();
      }
    }
  }

  if (step.dwell) {
    await rehide(page);
    const n = framesFor(step.dwell, 0);
    const still = await shoot();
    if (n > 1) hold(still, n - 1);
  }
}

await ctx.close();
await browser.close();

if (frame === 0) { console.error("No frames captured — check the flow steps."); process.exit(1); }

// ── STITCH — mathematically lossless h264 (qp0 / yuv444p) ────────────────────
console.log(`\nstitching ${frame} frames @ ${FPS}fps → ${OUT}`);
await new Promise((res, rej) => {
  const ff = spawn(FFMPEG, [
    "-y", "-framerate", String(FPS), "-start_number", "0",
    "-i", path.join(framesDir, "f%06d.png"),
    "-c:v", "libx264", "-qp", "0", "-pix_fmt", "yuv444p",
    "-movflags", "+faststart", OUT,
  ], { stdio: "ignore" });
  ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c))));
});

if (!KEEP_FRAMES) fs.rmSync(framesDir, { recursive: true, force: true });

const secs = frame / FPS;
console.log(`\n✅ ${OUT}`);
console.log(`   ${DEVICE_W}x${DEVICE_H} · ${frame} frames · ${secs.toFixed(1)}s @ ${FPS}fps · lossless h264 (qp0/yuv444p)`);
console.log(`   screenshots: ${realShots} real shots for ${frame} frames`);
console.log(`   capture wall-time: ${(shotWallMs / 1000).toFixed(1)}s shooting for ${secs.toFixed(1)}s of video`);
for (const n of notes) console.log(`   • ${n}`);
if (KEEP_FRAMES) console.log(`   frames kept → ${framesDir}`);
