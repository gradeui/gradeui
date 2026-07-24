// record-flow.mjs — record a WALKED FLOW (click links across screens +
// scroll) in the live /e/ embed as a clean mp4. Works with ANY registry
// (gradeui or an external one like brightlocal) because it drives the
// real embed, exactly as a viewer would.
//
// The embed is built to SCALE its content to the viewport, so capturing
// at a large viewport (default 2560x1600) with the content laid out at
// --w (default 1280) yields a crisp, retina-grade video — no
// frame-stepping needed. The Next.js "N" nub, the flow Back chip, and
// the shell tweaker corner are hidden. The loading head is trimmed so
// the clip opens on the rendered first screen.
//
// USAGE (repo root, dev server running):
//   node scripts/record-flow.mjs                       # built-in brightlocal demo
//   node scripts/record-flow.mjs --flow=my-flow.json --out=demo.mp4
//
// FLOW JSON:
//   {
//     "project": "<uuid>",
//     "start":   "<designId>",            // first screen
//     "viewport": [2560, 1600],           // capture size (optional)
//     "w": 1280,                          // content layout width (optional)
//     "steps": [
//       { "dwell": 1400 },
//       { "click": "<css in the screen>", "waitFor": "<css that proves the next screen>" },
//       { "scroll": "bottom", "ms": 3500 },
//       { "dwell": 900 }
//     ]
//   }
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

// Built-in demo: brightlocal All Locations -> Minus 1 Studios -> hub -> scroll.
const DEMO_FLOW = {
  project: "47e40175-0d55-4d21-960b-26bdf6b01282",
  start: "dmrotrgstba3l",
  w: 1280,
  h: 834,
  steps: [
    { dwell: 1400 },
    { click: '[data-hook="location-card-minus-one-studios"]', waitFor: '[data-hook="hub-ai-insights"]' },
    { dwell: 1200 },
    { scroll: "bottom", ms: 3500 },
    { dwell: 900 },
  ],
};
const flow = args.flow ? JSON.parse(fs.readFileSync(args.flow, "utf8")) : DEMO_FLOW;
// Content laid out at W×H (CSS px), captured at SCALE× density. H
// defaults to 834 (Ali's minimum viewport height); the embed scales
// the W-wide content to the viewport, so capture = [W*SCALE, H*SCALE].
const W = flow.w ?? 1280;
const H = flow.h ?? 834;
const SCALE = flow.scale ?? 2;
const [VW, VH] = flow.viewport ?? [W * SCALE, H * SCALE];
const __d = new Date(); const __p = (n) => String(n).padStart(2, "0");
const __STAMP = `${__d.getFullYear()}${__p(__d.getMonth()+1)}${__p(__d.getDate())}-${__p(__d.getHours())}${__p(__d.getMinutes())}${__p(__d.getSeconds())}`;
const __stamp = (p) => { const e = path.extname(p), b = path.basename(p, e), d = path.dirname(p); const folder = path.join(d, `${b}-${__STAMP}`); fs.mkdirSync(folder, { recursive: true }); return path.join(folder, b + e); };
// Default output home — every run nests as a timestamped folder in
// ~/Desktop/brightlocal-videos/ (where Ali keeps the demo renders).
// A bare --out=name.mp4 lands here too; an absolute --out is respected.
const VIDEOS_DIR = path.join(os.homedir(), "Desktop", "brightlocal-videos");
const __rawOut = args.out && args.out !== true ? String(args.out) : `${flow.start}-flow.mp4`;
const OUT = __stamp(path.isAbsolute(__rawOut) ? __rawOut : path.join(VIDEOS_DIR, path.basename(__rawOut)));

const mcp = JSON.parse(fs.readFileSync(path.join(REPO, ".mcp.json"), "utf8"));
const KEY = mcp.mcpServers["gradeui-dev"].env.SUPABASE_SERVICE_ROLE_KEY;
const SB = "https://fbftniekvvkbduwpuzfs.supabase.co";
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

