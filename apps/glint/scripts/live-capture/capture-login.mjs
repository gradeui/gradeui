// Sign-in and error states of the Glint build (web.staging.glintpay.com),
// in two halves:
//
// 1. Scripted, and safe: sign out, then the empty log-in page, the country
//    menu, an invalid number, an empty submit, 404s and the signed-out
//    redirect. Nothing here can send a text message: the only numbers typed
//    are too short to be real.
// 2. Watched: Ali signs in for real in the window. Every time the screen
//    settles into something new (a new page, a new error), it is captured.
//    Anything that texts his phone or could count towards a lockout (a wrong
//    code, resend, forgot passcode) is his to choose; this script never types
//    a code.
//
//   pnpm -F @gradeui/glint capture:live:login [--out=<dir>] [--no-signout]
//
// Same output shape as capture-live.mjs: 1280x900 @2x stills, slide-852/,
// index.json and urls.md.
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, "../..");
const REPO = path.resolve(APP, "../..");
const require = createRequire(path.join(REPO, "apps/mcp-server/package.json"));
const { chromium } = require("playwright");

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = args.base ?? "https://web.staging.glintpay.com";
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const OUT = path.resolve(args.out ?? path.join(APP, "captures/live", `${stamp}-login`));
const PROFILE = path.join(os.homedir(), ".cache/glint-live-capture");
const W = 1280, H = 900, SLIDE_H = 852;
const WATCH_MINUTES = 20;

function setPngRetinaDpi(file) {
  const ppm = Math.round(144 / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0); data.writeUInt32BE(ppm, 4); data.writeUInt8(1, 8);
  const type = Buffer.from("pHYs");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])) >>> 0, 0);
  const len = Buffer.alloc(4); len.writeUInt32BE(9, 0);
  const buf = fs.readFileSync(file);
  fs.writeFileSync(file, Buffer.concat([buf.subarray(0, 33), len, type, data, crc, buf.subarray(33)]));
}

fs.mkdirSync(path.join(OUT, "slide-852"), { recursive: true });
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: "dark",
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const settle = (ms = 1500) => page.waitForTimeout(ms);
const go = async (p) => { await page.goto(BASE + p); await page.waitForLoadState("networkidle").catch(() => {}); await settle(); };

const results = [];
let n = 0;
async function shoot(name) {
  n += 1;
  const base = `${String(n).padStart(2, "0")} ${name}`.replace(/[\/:]/g, "-");
  const url = page.url();
  const files = { png: `${base}.png`, slide: `slide-852/${base}.png` };
  await page.screenshot({ path: path.join(OUT, files.png) });
  // Resizing can re-render a client-side form and lose typed text, so the
  // slide crop is taken only when the page has nothing typed into it.
  const typed = await page.evaluate(() => [...document.querySelectorAll("input")].some((i) => i.value));
  if (!typed) {
    await page.setViewportSize({ width: W, height: SLIDE_H }); await settle(500);
    await page.screenshot({ path: path.join(OUT, files.slide) });
    await page.setViewportSize({ width: W, height: H }); await settle(300);
  } else {
    // Crop the top 852 px instead: the forms sit well above the fold.
    await page.screenshot({ path: path.join(OUT, files.slide), clip: { x: 0, y: 0, width: W, height: SLIDE_H } });
  }
  for (const f of Object.values(files)) setPngRetinaDpi(path.join(OUT, f));
  results.push({ name, url, figmaPage: name.startsWith("404") || name.startsWith("Signed out") ? "System states" : "Login", files });
  console.log("ok  ", base, url);
}
async function attempt(name, fn) {
  try { await fn(); } catch (e) { console.log("FAIL", name, String(e?.message ?? e).split("\n")[0]); }
}

// 1. Sign out, unless told not to.
await go("/console/wallets");
const signedIn = await page.locator('button[aria-label*="account menu"]').first().isVisible().catch(() => false);
if (signedIn && !("no-signout" in args)) {
  await page.locator('button[aria-label*="account menu"]').first().click(); await settle(800);
  await page.getByRole("menuitem", { name: /log out/i }).click();
  await page.waitForURL(/log-in/, { timeout: 15000 }).catch(() => {});
  await settle();
  console.log("Signed out.");
}

