#!/usr/bin/env node
/**
 * render-motion.mjs — the DETERMINISTIC Grade Motion render pipeline (D7 v2).
 *
 * Why this beats the in-browser export: the browser path records in real
 * time, so a heavy shader frame drops a video frame — judder. This STEPS
 * the film instead: seek to an exact frame time, wait for it to fully
 * paint (however long that takes), screenshot, advance. Output is locked
 * to a perfect fps regardless of scene weight. Runs entirely on localhost
 * — headless Chromium (Playwright) + ffmpeg, both already on this machine.
 * Zero network, zero cost.
 *
 * It drives the existing /fast-sandbox render surface (same renderer
 * Studio's live preview uses, so parity is exact) and the Motion render
 * kernel exposed at `window.__gradeMotion` (see packages/ui motion.tsx).
 *
 * USAGE
 *   node scripts/render-motion.mjs --source path/to/motion.jsx [options]
 *
 * OPTIONS
 *   --source <file>   JSX file exporting a <Motion> app  (required)
 *   --out <file>      Output path. Default ./<source>-<res>x.mp4
 *   --fps <n>         Frames per second. Default 30. Use 60 for silk.
 *   --res <0.5|1|2>   Resolution tier (see below). Default 1.
 *   --base <WxH>      Base film resolution at 1x. Default 1920x1080.
 *   --theme <file>    JSON of { vars: {--x: "..."}, mode: "light"|"dark" }.
 *   --url <origin>    Dev server origin. Default http://localhost:3000.
 *   --keep-frames     Don't delete the PNG frame dir after assembly.
 *
 * RESOLUTION TIERS
 *   0.5  — fast PREVIEW pass (960×540 @ 1x base). Quick "does it read?".
 *   1    — delivery (1920×1080). The default.
 *   2    — retina / big-screen (3840×2160). Slow; for hero placements.
 *
 * PREREQS (one-time):
 *   npx playwright install chromium
 *   (ffmpeg must be on PATH — `ffmpeg -version` to check.)
 *   The dev server must be running: `pnpm dev`.
 */

import { spawn } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename, extname } from "node:path";
import { createRequire } from "node:module";

// playwright lives in the docs workspace (apps/docs), not repo root —
// pnpm doesn't hoist it. Resolve it from there so `node scripts/...`
// works from any cwd with no extra install.
const require = createRequire(new URL("../apps/docs/package.json", import.meta.url));
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  console.error(
    "✖ playwright not found. Install browsers once:\n" +
      "    pnpm --filter @gradeui/docs exec playwright install chromium",
  );
  process.exit(1);
}

// ── args ──────────────────────────────────────────────────────────────
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith("--") ? v : true;
}
const sourcePath = arg("source");
if (!sourcePath || sourcePath === true) {
  console.error("✖ --source <file> is required (a JSX file exporting <Motion>).");
  process.exit(1);
}
const fps = Number(arg("fps", 30));
const res = Number(arg("res", 1));
const [baseW, baseH] = String(arg("base", "1920x1080")).split("x").map(Number);
const url = arg("url", "http://localhost:3000");
const keepFrames = arg("keep-frames", false) === true;
const themePath = arg("theme");

// ── poster / preview knobs — same pipeline, three dials ────────────────
// --poster      : single frame (an animated-thumbnail / og:image / tile).
// --at <ms>     : which frame the poster grabs (default 0 = first paint).
// --seconds <n> : cap the render to the first N seconds (a PREVIEW LOOP /
//                 loading screen — works for every screen, not just full
//                 films). Omit for the whole film.
// --width <px>  : force output width (height keeps the base aspect). This
//                 is how you get 640 posters / 480 loops / 240 super-pixel
//                 placeholders independent of the 0.5/1/2 delivery tiers.
const poster = arg("poster", false) === true;
const posterAtMs = Number(arg("at", 0));
const seconds = arg("seconds") ? Number(arg("seconds")) : null;
const widthOverride = arg("width") ? Number(arg("width")) : null;