// Chrome to hide: the Next dev "N" nub + the flow Back chip (outer
// page), and the shell tweaker corner (inside the screen iframe).
// A CSP on the share page blocks injected <style> tags, so we hide via
// INLINE style (not blocked) driven by a MutationObserver — the chip
// mounts only after the first goto and re-renders through the flow, so
// a one-shot hide misses it. Installed once; self-maintaining.
async function installHiders(page) {
  await page.evaluate(() => {
    const hide = () => {
      document.querySelectorAll("nextjs-portal").forEach((n) => n.remove());
      // top-left flow chip (title) + bottom-left "← Back" (no title,
      // matched by text). Both are share-view chrome, not part of the
      // screen — hidden for a clean recording; the back-stack still
      // works in the share view itself.
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
// NOTE: the shell tweaker corner is invisible when closed, so it's NOT
// hidden — that lets a flow OPEN it (key: "Alt+T") to demo theme
// switching on camera.

const token = await ensureToken(flow.project, flow.start);
const url = `${BASE}/e/${token}?w=${W}`;
const rawDir = fs.mkdtempSync(path.join(REPO, ".rec-"));
console.log(`recording ${VW}x${VH} · content @${W} · ${url}`);

const browser = await chromium.launch({ headless: true, channel: "chromium" }).catch(() => chromium.launch({ headless: true }));
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, recordVideo: { dir: rawDir, size: { width: VW, height: VH } } });
const page = await ctx.newPage();

const navStart = Date.now();
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
await installHiders(page);
// wait for the first screen to actually paint, and remember when (to trim the head)
await page.waitForFunction(() => {
  const f = document.querySelector("iframe"); const d = f && f.contentDocument;
  return d && d.body && (d.body.innerText || "").trim().length > 40;
}, { timeout: 35000 });
const readyMs = Date.now() - navStart;
await installHiders(page);

// Narration captions, timestamped against the ACTUAL run so the
// teleprompter stays in sync as pacing changes. A step's `caption`
// appears the moment that step begins.
const captions = [];
const sections = []; // { name, tMs } at each section marker
for (const step of flow.steps) {
  // A "section" marker = a natural intersection: add a longer breath.
  if (step.section) { sections.push({ name: step.section, tMs: Date.now() - navStart }); step.dwell = (step.dwell || 0) + (flow.sectionPause ?? 1500); }
  if (step.dwell) step.dwell = Math.round(step.dwell * DWELL_SCALE);
  if (step.caption) captions.push({ tMs: Date.now() - navStart, text: step.caption });
  // Keypress into the SCREEN (iframe window) — e.g. "Alt+T" opens the
  // shell tweaker (its keydown handler lives on the screen's window).
  // Format: "Alt+T", "Escape", "shift+/". Dispatched as a synthetic
  // keydown so it fires the app's own handlers without needing focus.
  if (step.key) {
    const parts = String(step.key).split("+");
    const k = parts.pop();
    const mods = parts.map((p) => p.toLowerCase());
    await iframe(page).evaluate(({ k, mods }) => {
      const code = k.length === 1 ? "Key" + k.toUpperCase() : k;
      window.dispatchEvent(new KeyboardEvent("keydown", {
        key: k.length === 1 ? k.toLowerCase() : k,
        code,
        altKey: mods.includes("alt"),
        ctrlKey: mods.includes("ctrl"),
        metaKey: mods.includes("meta") || mods.includes("cmd"),
        shiftKey: mods.includes("shift"),
        bubbles: true,
      }));
    }, { k, mods });
    await installHiders(page);
  }
  // Native <select> change (e.g. the tweaker preset dropdown) — e.g.
  // { select: "[data-hook=\"tweaker-preset\"]", value: "live-site" }.
  if (step.select) {
    await iframe(page).locator(step.select).first().selectOption(String(step.value));
    await installHiders(page);
  }
  if (step.click) {
    // HOVER, then click (Ali, 24 Jul: "like a human would") — hold the
    // target's hover state (card shadow, arrow colour) on camera
    // before clicking. Opt out per step with "hoverMs": 0.
    const hoverMs = step.hoverMs ?? 1200;
    if (hoverMs > 0) {
      await iframe(page).locator(step.click).first().hover().catch(() => {});
      await sleep(hoverMs);
    }
    await iframe(page).locator(step.click).first().click();
    if (step.waitFor) {
      await page.waitForFunction((sel) => {
        const f = document.querySelector("iframe"); const d = f && f.contentDocument;
        return d && d.querySelector(sel);
      }, step.waitFor, { timeout: 30000 });
    }
    await installHiders(page); // re-arm after the swap
  }
  // Scrolling, human-eased (easeInOutQuad). Modes:
  //   scroll: "top" | "bottom"   — smooth to an end
  //   scrollBy: <px>             — relative "scroll down a bit"
  //   scrollTo: "<selector>"     — bring an element into view (~140px down)
  if (step.scroll || step.scrollBy != null || step.scrollTo) {
    await iframe(page).evaluate(async (s) => {
      const vps = [...document.querySelectorAll("[data-radix-scroll-area-viewport]")];
      const v = vps.sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
      if (!v) return;
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
      const from = v.scrollTop;
      const ms = s.ms ?? 900;
      const steps = Math.max(20, Math.round(ms / 16));
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      for (let i = 0; i <= steps; i++) { v.scrollTop = from + (target - from) * ease(i / steps); await new Promise((r) => setTimeout(r, ms / steps)); }
    }, { mode: typeof step.scroll === "string" ? step.scroll : null, by: step.scrollBy, sel: step.scrollTo, ms: step.ms });
  }
  if (step.dwell) await sleep(step.dwell);
}
const flowEndMs = Date.now() - navStart;

await ctx.close(); // flush the webm
await browser.close();

const webm = path.join(rawDir, fs.readdirSync(rawDir).find((f) => f.endsWith(".webm")));
const trim = Math.max(0, readyMs / 1000 - 0.25); // open on the rendered screen
await new Promise((res, rej) => {
  const ff = spawn(FFMPEG, ["-y", "-ss", String(trim), "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", OUT], { stdio: "ignore" });
  ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg " + c))));
});
// Keep the raw webm too (VP8, lossless-er than the h264 mp4), trimmed
// to match. webm is smaller + alpha-capable; mp4 is the universal one.
const webmOut = OUT.replace(/\.mp4$/, "") + ".webm";
await new Promise((res, rej) => {
  const ff = spawn(FFMPEG, ["-y", "-ss", String(trim), "-i", webm, "-c:v", "libvpx-vp9", "-crf", "24", "-b:v", "0", webmOut], { stdio: "ignore" });
  ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg webm " + c))));
});
fs.rmSync(rawDir, { recursive: true, force: true });
console.log(`\n✅ ${OUT}\n✅ ${webmOut}\n   (${VW}x${VH}, head trimmed ${trim.toFixed(1)}s)`);

// ── Per-section clips: cut the demo at each section marker so each
// part can be dropped into a slide on its own. Re-encoded for exact cuts.
if (sections.length) {
  const trimMs = trim * 1000;
  const durMs = flowEndMs - trimMs;
  const dir = OUT.replace(/\.mp4$/, "") + "-sections";
  fs.mkdirSync(dir, { recursive: true });
  const slug = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (let i = 0; i < sections.length; i++) {
    const start = Math.max(0, (sections[i].tMs - trimMs) / 1000);
    const end = (i + 1 < sections.length ? sections[i + 1].tMs - trimMs : durMs) / 1000;
    const out = path.join(dir, `${String(i + 1).padStart(2, "0")}-${slug(sections[i].name)}.mp4`);
    await new Promise((res, rej) => {
      const ff = spawn(FFMPEG, ["-y", "-ss", start.toFixed(3), "-to", end.toFixed(3), "-i", OUT, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", out], { stdio: "ignore" });
      ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg section " + c))));
    });
  }
  // Manifest of boundaries (seconds, post-trim) — join-sections.mjs
  // uses it to tie contiguous sections into one clip from the master.
  fs.writeFileSync(path.join(dir, "sections.json"), JSON.stringify(
    sections.map((sec, i) => ({
      n: i + 1, slug: slug(sec.name),
      start: Math.max(0, (sec.tMs - trimMs) / 1000),
      end: (i + 1 < sections.length ? sections[i + 1].tMs - trimMs : durMs) / 1000,
    })), null, 2));
  console.log(`\u2705 ${dir}/  (${sections.length} section clips)`);
}

// ── Teleprompter: an SRT + a readable script + a standalone caption
// video, all timed to THIS run (so re-pacing the flow re-syncs them). A
// caption shows from its step's start until the next caption. Only when
// the flow carries `caption` fields on its steps.
if (captions.length) {
  const trimMs = trim * 1000;
  const durMs = Math.max(flowEndMs - trimMs, captions.at(-1).tMs - trimMs + 3000);
  const ts = (ms, sep) => {
    ms = Math.max(0, ms);
    const p = (n, w = 2) => String(n).padStart(w, "0");
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))}${sep}${p(Math.floor(ms % 1000), 3)}`;
  };
  let srt = "";
  captions.forEach((c, i) => {
    const start = c.tMs - trimMs;
    const end = i + 1 < captions.length ? captions[i + 1].tMs - trimMs : durMs;
    srt += `${i + 1}\n${ts(start, ",")} --> ${ts(end, ",")}\n${c.text}\n\n`;
  });
  const base = OUT.replace(/\.mp4$/, "");
  const srtPath = `${base}.srt`;
  fs.writeFileSync(srtPath, srt);
  fs.writeFileSync(
    `${base}-script.txt`,
    captions.map((c) => `[${ts(c.tMs - trimMs, ".").slice(0, 8)}]  ${c.text}`).join("\n") + "\n",
  );
  // Standalone teleprompter video: dark bg + burned captions, brand
  // accent bar, same duration as the demo — read alongside it.
  const teleOut = `${base}-teleprompter.mp4`;
  await new Promise((res, rej) => {
    const ff = spawn(
      FFMPEG,
      [
        "-y",
        "-f", "lavfi", "-i", `color=c=0x0f1412:s=1280x720:d=${(durMs / 1000).toFixed(2)}`,
        "-vf",
        `drawbox=x=0:y=0:w=1280:h=6:color=0x2AE855:t=fill,subtitles=${path.basename(srtPath)}:force_style='FontName=Helvetica,Fontsize=30,PrimaryColour=&Hffffff&,Alignment=5,MarginL=140,MarginR=140,MarginV=40'`,
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart",
        teleOut,
      ],
      { stdio: "ignore", cwd: path.dirname(srtPath) },
    );
    ff.on("exit", (c) => (c === 0 ? res() : rej(new Error("ffmpeg teleprompter " + c))));
  });
  console.log(`✅ ${srtPath}\n✅ ${base}-script.txt\n✅ ${teleOut}  (teleprompter, ${(durMs / 1000).toFixed(1)}s, ${captions.length} lines)`);
}
