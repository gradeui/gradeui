// capture-screens.mjs — retina (@2x) screenshots of a project's Studio
// screens, for slide decks / proposals / docs.
//
// For each BUILT screen it writes three PNGs:
//   full/<NN>-<slug>.png      — full content height (nothing crops)
//   1280x900/<NN>-<slug>.png  — fixed desktop frame (sidebar never
//                                  crops when dropped into a deck)
//   1280x834/<NN>-<slug>.png  — the flow-video frame (matches the
//                                  recorder's 1280x834, for slide decks
//                                  that mix stills with section clips)
//
// Shots drive the /s/ SHARE route (?fullscreen=1), not the /e/ embed —
// the share route loads the project's custom CSS from the rules area
// (e.g. the brightlocal sidebar-width rule that stops "Google Business
// Profile" wrapping); the embed omits it. Share renders at natural
// size, so the viewport IS the layout size (no scale-up needed).
// Empty PLACEHOLDER screens (the dashed "page content goes here" stub,
// or the shared <EmptyPrototypePage/>) are skipped by default — pass
// --all to include them.
//
// The Next.js dev-mode indicator (the "N" nub, localhost only) and the
// shell tweaker hover-corner are hidden in every shot.
//
// Usage (from the repo root, dev server running on --base):
//   node scripts/capture-screens.mjs --project=<uuid>
//   node scripts/capture-screens.mjs --project=<uuid> --all
//   node scripts/capture-screens.mjs --project=<uuid> --base=https://gradeui.com
//   node scripts/capture-screens.mjs --project=<uuid> --ids=dmx1,dmx2
//
// Every run lands in a fresh TIMESTAMPED folder so re-runs never
// overwrite: <out>/<YYYYMMDD-HHMMSS>/{full,1280x900,1280x834}/.
// --out defaults to ~/Desktop/brightlocal-screens (where Ali keeps them).
//
// Reads the Supabase service-role key from ./.mcp.json (never printed,
// never committed). Requires Playwright + Chromium (already a devdep of
// apps/mcp-server; `npx playwright install chromium` if missing).

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import os from "node:os";
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
const BASE = (args.base || "http://localhost:3000").replace(/\/+$/, "");
const INCLUDE_EMPTY = Boolean(args.all);
const ONLY_IDS = args.ids ? String(args.ids).split(",") : null;
if (!PROJECT) {
  console.error("Required: --project=<uuid>  (--out defaults to ~/Desktop/brightlocal-screens)");
  process.exit(1);
}
// Timestamped run folder — never overwrite a previous set.
const __d = new Date();
const __p = (n) => String(n).padStart(2, "0");
const STAMP = `${__d.getFullYear()}${__p(__d.getMonth() + 1)}${__p(__d.getDate())}-${__p(__d.getHours())}${__p(__d.getMinutes())}${__p(__d.getSeconds())}`;
const OUT_BASE =
  args.out && args.out !== true
    ? String(args.out)
    : path.join(os.homedir(), "Desktop", "brightlocal-screens");
const OUT = path.join(OUT_BASE, STAMP);
// --themes=heavy-depth,live-site — capture each screen under each shell
// tweaker LOOK preset (current | subtle-depth | heavy-depth | live-site).
// Applied via the same mechanism the flow recorder uses: a synthetic
// Alt+T into the iframe opens the tweaker, a native selectOption picks
// the preset, Alt+T closes it again before the shot. Screens without
// the tweaker (no proposal shell) are shot as-is with a note.
// Output nests one folder per preset: <stamp>/<preset>/{full,...}/.
const THEMES = args.themes
  ? String(args.themes).split(",").map((t) => t.trim()).filter(Boolean)
  : null;

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
// NOTE: the shell tweaker is NOT hidden — its corner is invisible when
// closed (same finding as the flow recorder), and a display:none on
// [data-slot="shell-tweaker"] breaks --themes: Playwright's selectOption
// refuses to act on a hidden <select>, so every theme pass silently
// fell back to "NO TWEAKER". applyTheme() closes the panel before shots.
async function hideChrome(page) {
  await page.addStyleTag({ content: HIDE_OUTER }).catch(() => {});
  await page
    .evaluate(() => document.querySelectorAll("nextjs-portal").forEach((n) => n.remove()))
    .catch(() => {});
}

