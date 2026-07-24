// capture-screens.mjs — retina (@2x) screenshots of a project's Studio
// screens, for slide decks / proposals / docs.
//
// For each BUILT screen it writes two PNGs:
//   full/<NN>-<slug>.png      — full content height (nothing crops)
//   1280x900/<NN>-<slug>.png  — fixed desktop frame (sidebar never
//                                  crops when dropped into a deck)
// Empty PLACEHOLDER screens (the dashed "page content goes here" stub,
// or the shared <EmptyPrototypePage/>) are skipped by default — pass
// --all to include them.
//
// The Next.js dev-mode indicator (the "N" nub, localhost only) and the
// shell tweaker hover-corner are hidden in every shot.
//
// Usage (from the repo root, dev server running on --base):
//   node scripts/capture-screens.mjs --project=<uuid> --out=./shots
//   node scripts/capture-screens.mjs --project=<uuid> --out=./shots --all
//   node scripts/capture-screens.mjs --project=<uuid> --out=./shots --base=https://gradeui.com
//   node scripts/capture-screens.mjs --project=<uuid> --out=./shots --ids=dmx1,dmx2
//
// Reads the Supabase service-role key from ./.mcp.json (never printed,
// never committed). Requires Playwright + Chromium (already a devdep of
// apps/mcp-server; `npx playwright install chromium` if missing).

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import https from "node:https";
import zlib from "node:zlib";

// Tag a PNG as 144 DPI (2x retina density) by inserting a pHYs chunk
// after IHDR. Playwright writes 72-DPI PNGs; at 72 DPI Figma/design
// tools import a 2560px shot oversized and it ends up scaled + soft.
// 144 DPI is exactly what macOS retina screenshots carry, so tools
// place it as a crisp 2x asset. Pixels are untouched — metadata only.
// Portable (no `sips`). Strips any existing pHYs then inserts a fresh
// one after IHDR — safe to re-run and safe on files that already carry
// a density chunk.
function setPngRetinaDpi(file) {
  const ppm = Math.round(144 / 0.0254); // pixels per metre
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0);
  data.writeUInt32BE(ppm, 4);
  data.writeUInt8(1, 8); // unit = metre
  const type = Buffer.from("pHYs");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(Buffer.concat([type, data])) >>> 0, 0);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(9, 0);
  const phys = Buffer.concat([len, type, data, crc]);

  const buf = fs.readFileSync(file);
  const sig = buf.subarray(0, 8);
  const chunks = [];
  let off = 8;
  while (off + 12 <= buf.length) {
    const clen = buf.readUInt32BE(off);
    const ctype = buf.toString("ascii", off + 4, off + 8);
    const end = off + 12 + clen;
    // Drop existing pHYs AND eXIf: Chromium's eXIf carries a 72-DPI
    // resolution that Figma/macOS read with priority over pHYs, so it
    // must go or the 144 tag is ignored and the shot imports oversized.
    if (ctype !== "pHYs" && ctype !== "eXIf") chunks.push(buf.subarray(off, end));
    off = end;
  }
  // IHDR is always the first chunk; place pHYs immediately after it.
  fs.writeFileSync(file, Buffer.concat([sig, chunks[0], phys, ...chunks.slice(1)]));
}

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..");
const require = createRequire(path.join(REPO, "apps/mcp-server/package.json"));
const { chromium } = require("playwright");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [a, true];
  }),
);
const PROJECT = args.project;
const OUT = args.out;
const BASE = (args.base || "http://localhost:3000").replace(/\/+$/, "");
const INCLUDE_EMPTY = Boolean(args.all);
const ONLY_IDS = args.ids ? String(args.ids).split(",") : null;
if (!PROJECT || !OUT) {
  console.error("Required: --project=<uuid> --out=<dir>");
  process.exit(1);
}

const mcp = JSON.parse(fs.readFileSync(path.join(REPO, ".mcp.json"), "utf8"));
const KEY = mcp.mcpServers["gradeui-dev"].env.SUPABASE_SERVICE_ROLE_KEY;
const SB_HOST = mcp.mcpServers["gradeui-dev"].env.SUPABASE_URL
  ? mcp.mcpServers["gradeui-dev"].env.SUPABASE_URL.replace(/\/+$/, "")
  : "https://fbftniekvvkbduwpuzfs.supabase.co";

function sb(pathname, opts = {}) {
  return new Promise((res, rej) => {
    const req = https.request(
      new URL(SB_HOST + pathname),
      {
        method: opts.method || "GET",
        headers: {
          apikey: KEY,
          Authorization: "Bearer " + KEY,
          "Content-Type": "application/json",
          ...(opts.headers || {}),
        },
      },
      (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => res(d));
      },
    );
    req.on("error", rej);
    if (opts.body) req.write(JSON.stringify(opts.body));
    req.end();
  });
}

