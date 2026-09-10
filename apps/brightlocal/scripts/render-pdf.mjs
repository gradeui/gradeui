#!/usr/bin/env node
/**
 * The deck as a PDF (Ali, 12 Sep). A4 landscape, one page per section of
 * /meta/deck, background printed.
 *
 *   node apps/brightlocal/scripts/render-pdf.mjs --persona=multi \
 *     [--location=harbour-co-hove] [--base=https://brightlocal-replatform.gradeui.com]
 *
 * Lands in ~/Desktop/brightlocal-decks/.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire("/Users/alastairdriver/Development/2026/ramp-ds/gradeui/apps/mcp-server/package.json");
const { chromium } = require("playwright");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = args.base ?? "http://localhost:3020";
const persona = args.persona ?? "multi";
const outDir = path.join(os.homedir(), "Desktop", "brightlocal-decks");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `${args.out ?? `insights-${persona}`}.pdf`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
const q = new URLSearchParams({ persona });
if (args.location) q.set("location", args.location);
await page.goto(`${BASE}/meta/deck?${q}`, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(2500);
await page.emulateMedia({ media: "print" });
await page.pdf({ path: out, width: "1123px", height: "794px", printBackground: true, pageRanges: "" });
await browser.close();
console.log(out);