// ── discover the screens ──────────────────────────────────────────────
let designs = JSON.parse(
  await sb(
    `/rest/v1/designs?project_id=eq.${PROJECT}&select=id,name,position,state&order=position`,
  ),
);
// --ids: filter AND number in the order GIVEN (flow order for a
// storyboard), not the project's position order.
if (ONLY_IDS)
  designs = designs
    .filter((d) => ONLY_IDS.includes(d.id))
    .sort((a, b) => ONLY_IDS.indexOf(a.id) - ONLY_IDS.indexOf(b.id));
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

// Variant dirs are created on demand (themed runs nest per preset).
const ensureDir = (d) => (fs.mkdirSync(d, { recursive: true }), d);

// Wait for the sandbox to receive + render its source (used on first
// load AND after a healing reload).
async function waitForContent(page) {
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
  await page.waitForTimeout(4500); // maps + fonts + double-buffer commit
}

// Toggle the shell tweaker (Alt+T, dispatched inside the screen iframe —
// same synthetic-keydown the flow recorder uses) and pick a look preset.
// Returns true if the preset was applied, false if this screen has no
// tweaker (shot proceeds unthemed).
async function applyTheme(page, preset) {
  const frame = page.frames().find((f) => f !== page.mainFrame());
  if (!frame) return false;
  const toggle = async () => {
    await frame.evaluate(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "t", code: "KeyT", altKey: true, bubbles: true }),
      );
    });
    await page.waitForTimeout(450); // panel open/close + CSS settle
  };
  try {
    await toggle(); // open
    await frame
      .locator('[data-hook="tweaker-preset"]')
      .first()
      .selectOption(String(preset), { timeout: 3000 });
    await page.waitForTimeout(650); // let the re-skin settle
    await toggle(); // close — the panel must not be in the shot
    await page.waitForTimeout(250);
    return true;
  } catch {
    await toggle().catch(() => {}); // close if we did open something
    return false;
  }
}

const browser = await chromium
  .launch({ headless: true, channel: "chromium" })
  .catch(() => chromium.launch({ headless: true }));