// Resolve output dimensions. --width wins (keeps base aspect); else tier.
const aspect = baseW / baseH;
const W = widthOverride
  ? Math.round(widthOverride / 2) * 2
  : Math.round(baseW * res);
const H = widthOverride
  ? Math.round(widthOverride / aspect / 2) * 2
  : Math.round(baseH * res);

const source = readFileSync(sourcePath, "utf8");
const theme = themePath ? JSON.parse(readFileSync(themePath, "utf8")) : null;

// Machine-readable progress for the in-app render route. When the route
// spawns us (GRADE_RENDER_JSON=1) we emit one JSON line per phase/tick on
// stdout, which it parses and streams to the browser progress bar. Quiet
// for terminal users.
const emitJson = process.env.GRADE_RENDER_JSON === "1";
function progress(obj) {
  if (emitJson) process.stdout.write(`@@GRADE ${JSON.stringify(obj)}\n`);
}

// Resolve the ffmpeg binary. Prefer the npm-provisioned `ffmpeg-static`
// (a prebuilt binary — no brew, no system install, bundles into the live
// image identically) resolved from apps/docs; fall back to a system
// ffmpeg on PATH if someone has one. Same parity model as Chromium.
const ffmpegBin = (() => {
  try {
    const req = createRequire(new URL("../apps/docs/package.json", import.meta.url));
    const p = req("ffmpeg-static");
    if (p && typeof p === "string") return p;
  } catch {
    /* not installed — fall back to PATH */
  }
  return "ffmpeg";
})();

