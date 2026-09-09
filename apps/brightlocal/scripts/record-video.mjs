#!/usr/bin/env node
/**
 * The walkthrough recorder for apps/brightlocal.
 *
 * Real-time capture (Playwright's recordVideo), not frame-stepping, because
 * the Beacon surfaces now animate on open: the stagger, the mark sweep and
 * the bars rising only look right if the compositor runs at wall clock.
 * scripts/record-flow-lossless.mjs in the repo root is the frame-stepper for
 * Studio share links and does not fit this app.
 *
 *   node apps/brightlocal/scripts/record-video.mjs \
 *     --flow=apps/brightlocal/scripts/flows/overview.json \
 *     [--base=https://brightlocal-replatform.gradeui.com] [--out=overview.mp4]
 *
 * Output lands in ~/Desktop/brightlocal-videos/<name>-<stamp>/.
 *
 * Flow file:
 *   { "name": "overview", "w": 1280, "h": 900, "bg": "neutral",
 *     "steps": [ ... ] }
 *
 * Steps (each may carry `caption`, which paints on the stage, and `ms`):
 *   { "card": "persona-multi", "ms": 2600 }        a full-frame cut-scene card
 *   { "persona": "multi" }                          reseed and reload
 *   { "go": "/locations/harbour-co-hove/reviews",   load a page in the stage
 *     "bg": "violet", "caption": "..." }
 *   { "dwell": 2400 }                               hold
 *   { "click": "[data-hook=...]", "waitFor": "..." } click inside the frame
 *   { "scrollBy": 520, "ms": 900 }                  smooth scroll inside
 *   { "scroll": "top" }
 *   { "key": "Escape" }
 */

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = "/Users/alastairdriver/Development/2026/ramp-ds/gradeui";
const require = createRequire(`${ROOT}/apps/mcp-server/package.json`);
const requireDocs = createRequire(`${ROOT}/apps/docs/package.json`);
const { chromium } = require("playwright");
const ffmpeg = requireDocs("ffmpeg-static");

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const flow = JSON.parse(fs.readFileSync(args.flow, "utf8"));
const BASE = args.base ?? "http://localhost:3020";
const W = flow.w ?? 1280;
const H = flow.h ?? 900;
const STAGE = { width: 1920, height: 1080 };
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
const outDir = path.join(os.homedir(), "Desktop", "brightlocal-videos", `${flow.name}-${stamp}`);
fs.mkdirSync(outDir, { recursive: true });

const settings = (persona) => ({
  personaId: persona,
  look: "authored",
  variants: {},
  engine: "native-fixed",
  upsell: true,
  fixItForMe: true,
  beaconTone: flow.tone ?? "neutral",
  appearance: flow.appearance ?? "light",
});

const stageUrl = (url, bg, caption) => {
  const p = new URLSearchParams({ url, w: String(W), h: String(H), bg: bg ?? flow.bg ?? "neutral" });
  if (caption) p.set("caption", caption);
  return `${BASE}/meta/capture?${p.toString()}`;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: STAGE,
  deviceScaleFactor: 1,
  recordVideo: { dir: outDir, size: STAGE },
  reducedMotion: "no-preference",
});
await ctx.addInitScript((s) => {
  try { localStorage.setItem("grade-bl-demo-v2", JSON.stringify(s)); } catch {}
}, settings(flow.persona ?? "engaged"));

const page = await ctx.newPage();
let persona = flow.persona ?? "engaged";
let bg = flow.bg ?? "neutral";
let currentUrl = null;
let onStage = false;

const frame = () => page.frameLocator("[data-hook=capture-frame]");

/** The trial recap opens on its own when the persona is a trial or a lapsed
 *  trial, and it swallows every click behind it. A flow that wants it on
 *  screen says so with { "recap": true }; every other step closes it. */
async function dismissRecap() {
  const recap = frame().locator("[data-hook=trial-recap]");
  if (await recap.count().catch(() => 0)) {
    await page.keyboard.press("Escape");
    await wait(500);
  }
}

