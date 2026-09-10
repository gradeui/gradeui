/**
 * capture-states.mts — one thumbnail per entry in lib/states.ts.
 *
 *   npx tsx scripts/capture-states.mts [--only=<substring>] [--base=…]
 *
 * Drives the real app, not an embed, so Playwright's own clicks do the work
 * and there is no synthetic pointer sequence to keep in step with anything.
 * The browser side of this lives in lib/state-driver.ts and dispatches events
 * by hand instead, because there it is reaching into an iframe rather than
 * driving a page. Same steps, same catalogue, two idiomatic runners.
 *
 * Writes web-sized webp into public/states/ and a manifest of what passed. A
 * broken selector fails that ONE state and the run carries on: a thirty-state
 * run that dies on state three is worse than one with a gap in it.
 */

import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STATES } from "../lib/states";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(here, "..");
const ROOT = path.resolve(APP, "../..");
const require = createRequire(path.join(ROOT, "apps/mcp-server/package.json"));
const requireDocs = createRequire(path.join(ROOT, "apps/docs/package.json"));
const { chromium } = require("playwright");
const ffmpeg = requireDocs("ffmpeg-static");

const arg = (k: string, d: string | null = null) => {
  const m = process.argv.find((a) => a.startsWith(`--${k}=`));
  return m ? m.slice(k.length + 3) : d;
};
const BASE = arg("base", "http://localhost:3020")!;
const ONLY = (arg("only") ?? "").split(",").map((x) => x.trim()).filter(Boolean);

const OUT = path.join(APP, "public/states");
fs.mkdirSync(OUT, { recursive: true });

const wanted = STATES.filter((s) => !ONLY.length || ONLY.some((o) => s.id.includes(o)));
console.log(`${wanted.length} state(s) -> public/states/`);

const settings = (persona: string) => ({
  personaId: persona,
  look: "authored",
  variants: {},
  engine: "native-fixed",
  upsell: true,
  fixItForMe: true,
  beaconTone: "neutral",
  appearance: "light",
});

const browser = await chromium.launch();
const results: { id: string; ok: boolean; error?: string }[] = [];

for (const state of wanted) {
  const width = state.width ?? 1280;
  const persona = state.persona ?? "engaged";
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript((s: unknown) => {
    try { localStorage.setItem("grade-bl-demo-v2", JSON.stringify(s)); } catch {}
  }, settings(persona));
  const page = await ctx.newPage();
  const png = path.join(OUT, `${state.id}.png`);
  try {
    await page.goto(`${BASE}${state.path}`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1400);
    // The trial recap opens on its own for a trial or a lapsed trial and
    // swallows every click behind it. A state that wants it says so by
    // naming it in its own steps.
    const wantsRecap = (state.steps ?? []).some((s) => `${s.click ?? ""}${s.waitFor ?? ""}`.includes("trial-recap"));
    if (!wantsRecap && (await page.locator("[data-hook=trial-recap]").count())) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
    for (const step of state.steps ?? []) {
      if (step.click) await page.locator(step.click).first().click({ timeout: 15000 });
      if (step.key) await page.keyboard.press(step.key);
      if (step.scrollTo) await page.locator(step.scrollTo).first().scrollIntoViewIfNeeded({ timeout: 15000 });
      if (step.waitFor) await page.locator(step.waitFor).first().waitFor({ timeout: 15000 });
      await page.waitForTimeout(step.wait ?? 600);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: png, type: "png" });
    // webp at the width the page actually shows it: the grid card is about
    // 420 across and the sticky frame is the live iframe, not an image, so
    // nothing needs the full 2560.
    execFileSync(ffmpeg, ["-v", "error", "-y", "-i", png, "-vf", "scale=1024:-2", "-quality", "82",
      path.join(OUT, `${state.id}.webp`)]);
    fs.rmSync(png, { force: true });
    results.push({ id: state.id, ok: true });
    console.log(`  ok   ${state.id}`);
  } catch (e) {
    fs.rmSync(png, { force: true });
    const error = String(e).split("\n")[0].slice(0, 120);
    results.push({ id: state.id, ok: false, error });
    console.log(`  FAIL ${state.id} — ${error}`);
  }
  await ctx.close();
}

await browser.close();

// Drop thumbnails for states that no longer exist, so a renamed state does
// not leave a picture of itself behind looking live.
const live = new Set(STATES.map((s) => `${s.id}.webp`));
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith(".webp") && !live.has(f)) {
    fs.rmSync(path.join(OUT, f));
    console.log(`  removed a stale thumbnail: ${f}`);
  }
}

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ captured: new Date().toISOString(), results }, null, 2),
);
const ok = results.filter((r) => r.ok).length;
console.log(`\n${ok}/${results.length} states captured`);
if (ok < results.length) {
  console.log("failed:");
  for (const r of results.filter((x) => !x.ok)) console.log(`  ${r.id}  ${r.error}`);
}
