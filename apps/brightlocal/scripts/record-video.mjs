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
// Top and tail: a flow names its own pre-roll and post-roll cards, so every
// video opens and closes the same way without repeating steps in each file.
if (flow.preroll) flow.steps.unshift({ card: flow.preroll, ms: flow.prerollMs ?? 3000 });
if (flow.postroll) flow.steps.push({ card: flow.postroll, ms: flow.postrollMs ?? 3400 });
const BASE = args.base ?? "http://localhost:3020";
const W = flow.w ?? 1280;
const H = flow.h ?? 900;
const STAGE = { width: 1920, height: 1080 };
// ONE FOLDER PER FLOW, OVERWRITTEN (Ali, 10 Sep: "I don't need history, we
// can for now just go over the top if it is the same video"). Every run used
// to leave a new `<flow>-<stamp>` folder behind, and ten passes at the Hove
// cut had put ten copies of it on the Desktop.
const outDir = path.join(os.homedir(), "Desktop", "brightlocal-videos", flow.name);
fs.rmSync(outDir, { recursive: true, force: true });
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

const stageUrl = (url, bg, caption, card) => {
  const p = new URLSearchParams({ url, w: String(W), h: String(H), bg: bg ?? flow.bg ?? "neutral" });
  if (caption) p.set("caption", caption);
  if (card) p.set("card", card);
  return `${BASE}/meta/capture?${p.toString()}`;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

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

// WARM THE ROUTE FIRST. A cold dev server compiling /meta/capture is what
// puts three seconds of white at the head of whichever flow runs first, and
// the recording starts the moment the first page does. This page is thrown
// away before the recording context is made, so the compile happens off
// camera (video audits, 10 Sep).
{
  const warm = await browser.newContext({ viewport: STAGE });
  const wp = await warm.newPage();
  await wp.goto(`${BASE}/meta/capture?url=/locations/minus-one-studios/reviews&w=${W}&h=${H}&card=${flow.preroll ?? "beacon"}`,
    { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
  await wp.waitForTimeout(1200);
  await warm.close();
}

const page = await ctx.newPage();
// THE TIMELINE (Ali, 10 Sep: "I need them in sync ... I will alongside this
// want an official subtitle track, and points in the video that can be jumped
// to"). recordVideo starts with the first page, so wall clock from here is
// video time, less the HEAD_TRIM the encode takes off the front. Every caption
// and every cut-scene card stamps itself, and the two sidecars fall out of it.
let HEAD_TRIM = 0.7; // replaced by the measured trim before the sidecars
const t0 = Date.now();
const marks = [];
const raw = () => (Date.now() - t0) / 1000;
const at = () => Math.max(0, raw() - HEAD_TRIM);
const mark = (kind, text, extra) => { if (text) marks.push({ kind, text, t: at(), ...extra }); };
let persona = flow.persona ?? "engaged";
let bg = flow.bg ?? "neutral";
let currentUrl = null;
let onStage = false;

const frame = () => page.frameLocator("[data-hook=capture-frame]");

/** A chapter, read off the cut-scene card itself so the video, the page and
 *  the thumbnail can never drift apart: the card's headline is the section
 *  name and its line is the section's description. */
async function cardChapter(slug) {
  const card = page.locator("[data-cut-scene-card]").first();
  const clean = (t) => (t || "").replace(/\s+/g, " ").trim();
  const title = clean(await card.locator("h1").first().innerText({ timeout: 4000 }).catch(() => null));
  const line = clean(await card.locator("p").first().innerText({ timeout: 2000 }).catch(() => null));
  return { slug, title: title || slug, line };
}

/** Hold until the framed screen is fully opaque. Clicking into a frame that
 *  is still fading in opened a dialog over a half-lit page and left it that
 *  way for the rest of the shot, which is the ghosting both video audits
 *  found in the Hove cut (10 Sep). Cheap insurance against it returning. */
async function waitForFrameSettled() {
  await page
    .waitForFunction(() => {
      const el = document.querySelector("[data-hook=capture-frame]")?.parentElement;
      return !el || Number(getComputedStyle(el).opacity) > 0.99;
    }, null, { timeout: 8000 })
    .catch(() => {});
}

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

  // A STEP CAN NAME A SECTION (Ali, 10 Sep: "something like Every dialog
  // should actually have more sections"). Cut-scene cards divide most flows,
  // but a walkthrough of eight dialogs has no cards between them, so the flow
  // says where its sections are and the still comes off the screen itself.
  if (step.chapter) marks.push({ kind: "card", text: step.chapter, t: at(), slug: step.chapterSlug ?? slugify(step.chapter), line: step.chapterLine ?? "" });

  if (step.card) {
    // Cards render INSIDE the stage: one document for the whole video, so a
    // cut never navigates and never flashes white.
    if (!onStage) {
      // The card is painted server-side on the first frame, so the video
      // opens on the card rather than on an empty canvas.
      await page.goto(stageUrl(flow.steps.find((x) => x.go)?.go ?? "/locations/minus-one-studios/reviews", bg, undefined, step.card), { waitUntil: "domcontentloaded", timeout: 90000 });
      onStage = true;
      { const c = await cardChapter(step.card); mark("card", c.title, { slug: c.slug, line: c.line }); }
      await wait(step.ms ?? 2600);
      await page.locator("[data-hook=capture-stage][data-ready=true]").waitFor({ timeout: 40000 }).catch(() => {});
      continue;
    }
    await page.evaluate((slug) => window.__stage?.card(slug), step.card);
    { const c = await cardChapter(step.card); mark("card", c.title, { slug: c.slug, line: c.line }); }
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
    mark("caption", step.caption);
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
    mark("caption", step.caption);
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
    await waitForFrameSettled();
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

/** How much blank to take off the front, MEASURED rather than guessed.
 *
 *  The browser paints white before the first document does, and how long it
 *  holds depends on the machine: a fixed 0.7s was enough for most flows and
 *  left the popovers cut opening on 41 frames of pure white (video audit,
 *  10 Sep). A blank frame is a FLAT one, so the first frame whose luma has
 *  any spread at all is the first frame with something on it. */
function headTrim(src) {
  // `metadata=print:file=-` writes to STDOUT, one "frame:N ... pts_time:T"
  // header per frame followed by its keys. Without file=- the same lines go
  // to stderr with a "[Parsed_metadata]" prefix and no pts_time beside them,
  // which is what this used to try to read, and it parsed nothing.
  let out = "";
  try {
    out = execFileSync(ffmpeg, ["-v", "error", "-t", "4", "-i", src, "-vf", "signalstats,metadata=print:file=-", "-f", "null", "-"],
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  } catch (e) { out = String(e.stdout ?? "") || String(e.stderr ?? ""); }
  const frames = [];
  // YLOW, YAVG and YHIGH sit between YMIN and YMAX, so the gap has to allow
  // any number of lines. Lazy, so it stays inside one frame.
  const re = /pts_time:([\d.]+)[\s\S]*?YMIN=(\d+)[\s\S]*?YMAX=(\d+)/g;
  let m;
  while ((m = re.exec(out))) frames.push({ t: Number(m[1]), spread: Number(m[3]) - Number(m[2]) });
  if (!frames.length) console.log("  head trim: no frame stats, falling back");
  const first = frames.find((f) => f.spread > 40);
  // Never trim more than 3s, and never less than the old 0.7: a flow that
  // opens on a flat-colour card would otherwise lose its opening.
  if (!first) return 0.7;
  return Math.min(3, Math.max(0.7, first.t));
}

const trim = headTrim(videoPath);
console.log(`head trim ${trim.toFixed(2)}s`);
execFileSync(ffmpeg, ["-y", "-ss", String(trim), "-i", videoPath, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-r", "30", mp4], { stdio: "inherit" });
// The webm is Playwright's intermediate and nothing reads it once the mp4
// exists, so it goes rather than sitting there at twice the mp4's size.
fs.rmSync(videoPath, { force: true });
fs.writeFileSync(path.join(outDir, "flow.json"), JSON.stringify(flow, null, 2));

// ── THE SIDECARS ──────────────────────────────────────────────────────
// captions.vtt is a real subtitle track: a cue runs from the moment its
// caption was set until the next caption or card. chapters.json is the
// jump-to list, one entry per cut-scene card plus the opening.
// The marks were stamped against the provisional trim; restate them all
// against the measured one so the subtitles stay on the frame.
const shift = trim - 0.7;
for (const m of marks) m.t = Math.max(0, m.t - shift);
HEAD_TRIM = trim;
const total = at();
const clock = (sec) => {
  const s = Math.max(0, sec);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  const ms = String(Math.round((s % 1) * 1000)).padStart(3, "0");
  return `${h}:${m}:${ss}.${ms}`;
};
const cues = [];
marks.forEach((m, i) => {
  if (m.kind !== "caption") return;
  const end = marks[i + 1]?.t ?? total;
  if (end - m.t < 0.4) return;
  cues.push(`${cues.length + 1}\n${clock(m.t)} --> ${clock(end)}\n${m.text}\n`);
});
fs.writeFileSync(path.join(outDir, "captions.vtt"), `WEBVTT\n\n${cues.join("\n")}`);

// A STABLE ID PER SECTION (Ali, 10 Sep: "name the thumbnails for the sections
// with unique IDs so I can reference them easily"). `<flow>--<nn>-<card>`, and
// the section's thumbnail is that id with .jpg on the end, so a section can be
// pointed at from anywhere without looking anything up.
const cardMarks = marks.filter((m) => m.kind === "card");
const chapters = cardMarks.map((m, i) => {
  const next = cardMarks[i + 1];
  return {
    id: `${flow.name}--${String(i + 1).padStart(2, "0")}-${m.slug}`,
    card: m.slug,
    title: m.text,
    description: m.line ?? "",
    t: Number(m.t.toFixed(2)),
    end: Number((next?.t ?? total).toFixed(2)),
  };
});
fs.writeFileSync(
  path.join(outDir, "chapters.json"),
  JSON.stringify({ name: flow.name, duration: Number(total.toFixed(2)), chapters, marks: marks.map((m) => ({ ...m, t: Number(m.t.toFixed(2)) })) }, null, 2),
);

console.log(`\n${mp4}`);
console.log(`${cues.length} caption cues, ${chapters.length} chapters`);
