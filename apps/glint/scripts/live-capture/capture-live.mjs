// Capture suite for the LIVE Glint web portal build (web.staging.glintpay.com),
// the one the dev team is building separately. Stills at 1280x900 @2x of every
// state in states.mjs, with the URL each one was taken at, so Figma and our own
// staging prototype can be checked against what actually ships.
//
//   pnpm -F @gradeui/glint capture:live [--only=<substring>] [--out=<dir>]
//
// Needs the Glint VPN. Opens a real (headed) Chromium; sign in with your phone
// number and code the first time. The session is kept in a profile under
// ~/.cache/glint-live-capture, so later runs usually skip the sign-in. The
// script never navigates while you are signing in: it waits for the account
// menu button to appear.
//
// Writes, per run, captures/live/<timestamp>/:
//   <NN> <name>.png          1280x900, the deliverable
//   slide-852/<NN> <name>.png 1280x852, the content area of a Figma slide
//                             under the 48px Web DS BrowserBar
//   <NN> <name> · Full.png   the whole scroll height, for long pages
//   index.json               name, url, figmaPage, files, per state
//   urls.md                  the same as a readable list
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { STATES } from "./states.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, "../..");
const REPO = path.resolve(APP, "../..");
// playwright is a devDependency of apps/mcp-server, as for scripts/capture-states.mjs.
const require = createRequire(path.join(REPO, "apps/mcp-server/package.json"));
const { chromium } = require("playwright");

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = args.base ?? "https://web.staging.glintpay.com";
const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
const OUT = path.resolve(args.out ?? path.join(APP, "captures/live", stamp));
const PROFILE = path.join(os.homedir(), ".cache/glint-live-capture");
const W = 1280, H = 900, SLIDE_H = 852;

// Tag PNGs 144 DPI so Figma places them as crisp 2x images.
function setPngRetinaDpi(file) {
  const ppm = Math.round(144 / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0); data.writeUInt32BE(ppm, 4); data.writeUInt8(1, 8);
  const type = Buffer.from("pHYs");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])) >>> 0, 0);
  const len = Buffer.alloc(4); len.writeUInt32BE(9, 0);
  const buf = fs.readFileSync(file);
  // After the 8-byte signature and the 25-byte IHDR chunk.
  fs.writeFileSync(file, Buffer.concat([buf.subarray(0, 33), len, type, data, crc, buf.subarray(33)]));
}

fs.mkdirSync(OUT, { recursive: true });
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false, viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: "dark",
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

const accountBtn = () => page.locator('button[aria-label*="account menu"]');
async function waitForSignedIn() {
  console.log("Waiting for sign-in in the Chromium window…");
  await accountBtn().first().waitFor({ state: "visible", timeout: 900_000 });
  await page.waitForTimeout(2000);
  console.log("Signed in.");
}
await page.goto(`${BASE}/console/wallets`);
await page.waitForTimeout(3000);
await waitForSignedIn();

const settle = () => page.waitForTimeout(1800);
const helpers = {
  page,
  go: async (p) => { await page.goto(BASE + p); await page.waitForLoadState("networkidle").catch(() => {}); await settle(); },
  click: async (loc) => { await loc.first().click({ timeout: 5000 }); await settle(); },
  btn: (name) => page.getByRole("button", { name, exact: false }),
};

// The portal scrolls inside its main column, not the document, so a plain
// fullPage screenshot stops at the viewport. Grow the viewport by however far
// the tallest scroller overflows, shoot, then put it back.
async function overflow() {
  return page.evaluate(() => {
    let extra = 0;
    for (const el of document.querySelectorAll("*")) {
      const s = getComputedStyle(el);
      if (!/(auto|scroll)/.test(s.overflowY)) continue;
      extra = Math.max(extra, el.scrollHeight - el.clientHeight);
    }
    return Math.max(extra, document.documentElement.scrollHeight - innerHeight);
  });
}

const only = args.only?.toLowerCase();
const results = [];
for (const [i, s] of STATES.entries()) {
  if (only && !s.name.toLowerCase().includes(only)) continue;
  const base = `${String(i + 1).padStart(2, "0")} ${s.name}`;
  const files = {};
  try {
    await s.run(helpers);
    if (/log-in/.test(page.url())) { await waitForSignedIn(); await s.run(helpers); }
    if (/log-in/.test(page.url())) throw new Error("signed out");
    const url = page.url();

    files.png = `${base}.png`;
    await page.screenshot({ path: path.join(OUT, files.png) });

    await page.setViewportSize({ width: W, height: SLIDE_H });
    await page.waitForTimeout(600);
    files.slide = `slide-852/${base}.png`;
    fs.mkdirSync(path.join(OUT, "slide-852"), { recursive: true });
    await page.screenshot({ path: path.join(OUT, files.slide) });

    await page.setViewportSize({ width: W, height: H });
    await page.waitForTimeout(400);
    if (s.full) {
      const extra = Math.min(await overflow(), 8000);
      if (extra > 20) {
        await page.setViewportSize({ width: W, height: H + extra });
        await page.waitForTimeout(800);
        files.full = `${base} · Full.png`;
        await page.screenshot({ path: path.join(OUT, files.full) });
        await page.setViewportSize({ width: W, height: H });
      }
    }
    for (const f of Object.values(files)) setPngRetinaDpi(path.join(OUT, f));
    results.push({ name: s.name, url, figmaPage: s.figmaPage, files, ok: true });
    console.log("ok  ", base, url);
  } catch (e) {
    const err = String(e?.message ?? e).split("\n")[0];
    results.push({ name: s.name, figmaPage: s.figmaPage, ok: false, err });
    console.log("FAIL", base, err);
  }
  await page.keyboard.press("Escape").catch(() => {});
}

fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ base: BASE, capturedAt: new Date().toISOString(), states: results }, null, 2));
fs.writeFileSync(
  path.join(OUT, "urls.md"),
  `# Live build captures, ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n` +
    results.map((r) => `- ${r.name}: ${r.ok ? r.url : `FAILED (${r.err})`}`).join("\n") + "\n",
);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} captured → ${OUT}`);
await ctx.close();