// Run ffmpeg, turning a missing binary (ENOENT) into a crystal-clear
// message instead of a vague "exit 1".
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegBin, args, { stdio: ["ignore", "ignore", "inherit"] });
    ff.on("error", (e) => {
      if (e.code === "ENOENT") {
        reject(
          new Error(
            "ffmpeg not found. Install it once (no brew needed):  pnpm motion:setup",
          ),
        );
      } else reject(e);
    });
    ff.on("close", (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg exited ${c}`))));
  });
}

const stem = basename(sourcePath, extname(sourcePath));
const sizeTag = widthOverride ? `${W}w` : `${res}x`;
const outPath =
  arg("out") && arg("out") !== true
    ? arg("out")
    : poster
      ? `${stem}-poster-${sizeTag}.webp`
      : `${stem}-${seconds ? `preview${seconds}s-` : ""}${sizeTag}.mp4`;

const log = (m) => process.stdout.write(`${m}\n`);
log(`\n🎬 Grade Motion ${poster ? "poster" : seconds ? "preview" : "render"}`);
log(`   source  ${sourcePath}`);
log(`   size    ${W}×${H}${widthOverride ? "" : `  (${res}x)`}`);
if (!poster) log(`   fps     ${fps}${seconds ? `  ·  first ${seconds}s` : ""}`);
if (poster) log(`   frame   @ ${posterAtMs}ms`);
log(`   out     ${outPath}\n`);

// ── drive ─────────────────────────────────────────────────────────────
const frameDir = mkdtempSync(join(tmpdir(), "grade-motion-"));
let browser;
try {
  browser = await chromium.launch({ args: ["--use-gl=swiftshader"] });
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => log(`   ⚠ page error: ${e.message}`));

  log("→ loading render surface (/fast-sandbox)…");
  await page.goto(`${url}/fast-sandbox`, { waitUntil: "networkidle" });

  // The sandbox boots a React bundle and announces grade:fast-ready.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const seen = (e) => {
          if (e?.data?.type === "grade:fast-ready") {
            window.removeEventListener("message", seen);
            resolve();
          }
        };
        window.addEventListener("message", seen);
        // It may already be ready before we attach — nudge it.
        window.postMessage({ type: "grade:fast-ping" }, "*");
        setTimeout(resolve, 4000); // don't hang if the ack was missed
      }),
  );

  if (theme) {
    await page.evaluate(
      (t) => window.postMessage({ type: "grade:fast-theme", ...t }, "*"),
      theme,
    );
  }

  log("→ compiling film…");
  progress({ phase: "compile" });
  await page.evaluate(
    (src) =>
      window.postMessage({ type: "grade:fast-compile", source: src }, "*"),
    source,
  );

  // Wait for the Motion render kernel to register (the film mounted).
  await page.waitForFunction(() => window.__gradeMotion?.ready === true, {
    timeout: 15000,
  });
  const meta = await page.evaluate(() => {
    window.__gradeMotion.enterRenderMode();
    return window.__gradeMotion.meta();
  });
  const film = page.locator('[data-gds-part="motion"]').first();
  await film.waitFor({ state: "visible", timeout: 10000 });

  // ── POSTER: one frame → webp, no ffmpeg sequence ──
  if (poster) {
    progress({ phase: "step", frame: 0, total: 1 });
    const at = Math.max(0, Math.min(posterAtMs, meta.totalMs - 1));
    await page.evaluate((m) => window.__gradeMotion.renderFrame(m), at);
    const png = join(frameDir, "poster.png");
    await film.screenshot({ path: png });
    progress({ phase: "encode" });
    await runFfmpeg(["-y", "-i", png, "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", outPath]);
    log(`\n✅ ${outPath}  (poster ${W}×${H} @ ${at}ms)\n`);
  } else {
    // ── FILM / PREVIEW: step frames → mp4. `--seconds` caps the run. ──
    const runMs = seconds ? Math.min(seconds * 1000, meta.totalMs) : meta.totalMs;
    const totalFrames = Math.max(1, Math.round((runMs / 1000) * fps));
    log(
      `   film ${(meta.totalMs / 1000).toFixed(1)}s · ${meta.count} scenes` +
        `${seconds ? ` · preview ${runMs / 1000}s` : ""} · ${totalFrames} frames\n`,
    );

    log("→ stepping frames…");
    progress({ phase: "step", frame: 0, total: totalFrames });
    const t0 = Date.now();
    for (let f = 0; f < totalFrames; f++) {
      const ms = (f / fps) * 1000;
      await page.evaluate((m) => window.__gradeMotion.renderFrame(m), ms);
      await film.screenshot({
        path: join(frameDir, `f${String(f).padStart(6, "0")}.png`),
      });
      // Throttle progress to ~5/s so a long film doesn't spam the stream.
      if (f % Math.max(1, Math.round(fps / 5)) === 0 || f === totalFrames - 1) {
        progress({ phase: "step", frame: f + 1, total: totalFrames });
      }
      if (f % fps === 0 || f === totalFrames - 1) {
        const pct = Math.round(((f + 1) / totalFrames) * 100);
        process.stdout.write(`\r   ${pct}%  (${f + 1}/${totalFrames})   `);
      }
    }
    log(`\n   stepped ${totalFrames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

    log("→ assembling with ffmpeg…");
    progress({ phase: "encode" });
    // webm/vp9 for small preview loops (tiny + alpha-friendly), h264 mp4
    // for delivery. A capped --seconds render is a loop → webm.
    const isLoop = !!seconds;
    const args = isLoop
      ? ["-y", "-framerate", String(fps), "-i", join(frameDir, "f%06d.png"),
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-crf", "32", "-b:v", "0",
         outPath.replace(/\.mp4$/, ".webm")]
      : ["-y", "-framerate", String(fps), "-i", join(frameDir, "f%06d.png"),
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17",
         "-preset", "slow", "-movflags", "+faststart", outPath];
    const finalOut = isLoop ? outPath.replace(/\.mp4$/, ".webm") : outPath;
    await runFfmpeg(args);
    log(`\n✅ ${finalOut}  (${W}×${H} @ ${fps}fps${seconds ? `, ${seconds}s loop` : ""})\n`);
  }
} catch (err) {
  log(`\n✖ render failed: ${err.message}`);
  if (String(err.message).includes("__gradeMotion")) {
    log("  The film never registered the render kernel — is the source a");
    log("  <Motion> app, and is @gradeui/ui dist current (pnpm -F @gradeui/ui build)?");
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (!keepFrames) rmSync(frameDir, { recursive: true, force: true });
  else log(`   frames kept at ${frameDir}`);
}