// 2. Scripted states. None sends a text.
await attempt("Log in · Default", async () => { await go("/log-in"); await shoot("Log in · Default"); });
await attempt("Log in · Country menu", async () => {
  await go("/log-in");
  await page.getByRole("combobox").first().click(); await settle(800);
  await shoot("Log in · Country menu");
  await page.keyboard.press("Escape");
});
await attempt("Log in · Empty submit", async () => {
  await go("/log-in");
  await page.getByRole("button", { name: /send code/i }).click(); await settle();
  await shoot("Log in · Empty submit");
});
await attempt("Log in · Invalid number", async () => {
  await go("/log-in");
  await page.locator('input[type="tel"], input[inputmode="tel"], input[name*="phone" i]').first().fill("12");
  await page.getByRole("button", { name: /send code/i }).click(); await settle();
  if (!/log-in\/?$/.test(new URL(page.url()).pathname)) console.log("NOTE: the invalid number left /log-in:", page.url());
  await shoot("Log in · Invalid number");
});
await attempt("404 · Console", async () => { await go("/console/this-page-does-not-exist"); await shoot("404 · Console"); });
await attempt("404 · Root", async () => { await go("/this-page-does-not-exist"); await shoot("404 · Root"); });
await attempt("Signed out · Console redirect", async () => { await go("/console/activity"); await shoot("Signed out · Console redirect"); });
const support = await page.locator('a', { hasText: /contact support/i }).first().getAttribute("href").catch(() => null);
const footer = await page.evaluate(() => [...document.querySelectorAll("footer a")].map((a) => `${a.textContent.trim()} -> ${a.getAttribute("href")}`)).catch(() => []);

// 3. Watched: Ali signs in. Capture each settled, new screen.
await go("/log-in");
console.log(`\nYOUR TURN: sign in in the Chromium window. Each new screen is captured; it stops once you are signed in (or after ${WATCH_MINUTES} min).`);
const signature = () => page.evaluate(() => {
  const root = document.querySelector("main") || document.body;
  const text = root.innerText.replace(/\s+/g, " ").replace(/\d/g, "#").slice(0, 800);
  const invalid = document.querySelectorAll('[aria-invalid="true"]').length;
  const dialogs = document.querySelectorAll('[role="dialog"],[role="alert"],[role="alertdialog"]').length;
  return `${location.pathname}|${invalid}|${dialogs}|${text}`;
}).catch(() => "");
const heading = () => page.evaluate(() => (document.querySelector("h1,h2")?.textContent || "").trim().slice(0, 40)).catch(() => "");
const seen = new Set([await signature()]);
const t0 = Date.now();
let last = "", stableSince = 0;
while (Date.now() - t0 < WATCH_MINUTES * 60_000) {
  if (await page.locator('button[aria-label*="account menu"]').first().isVisible().catch(() => false)) {
    await settle(1500); await shoot("Signed in · Landing"); break;
  }
  const sig = await signature();
  if (sig !== last) { last = sig; stableSince = Date.now(); }
  else if (Date.now() - stableSince > 1000 && !seen.has(sig)) {
    seen.add(sig);
    const p = new URL(page.url()).pathname.replace(/^\//, "") || "root";
    await shoot(`Watched · ${p} · ${await heading()}`);
  }
  await page.waitForTimeout(400);
}

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ base: BASE, capturedAt: new Date().toISOString(), support, footer, states: results }, null, 2));
fs.writeFileSync(path.join(OUT, "urls.md"),
  `# Glint build sign-in captures, ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n` +
  results.map((r) => `- ${r.name}: ${r.url}`).join("\n") +
  `\n\nContact support: ${support}\n${footer.map((f) => `Footer: ${f}`).join("\n")}\n`);
console.log(`\n${results.length} captured → ${OUT}`);
await ctx.close();