// A screen is a PLACEHOLDER (skip unless --all) when it carries the
// generated dashed stub or the shared empty-state component.
const isPlaceholder = (src) =>
  src.includes("page content goes here") || src.includes("EmptyPrototypePage");

const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function ensureToken(designId) {
  const rows = JSON.parse(
    await sb(
      `/rest/v1/share_links?project_id=eq.${PROJECT}&design_id=eq.${designId}&mode=eq.view&revision_id=is.null&revoked=eq.false&order=created_at.desc&limit=1&select=token,color_mode`,
    ),
  );
  if (rows[0]) {
    if (rows[0].color_mode !== "light")
      await sb(`/rest/v1/share_links?token=eq.${rows[0].token}`, {
        method: "PATCH",
        body: { color_mode: "light" },
      });
    return rows[0].token;
  }
  return JSON.parse(
    await sb(`/rest/v1/share_links`, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: { project_id: PROJECT, design_id: designId, mode: "view", color_mode: "light" },
    }),
  )[0].token;
}

const HIDE_OUTER = `nextjs-portal{display:none!important}`;
const HIDE_INNER = `[data-slot="shell-tweaker"]{display:none!important}`;
async function hideChrome(page) {
  await page.addStyleTag({ content: HIDE_OUTER }).catch(() => {});
  await page
    .evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove()))
    .catch(() => {});
  const frame = page.frames().find((f) => f !== page.mainFrame());
  if (frame) await frame.addStyleTag({ content: HIDE_INNER }).catch(() => {});
}

// ── discover the screens ──────────────────────────────────────────────
let designs = JSON.parse(
  await sb(
    `/rest/v1/designs?project_id=eq.${PROJECT}&select=id,name,position,state&order=position`,
  ),
);
if (ONLY_IDS) designs = designs.filter((d) => ONLY_IDS.includes(d.id));
const targets = [];
let skipped = 0;
let n = 0;
for (const d of designs) {
  const src = d.state?.appSource ?? "";
  if (!INCLUDE_EMPTY && isPlaceholder(src)) {
    skipped++;
    continue;
  }
  n++;
  targets.push({ id: d.id, name: d.name, slug: slugify(d.name), prefix: String(n).padStart(2, "0") });
}
console.log(`${targets.length} screen(s) to capture, ${skipped} placeholder(s) skipped.`);

fs.mkdirSync(`${OUT}/full`, { recursive: true });
fs.mkdirSync(`${OUT}/1280x900`, { recursive: true });

const browser = await chromium
  .launch({ headless: true, channel: "chromium" })
  .catch(() => chromium.launch({ headless: true }));
const manifest = [];
for (const s of targets) {
  const token = await ensureToken(s.id);
  const url = `${BASE}/e/${token}?w=1280&motion=off`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
  await page
    .waitForFunction(
      () => {
        const f = document.querySelector("iframe");
        const d = f && f.contentDocument;
        return d && d.body && (d.body.innerText || "").trim().length > 30;
      },
      { timeout: 30000 },
    )
    .catch(() => {});
  // settle: maps + fonts + the double-buffered preview commit
  await page.waitForTimeout(4500);
  await hideChrome(page);

  const contentH = await page.evaluate(() => {
    const f = document.querySelector("iframe");
    const d = f && f.contentDocument;
    if (!d) return null;
    const v = d.querySelector("[data-radix-scroll-area-viewport]");
    return Math.max(v ? v.scrollHeight : 0, d.body ? d.body.scrollHeight : 0);
  });
  const fullH = Math.min(Math.max(contentH || 900, 640), 4000);

  const fixedPath = `${OUT}/1280x900/${s.prefix}-${s.slug}.png`;
  await page.screenshot({ path: fixedPath, type: "png" });
  setPngRetinaDpi(fixedPath);

  await page.setViewportSize({ width: 1280, height: fullH });
  await page.waitForTimeout(800);
  await hideChrome(page);
  const fullPath = `${OUT}/full/${s.prefix}-${s.slug}.png`;
  await page.screenshot({ path: fullPath, type: "png" });
  setPngRetinaDpi(fullPath);

  manifest.push({ prefix: s.prefix, name: s.name, slug: s.slug, id: s.id, fullPx: `2560x${fullH * 2}` });
  console.log(`  ✓ ${s.prefix}-${s.slug}  (full 1280x${fullH})`);
  await page.close();
}
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`Done — ${manifest.length} screen(s) → ${OUT}/{full,1280x900}/`);
