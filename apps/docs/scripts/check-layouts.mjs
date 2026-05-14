#!/usr/bin/env node
/**
 * check-layouts.mjs — Playwright-driven responsive screenshotter for
 * reference layouts. Sister tool to `capture-layout-thumbnails.mjs`,
 * but does multiple viewports per layout and captures console errors,
 * because its consumer is the `responsive-reviewer` skill (in
 * `@gradeui/skills`) — which grades a multi-viewport ladder.
 *
 * Output structure:
 *
 *   public/layout-checks/<layout-id>/
 *     ├── 375.png        — viewport 375 × 800 (mobile)
 *     ├── 768.png        — viewport 768 × 800 (tablet)
 *     ├── 1024.png       — viewport 1024 × 800 (small desktop)
 *     ├── 1440.png       — viewport 1440 × 900 (wide)
 *     └── manifest.json  — { layoutId, snapshots: [{viewportWidth, file, consoleErrors[]}] }
 *
 * The manifest is the bridge to the responsive-reviewer skill — its
 * `snapshots[]` array maps 1:1 to the skill's input schema once you
 * resolve the file paths to fetchable URLs.
 *
 * Usage:
 *
 *   node scripts/check-layouts.mjs                         # all layouts, default ladder
 *   node scripts/check-layouts.mjs --layout airbnb-listings
 *   node scripts/check-layouts.mjs --widths 375,768,1280
 *   node scripts/check-layouts.mjs --base http://localhost:3000
 *
 * Requires the dev server (or a built docs site) running on the base
 * URL — same prerequisite as capture-layout-thumbnails.mjs. Default
 * base is http://localhost:3000.
 */

import { chromium } from "playwright";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Note: we deliberately don't `import { REFERENCE_LAYOUTS } from "@gradeui/studio/playbook"`
// here. The playbook barrel uses TS/Next directory imports (`export * from
// "./components"`) which raw Node ESM doesn't resolve. The only thing we
// actually need is the list of layout ids — which is the filenames in
// `packages/studio/src/playbook/layouts/scaffolds/`. Reading the
// filesystem keeps this script free of the TS-resolution headache and
// independent of whatever the playbook barrel does next.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCAFFOLD_DIR = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "studio",
  "src",
  "playbook",
  "layouts",
  "scaffolds",
);