const manifest = [];
const failures = [];
for (const s of targets) {
  let page;
  try {
  const token = await ensureToken(s.id);
  // /s/ (share) not /e/ (embed): the share route pulls the project's
  // custom CSS (sidebar width) and renders at natural viewport size.
  // No motion param on /s/ — the 4.5s settle outlasts entrance motion.
  // Explicit view=responsive&zoom=100 pins the share state (individual
  // params beat the fullscreen macro) — relying on the macro's seeding
  // occasionally left a Fit-zoomed device frame in the shot.
  const url = `${BASE}/s/${token}?fullscreen=1&view=responsive&zoom=100`;
  page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  // Dev-mode first renders can be slow (route compile + share queries) —
  // give goto a generous budget and one retry rather than dying mid-run.
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  } catch {
    console.log(`  … ${s.prefix}-${s.slug}: slow load, retrying`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await waitForContent(page);
  await hideChrome(page);

  const contentH = await page.evaluate(() => {
    const f = document.querySelector("iframe");
    const d = f && f.contentDocument;
    if (!d) return null;
    const v = d.querySelector("[data-radix-scroll-area-viewport]");
    return Math.max(v ? v.scrollHeight : 0, d.body ? d.body.scrollHeight : 0);
  });
  const fullH = Math.min(Math.max(contentH || 900, 640), 4000);

  // One pass per look preset (or a single unthemed pass). The page is
  // loaded once; the theme is switched in-page between passes.
  for (const theme of THEMES ?? [null]) {
    let themed = null;
    if (theme) {
      // reset to the base frame before re-theming (a prior pass leaves
      // the viewport at full height)
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.waitForTimeout(400);
      themed = await applyTheme(page, theme);
      await hideChrome(page);
    }
    const dir = theme ? `${OUT}/${theme}` : OUT;
    // Reset EVERY scroll area (main content AND the sidebar nav) so no
    // shot inherits a scroll offset from a resize.
    const resetScrolls = () =>
      page
        .evaluate(() => {
          document.scrollingElement && (document.scrollingElement.scrollTop = 0);
          for (const f of document.querySelectorAll("iframe")) {
            const d = f.contentDocument;
            if (!d) continue;
            d.querySelectorAll("[data-radix-scroll-area-viewport]").forEach((v) => (v.scrollTop = 0));
          }
        })
        .catch(() => {});
    // The share view MUST be full-bleed before a shot: some sandbox
    // iframe fills the viewport exactly (a resize occasionally leaves a
    // Fit-scaled inset frame or a vertical offset — the two corruption
    // modes the verify pass caught). If it doesn't settle, a reload
    // (plus re-applying the theme) heals the stuck state.
    const waitFullBleed = (w, h) =>
      page
        .waitForFunction(
          ([vw, vh]) =>
            [...document.querySelectorAll("iframe")].some((f) => {
              const r = f.getBoundingClientRect();
              if (
                Math.abs(r.x) >= 1.5 ||
                Math.abs(r.y) >= 1.5 ||
                Math.abs(r.width - vw) >= 2 ||
                Math.abs(r.height - vh) >= 2
              )
                return false;
              // The zoom transform can live on a wrapper INSIDE the
              // frame (outer iframe full-size, content scaled into a
              // rounded inset card) — require the inner document to
              // fill the frame too.
              const d = f.contentDocument;
              const b = d && d.body && d.body.getBoundingClientRect();
              return !!b && Math.abs(b.x) < 1.5 && Math.abs(b.width - vw) < 2;
            }),
          [w, h],
          { timeout: 6000 },
        )
        .then(() => true)
        .catch(() => false);
    const shot = async (sub, w, h, settle) => {
      await page.setViewportSize({ width: w, height: h });
      await resetScrolls();
      await page.waitForTimeout(Math.max(settle, 800));
      if (!(await waitFullBleed(w, h))) {
        console.log(`  … ${s.prefix}-${s.slug} [${sub}]: layout stuck, reloading to heal`);
        await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        await waitForContent(page);
        if (theme) await applyTheme(page, theme);
        await resetScrolls();
        await page.waitForTimeout(800);
        if (!(await waitFullBleed(w, h)))
          console.log(`  ⚠️ ${s.prefix}-${s.slug} [${sub}]: STILL not full-bleed after reload — check this shot`);
      }
      await hideChrome(page);
      const p = path.join(ensureDir(`${dir}/${sub}`), `${s.prefix}-${s.slug}.png`);
      await page.screenshot({ path: p, type: "png" });
      setPngRetinaDpi(p);
    };
    await shot("1280x900", 1280, 900, 400);
    // The flow-video frame — identical dimensions to the recorder's
    // section clips, so stills and clips mix cleanly in one deck.
    await shot("1280x834", 1280, 834, 600);
    await shot("full", 1280, fullH, 800);

    manifest.push({
      prefix: s.prefix, name: s.name, slug: s.slug, id: s.id,
      fullPx: `2560x${fullH * 2}`,
      ...(theme ? { theme, themed } : {}),
    });
    const tag = theme ? `  [${theme}${themed ? "" : " — NO TWEAKER, shot as-is"}]` : "";
    console.log(`  ✓ ${s.prefix}-${s.slug}  (full 1280x${fullH})${tag}`);
  }
  await page.close();
  } catch (e) {
    // One bad screen must not kill the run — log it, close, move on.
    const msg = String(e && e.message ? e.message : e).split("\n")[0];
    failures.push(`${s.prefix}-${s.slug}: ${msg}`);
    console.log(`  ✗ ${s.prefix}-${s.slug}  FAILED: ${msg}`);
    try { if (page) await page.close(); } catch {}
  }
}
if (failures.length) {
  console.log(`\n⚠️  ${failures.length} screen(s) failed — re-run those with --ids:`);
  failures.forEach((f) => console.log(`   ${f}`));
}
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
await browser.close();
console.log(`Done — ${manifest.length} screen(s) → ${OUT}/{full,1280x900,1280x834}/`);