console.log(`recording ${flow.name} -> ${outDir}`);
for (const [i, step] of flow.steps.entries()) {
  const label = step.card ? `card ${step.card}` : step.go ? `go ${step.go}` : step.click ? `click ${step.click}` : step.persona ? `persona ${step.persona}` : Object.keys(step)[0];
  process.stdout.write(`  ${String(i + 1).padStart(2, "0")}  ${label}\n`);

  if (step.persona) {
    persona = step.persona;
    await ctx.addInitScript((s) => { try { localStorage.setItem("grade-bl-demo-v2", JSON.stringify(s)); } catch {} }, settings(persona));
    await page.evaluate((s) => { try { localStorage.setItem("grade-bl-demo-v2", JSON.stringify(s)); } catch {} }, settings(persona));
    if (onStage) {
      await page.evaluate(() => window.__stage?.reloadFrame());
      await page.locator("[data-hook=capture-stage][data-ready=true]").waitFor({ timeout: 40000 }).catch(() => {});
      await wait(400);
    }
  }

  if (step.card) {
    // Cards render INSIDE the stage: one document for the whole video, so a
    // cut never navigates and never flashes white.
    if (!onStage) {
      await page.goto(stageUrl(flow.steps.find((x) => x.go)?.go ?? "/locations/minus-one-studios/reviews", bg, undefined), { waitUntil: "networkidle", timeout: 90000 });
      onStage = true;
      await page.locator("[data-hook=capture-stage][data-ready=true]").waitFor({ timeout: 40000 }).catch(() => {});
    }
    await page.evaluate((slug) => window.__stage?.card(slug), step.card);
    await wait(step.ms ?? 2600);
    continue;
  }

  if (step.go) {
    bg = step.bg ?? bg;
    if (!onStage) {
      // First shot only: load the stage. Everything after is an in-place
      // swap, so the canvas never unloads and never flashes white.
      await page.goto(stageUrl(step.go, bg, step.caption), { waitUntil: "networkidle", timeout: 90000 });
      onStage = true;
    } else {
      await page.evaluate((next) => window.__stage?.set(next), { url: step.go, bg, caption: step.caption ?? undefined, card: null });
    }
    currentUrl = step.go;
    await page.locator("[data-hook=capture-stage][data-ready=true]").waitFor({ timeout: 40000 }).catch(() => {});
    // The caption trails the frame by ~900ms, so hold at least that long.
    await wait(Math.max(step.ms ?? 1600, 1400));
    if (!step.recap) await dismissRecap();
    continue;
  }

  if (step.caption !== undefined && !step.go && currentUrl) {
    // Repaint the stage caption without reloading the app inside: the
    // iframe keeps its state, only the canvas text changes.
    await page.evaluate((text) => window.__stage?.set({ caption: text }), step.caption);
    await wait(step.ms ?? 900);
    continue;
  }

  if (step.recap) {
    // Hold on the recap, then close it.
    await wait(step.ms ?? 3600);
    await page.keyboard.press("Escape");
    await wait(600);
    continue;
  }

  if (step.click) {
    await dismissRecap();
    // A beat before every popup, so the click reads as a decision rather
    // than a jump cut (Ali, 12 Sep).
    await wait(step.before ?? 900);
    const target = step.top ? page.locator(step.click) : frame().locator(step.click);
    await target.first().click({ timeout: 20000 });
    if (step.waitFor) await frame().locator(step.waitFor).first().waitFor({ timeout: 20000 }).catch(() => {});
    await wait(step.ms ?? 1800);
    continue;
  }

  if (step.key) {
    await page.keyboard.press(step.key);
    await wait(step.ms ?? 900);
    continue;
  }

  if (step.scrollBy !== undefined || step.scroll) {
    const to = step.scroll === "top" ? 0 : step.scroll === "bottom" ? 99999 : null;
    // A hand-driven scroll on requestAnimationFrame, not `behavior: smooth`.
    // The browser's own smooth scroll runs on a timer that the recorder's
    // load makes lumpy; this one moves the same distance every frame.
    const ms = step.ms ?? 1200;
    await frame().locator("body").evaluate((_, opts) => new Promise((done) => {
      const target = document.querySelector("[data-slot=scroll-area-viewport]") ?? document.scrollingElement ?? document.body;
      const from = target.scrollTop;
      const to = opts.to !== null ? opts.to : from + opts.by;
      const start = performance.now();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const tick = (now) => {
        const t = Math.min(1, (now - start) / opts.ms);
        target.scrollTop = from + (to - from) * ease(t);
        if (t < 1) requestAnimationFrame(tick); else done();
      };
      requestAnimationFrame(tick);
    }), { to, by: step.scrollBy ?? 0, ms });
    await wait(300);
    continue;
  }

  await wait(step.dwell ?? step.ms ?? 1600);
}

await wait(600);
const videoPath = await page.video().path();
await ctx.close();
await browser.close();

const mp4 = path.join(outDir, `${args.out ?? flow.name}.mp4`);
execFileSync(ffmpeg, ["-y", "-i", videoPath, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", mp4], { stdio: "inherit" });
fs.writeFileSync(path.join(outDir, "flow.json"), JSON.stringify(flow, null, 2));
console.log(`\n${mp4}`);
