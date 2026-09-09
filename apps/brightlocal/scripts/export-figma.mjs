#!/usr/bin/env node
/**
 * Everything, as flat PNGs for Figma (Ali, 12 Sep: "different sizes and
 * layouts of all these various banners putting into Figma as general
 * layouts, this will help to socialise it").
 *
 *   node apps/brightlocal/scripts/export-figma.mjs [--base=...] [--only=cards|deck|banners]
 *
 * Lands in ~/Desktop/brightlocal-figma-<stamp>/:
 *   cards/     every cut-scene card at 1920x1080
 *   deck/      every deck page at A4 landscape
 *   banners/   every Beacon surface, per persona, at four widths
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = "/Users/alastairdriver/Development/2026/ramp-ds/gradeui";
const require = createRequire(`${ROOT}/apps/mcp-server/package.json`);
const { chromium } = require("playwright");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = args.base ?? "http://localhost:3020";
const only = args.only;
const stamp = new Date().toISOString().slice(0, 10);
const OUT = path.join(os.homedir(), "Desktop", `brightlocal-figma-${stamp}`);

const CARDS = ["beacon", "hub", "manager", "tracker", "builder", "showcase", "roadmap", "account", "tones", "end",
  "persona-empty", "persona-starter", "persona-engaged", "persona-multi", "persona-agency", "persona-lapsed"];

/** The banners, where they live, and who has to be looking to see them. */
const BANNERS = [
  { hook: "review-summary-strip", path: "reviews", persona: "multi", location: "harbour-co-hove", name: "summary-strip" },
  { hook: "review-plan-strip", path: "reviews/manager", persona: "engaged", location: "minus-one-studios", name: "plan-strip" },
  { hook: "beacon-strip-tracker", path: "reviews/tracker", persona: "engaged", location: "minus-one-studios", name: "tracker-strip" },
  { hook: "beacon-strip-builder", path: "reviews/builder", persona: "engaged", location: "minus-one-studios", name: "builder-strip" },
  { hook: "beacon-strip-showcase", path: "reviews/showcase", persona: "engaged", location: "minus-one-studios", name: "showcase-strip" },
  { hook: "first-run-hub", path: "reviews", persona: "empty", location: "minus-one-studios", name: "first-run-band" },
  { hook: "qr-banner", path: "reviews", persona: "starter", location: "minus-one-studios", name: "qr-banner" },
  { hook: "connected-sites", path: "reviews/tracker", persona: "starter", location: "minus-one-studios", name: "connection-list" },
  { hook: "beacon-nugget-manager", path: "reviews/manager", persona: "engaged", location: "minus-one-studios", name: "nugget" },
  { hook: "review-quote-waiting", path: "ai-insights/reviews", persona: "engaged", location: "minus-one-studios", name: "quote-band" },
  { hook: "roadmap-card-week", path: "ai-insights/reviews", persona: "engaged", location: "minus-one-studios", name: "roadmap-stage" },
  { hook: "subscription-state", path: null, url: "/account/subscription", persona: "lapsed", location: "minus-one-studios", name: "winback-band" },
  { hook: "upgrade-path", path: null, url: "/account/subscription", persona: "engaged", location: "minus-one-studios", name: "upgrade-ladder" },
];
const WIDTHS = [1440, 1180, 900, 430];
const TONES = ["neutral", "tinted"];

const settings = (persona, tone) => ({ personaId: persona, look: "authored", variants: {}, engine: "native-fixed", upsell: true, fixItForMe: true, beaconTone: tone, appearance: "light" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();

if (!only || only === "cards") {
  const dir = path.join(OUT, "cards"); fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const slug of CARDS) {
    await page.goto(`${BASE}/meta/cards/${slug}`, { waitUntil: "networkidle", timeout: 90000 });
    await wait(500);
    await page.screenshot({ path: path.join(dir, `${slug}.png`) });
  }
  await ctx.close();
  console.log(`cards  ${CARDS.length}`);
}

if (!only || only === "deck") {
  const dir = path.join(OUT, "deck"); fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1123, height: 794 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/meta/deck?persona=multi&location=harbour-co-hove`, { waitUntil: "networkidle", timeout: 120000 });
  await wait(2500);
  const n = await page.locator(".deck-page").count();
  for (let i = 0; i < n; i += 1) {
    const el = page.locator(".deck-page").nth(i);
    await el.scrollIntoViewIfNeeded();
    await wait(250);
    await el.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, "0")}.png`) });
  }
  await ctx.close();
  console.log(`deck   ${n}`);
}

if (!only || only === "banners") {
  const dir = path.join(OUT, "banners"); fs.mkdirSync(dir, { recursive: true });
  let count = 0;
  for (const tone of TONES) {
    for (const b of BANNERS) {
      for (const width of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
        await ctx.addInitScript((s) => { try { localStorage.setItem("grade-bl-demo-v2", JSON.stringify(s)); } catch {} }, settings(b.persona, tone));
        const page = await ctx.newPage();
        const url = b.url ?? `/locations/${b.location}/${b.path}`;
        try {
          await page.goto(`${BASE}${url}`, { waitUntil: "networkidle", timeout: 90000 });
          await wait(900);
          await page.keyboard.press("Escape");
          await wait(300);
          const el = page.locator(`[data-hook=${b.hook}]`).first();
          if (await el.count()) {
            const sub = path.join(dir, tone, b.name);
            fs.mkdirSync(sub, { recursive: true });
            await el.scrollIntoViewIfNeeded();
            await wait(400);
            await el.screenshot({ path: path.join(sub, `${width}.png`) });
            count += 1;
          }
        } catch {}
        await ctx.close();
      }
    }
  }
  console.log(`banners ${count}`);
}

await browser.close();
console.log(`\n${OUT}`);