async function discoverLayouts() {
  const entries = await readdir(SCAFFOLD_DIR);
  return entries
    .filter((f) => f.endsWith(".jsx") || f.endsWith(".tsx"))
    .map((f) => ({ id: f.replace(/\.(jsx|tsx)$/, "") }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ─── args ──────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const BASE = args.base ?? "http://localhost:3000";
const WIDTHS = (args.widths ?? "375,768,1024,1440")
  .split(",")
  .map((w) => parseInt(w.trim(), 10))
  .filter((w) => Number.isFinite(w) && w >= 320 && w <= 3840);
const HEIGHT = parseInt(args.height ?? "900", 10);
const LAYOUT_FILTER = args.layout ?? null;
const OUT_ROOT = path.resolve(__dirname, "..", "public", "layout-checks");

const allLayouts = await discoverLayouts();
const layouts = allLayouts.filter(
  (l) => !LAYOUT_FILTER || l.id === LAYOUT_FILTER,
);

if (layouts.length === 0) {
  console.error(`No layouts matched ${LAYOUT_FILTER ?? "<any>"}.`);
  process.exit(1);
}

console.log(`Checking ${layouts.length} layout(s) at widths: ${WIDTHS.join(", ")}`);
console.log(`Base URL: ${BASE}`);
console.log(`Output:   ${OUT_ROOT}`);

// ─── run ───────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true });

// Single browser context for the whole run. Sharing it across widths
// preserves Next dev's HMR cache, the iframe's JS-chunk HTTP cache, and
// the OS-level connection pool — so only the first width pays the cold
// compile cost. Per-context isolation per width was forcing a cold-start
// on every iteration, which (combined with Auth.js's slow-fail retry
// storm before AUTH_SECRET landed) reliably timed out random widths.
const context = await browser.newContext({
  viewport: { width: WIDTHS[0], height: HEIGHT },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

// `currentErrors` is the array the listeners push into. We swap it
// out per-width by reassigning the slot the listeners read from.
// Using a holder object so the closure captures the holder, not the
// array — re-assigning `holder.errors` is visible to listeners.
const errorsHolder = { errors: /** @type {string[]} */ ([]) };

page.on("console", (msg) => {
  if (msg.type() === "error") {
    const where = msg.location()?.url?.includes("/fast-sandbox")
      ? "iframe"
      : "page";
    errorsHolder.errors.push(`[${where}] ${truncate(msg.text(), 500)}`);
  }
});
page.on("pageerror", (err) => {
  errorsHolder.errors.push(`[page] pageerror: ${truncate(err.message, 500)}`);
});
context.on("weberror", (e) => {
  const where = e.page().url().includes("/fast-sandbox") ? "iframe" : "page";
  errorsHolder.errors.push(
    `[${where}] weberror: ${truncate(e.error().message ?? String(e.error()), 500)}`,
  );
});
page.on("requestfailed", (req) => {
  if (req.url().startsWith(BASE) || req.url().includes("api.maptiler.com")) {
    errorsHolder.errors.push(
      truncate(`requestfailed ${req.method()} ${req.url()} — ${req.failure()?.errorText ?? "unknown"}`, 500),
    );
  }
});

// Pre-warm the dev server once before the viewport loop. The first
// goto to /layout-preview/<id> triggers Next's on-demand compile of
// the route handler AND the /fast-sandbox iframe page — typically 5–
// 15 seconds cold. We pay that once here against a generous timeout
// rather than letting it consume the first viewport's 30s budget and
// silently strand it. After this, all layout × width combos hit warm
// HMR cache and finish in their normal sub-second time.
{
  const warmUrl = `${BASE}/layout-preview/${layouts[0].id}?snap=1`;
  console.log(`Pre-warming dev server: ${warmUrl}`);
  const t0 = Date.now();
  await page.goto(warmUrl, { waitUntil: "networkidle", timeout: 60_000 }).catch((err) => {
    console.log(`  ⚠ pre-warm goto failed: ${err.message}`);
  });
  // Wait for the iframe content too — that's the second compile pass.
  await page
    .waitForFunction(
      () => {
        const iframe = document.querySelector("iframe");
        const doc = iframe?.contentDocument;
        return !!(
          doc?.querySelector("[data-gds-part]") ||
          (doc?.body && doc.body.querySelectorAll("*").length > 30)
        );
      },
      null,
      { timeout: 60_000, polling: 250 },
    )
    .catch(() => {
      console.log(`  ⚠ pre-warm iframe didn't render — captures may still cold-start`);
    });
  console.log(`  ✓ pre-warm done in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

try {
  for (const layout of layouts) {
    const dir = path.join(OUT_ROOT, layout.id);
    if (existsSync(dir)) await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });

    const url = `${BASE}/layout-preview/${layout.id}?snap=1`;
    console.log(`\n→ ${layout.id}  (${url})`);

    const snapshots = [];

    for (const width of WIDTHS) {
      // Fresh per-width error bucket — listeners write here.
      errorsHolder.errors = [];
      const consoleErrors = errorsHolder.errors;

      // Resize before nav so the page hydrates at the target viewport.
      await page.setViewportSize({ width, height: HEIGHT });

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

        // Stage 1 — outer React tree mounted (`data-ready="1"`). Cheap
        // beacon the layout-preview page emits as soon as its top-level
        // div hydrates. Doesn't mean the Fast Frame iframe has rendered
        // anything yet — that's stage 2.
        await page
          .waitForSelector(`[data-layout-id="${layout.id}"][data-ready="1"]`, { timeout: 15_000 })
          .catch(() => {
            consoleErrors.push(`warn: outer ready marker not seen within 15s`);
          });

        // Stage 2 — Fast Frame iframe has actually rendered the scaffold.
        // We poll the iframe's contentDocument directly via the parent
        // page rather than using Playwright's frameLocator. Why: when
        // Fast Frame creates the iframe and sets src="/fast-sandbox",
        // Playwright's frameLocator can attach to the iframe element
        // before its document has navigated, and then keep querying
        // the stale initial document — a frequent source of "selector
        // never matches even though it's clearly there". Polling via
        // contentDocument from the parent always reads the live DOM.
        const iframeReady = await page
          .waitForFunction(
            () => {
              const iframe = document.querySelector("iframe");
              const doc = iframe?.contentDocument;
              if (!doc || !doc.body) return false;
              // Scaffold has rendered iff any element with data-gds-part
              // exists OR the body has a substantial subtree (any non-DS
              // scaffold falls back to the second condition).
              return (
                !!doc.querySelector("[data-gds-part]") ||
                doc.body.querySelectorAll("*").length > 30
              );
            },
            null,
            { timeout: 30_000, polling: 250 },
          )
          .then(() => true)
          .catch(() => false);

        if (!iframeReady) {
          // Capture iframe diagnostic info — body length, URL, any
          // visible error text — so the next debug pass has data.
          const diag = await page
            .evaluate(() => {
              const iframe = document.querySelector("iframe");
              const doc = iframe?.contentDocument;
              if (!doc) return { url: "no iframe", bodyChars: 0, sample: "" };
              return {
                url: iframe?.src ?? "(no src)",
                bodyChars: doc.body?.innerHTML?.length ?? 0,
                sample: (doc.body?.innerText ?? "").slice(0, 200),
              };
            })
            .catch(() => null);
          consoleErrors.push(
            `warn: iframe scaffold content didn't render within 30s — ` +
              `iframe state: ${JSON.stringify(diag)}`,
          );
        }

        // Brief settle so any Map / Three / async media finishes its
        // first frame after the scaffold tree appears.
        await page.waitForTimeout(600);

        const file = path.join(dir, `${width}.png`);
        await page.screenshot({ path: file, fullPage: false });

        snapshots.push({
          viewportWidth: width,
          file: path.relative(OUT_ROOT, file),
          consoleErrors,
        });
        console.log(`  ✓ ${width}px → ${path.relative(process.cwd(), file)}  (console errors: ${consoleErrors.length})`);
      } catch (err) {
        consoleErrors.push(`navigation error: ${err.message}`);
        snapshots.push({ viewportWidth: width, file: null, consoleErrors });
        console.log(`  ✗ ${width}px FAILED: ${err.message}`);
      }
    }

    const manifest = {
      layoutId: layout.id,
      capturedAt: new Date().toISOString(),
      base: BASE,
      snapshots,
    };
    await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  }
} finally {
  await context.close();
  await browser.close();
}

console.log(`\nDone. Output in ${path.relative(process.cwd(), OUT_ROOT)}/`);
console.log(`Inspect with:   open ${path.relative(process.cwd(), OUT_ROOT)}/<layout-id>/<width>.png`);
console.log(`Or feed manifests to responsive-reviewer via @gradeui/skills.`);

// ─── helpers ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[key] = next;
        i++;
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

function truncate(s, max) {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
