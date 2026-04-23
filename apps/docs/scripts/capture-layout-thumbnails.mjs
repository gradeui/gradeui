#!/usr/bin/env node
/**
 * capture-layout-thumbnails.mjs
 *
 * Drives a headless Chromium through `/layout-preview/<id>` for every
 * ReferenceLayout in `@gradeui/studio/playbook`, waits for Sandpack to
 * finish booting, and writes a PNG per layout into
 * `public/layout-thumbs/<id>.png`. The StarterPicker (#45) looks for
 * those PNGs by URL; missing files fall back to a deterministic
 * gradient so the picker never looks broken mid-capture.
 *
 * Prereqs (one-time):
 *   pnpm -F @gradeui/docs add -D playwright
 *   pnpm -F @gradeui/docs exec playwright install chromium
 *
 * Usage:
 *   # Capture against a running dev server (default: http://localhost:3000).
 *   pnpm -F @gradeui/docs dev
 *   # …in another terminal:
 *   pnpm -F @gradeui/docs capture:layout-thumbs
 *
 *   # Or point at a custom URL:
 *   THUMB_BASE_URL=http://localhost:4321 pnpm -F @gradeui/docs capture:layout-thumbs
 *
 *   # Single-layout regenerate (useful after tweaking a scaffold):
 *   THUMB_LAYOUT_ID=ecommerce-listing pnpm -F @gradeui/docs capture:layout-thumbs
 *
 * Why not built-in Next Image optimization or static generation?
 *   The scaffolds run INSIDE Sandpack — they're fed to a bundler as
 *   strings, not React components the outer app can render directly.
 *   So a "real" screenshot has to wait for the bundler inside the
 *   iframe to produce output, which only a headed browser-with-network
 *   can do. Playwright is the cheapest tool that lets us settle on
 *   "bundle is actually rendered" instead of "HTML is shipped".
 *
 * Contract with the picker:
 *   - Thumbnails are 16:10, captured at 1280×800 (same aspect the
 *     LayoutCard renders). Changing the capture size here wants a
 *     matching change in starter-picker.tsx.
 *   - Output is PNG — small file size, no jpeg artefacting on text-
 *     heavy UI scaffolds.
 *   - File naming: exactly `<layout.id>.png`. Any other extension or
 *     casing will miss the picker's `img src`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Pull the registry straight from the playbook. We resolve through the
// package's `./playbook` export so we can't accidentally drift from
// what the app itself consumes.
const { REFERENCE_LAYOUTS } = await import("@gradeui/studio/playbook");

const __dirname = dirname(fileURLToPath(import.meta.url));
// Thumbnails live under public/ so Next serves them at /layout-thumbs/...
const THUMB_DIR = resolve(__dirname, "..", "public", "layout-thumbs");

const BASE_URL = process.env.THUMB_BASE_URL ?? "http://localhost:3000";
const ONLY_ID = process.env.THUMB_LAYOUT_ID ?? null;

// Matches the aspect ratio the picker card renders (16:10). 1280×800 is
// also a comfortable "laptop" width that doesn't trip any `sm:` or `md:`
// Tailwind breakpoints into mobile mode inside the preview.
const VIEWPORT = { width: 1280, height: 800 };

// How long we're willing to wait for a Sandpack preview to boot before
// giving up on a layout. First-run npm installs inside Sandpack's
// sandbox can be slow, especially on cold CI. Failures here indicate a
// scaffold that's crashing at boot — treat them as build errors.
const BOOT_TIMEOUT_MS = 120_000;

// After the preview iframe has non-zero content we wait this long for
// fonts / transitions / late-paint images to settle. Too short and the
// first thumbnail captures a skeletal tree; too long and the script
// takes forever.
const SETTLE_MS = 2500;

let playwright;
try {
  playwright = await import("playwright");
} catch (err) {
  console.error(
    "\n✗ playwright is not installed.\n" +
      "  Run:  pnpm -F @gradeui/docs add -D playwright\n" +
      "        pnpm -F @gradeui/docs exec playwright install chromium\n"
  );
  process.exit(1);
}

const layouts = ONLY_ID
  ? REFERENCE_LAYOUTS.filter((l) => l.id === ONLY_ID)
  : REFERENCE_LAYOUTS;

if (layouts.length === 0) {
  console.error(
    `✗ No layout matches THUMB_LAYOUT_ID=${ONLY_ID}. ` +
      `Known ids: ${REFERENCE_LAYOUTS.map((l) => l.id).join(", ")}`
  );
  process.exit(1);
}

console.log(
  `Capturing ${layouts.length} thumbnail${layouts.length === 1 ? "" : "s"} ` +
    `from ${BASE_URL} → ${THUMB_DIR}`
);

await mkdir(THUMB_DIR, { recursive: true });

const browser = await playwright.chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // Retina-crisp thumbnails; ~2x PNG size but negligible.
  });

  for (const layout of layouts) {
    const url = `${BASE_URL}/layout-preview/${layout.id}?snap=1`;
    const outPath = resolve(THUMB_DIR, `${layout.id}.png`);
    console.log(`  • ${layout.id} …`);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

      // Step 1: outer page mounted (ReadinessBeacon flipped data-ready).
      await page.waitForSelector(
        `[data-layout-id="${layout.id}"][data-ready="1"]`,
        { timeout: 15_000 }
      );

      // Step 2: wait for the Sandpack-generated iframe to paint. The
      // iframe appears inside Sandpack's preview surface; we poll for
      // (a) an <iframe> in the DOM, (b) its contentWindow reporting a
      // non-empty document body height. This is the best proxy for
      // "bundler finished and ran the component" that doesn't depend on
      // Sandpack exposing a public event.
      await page.waitForFunction(
        () => {
          const frames = document.querySelectorAll("iframe");
          for (const f of frames) {
            try {
              const doc = /** @type {HTMLIFrameElement} */ (f)
                .contentDocument;
              if (doc && doc.body && doc.body.scrollHeight > 40) return true;
            } catch {
              // Cross-origin iframe — treat as "not ours, not ready."
            }
          }
          return false;
        },
        { timeout: BOOT_TIMEOUT_MS, polling: 500 }
      );

      // Settle: fonts, CSS transitions, late image loads. Without this
      // the first frame can capture pre-font-swap text and look off.
      await page.waitForTimeout(SETTLE_MS);

      // Capture the viewport, not the full page. The preview route is
      // sized to 100vw × 100vh so the viewport IS the preview.
      const buffer = await page.screenshot({
        type: "png",
        fullPage: false,
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });
      await writeFile(outPath, buffer);
      console.log(`    ✓ wrote ${outPath}`);
    } catch (err) {
      // Surface the offending URL so the user can open it in their own
      // browser to see what broke. Don't bail the whole run — the other
      // layouts may still be healthy.
      console.error(
        `    ✗ ${layout.id} failed: ${err instanceof Error ? err.message : err}`
      );
      console.error(`      URL: ${url}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}

console.log("Done.");
