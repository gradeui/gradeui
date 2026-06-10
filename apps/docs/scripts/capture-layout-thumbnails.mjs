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

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Thumbnails live under public/ so Next serves them at /layout-thumbs/...
const THUMB_DIR = resolve(__dirname, "..", "public", "layout-thumbs");

// Discover layout ids by scanning the scaffolds directory directly
// rather than importing `@gradeui/studio/playbook`. That package's
// `exports` field points at `.ts` sources, and Node can't load those
// without a loader — tsx/ts-node would be a runtime dep for a job that
// only needs filenames.
//
// The contract is simple: each reference layout lives as
// `packages/studio/src/playbook/layouts/scaffolds/<id>.jsx`, and the
// .jsx filename IS the registered id (that's how `requireScaffold(id)`
// and the build-time generator hook up). So a directory read is the
// authoritative list of ids.
const LAYOUTS_DIR = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "packages",
  "studio",
  "src",
  "playbook",
  "layouts"
);
const SCAFFOLDS_DIR = resolve(LAYOUTS_DIR, "scaffolds");
// Playground scaffolds get thumbnails too — the picker's Playground tab
// looks for /layout-thumbs/playground/<id>.png (separate subdir so
// dev-only captures never mix with the shipped curated set; the
// /layout-preview/[id] route resolves playground ids as a fallback).
const PLAYGROUND_DIR = resolve(LAYOUTS_DIR, "scaffolds-playground");

/** @returns {Promise<{ id: string, kind: "curated" | "playground" }[]>} */
async function loadLayoutEntries() {
  /** @type {{ id: string, kind: "curated" | "playground" }[]} */
  const out = [];
  for (const [dir, kind] of [
    [SCAFFOLDS_DIR, "curated"],
    [PLAYGROUND_DIR, "playground"],
  ]) {
    let entries;
    try {
      entries = await readdir(dir);
    } catch (err) {
      // The curated dir is load-bearing; the playground dir is optional.
      if (kind === "curated") {
        console.error(
          `✗ Could not read scaffolds directory at ${dir}: ` +
            (err instanceof Error ? err.message : String(err))
        );
        process.exit(1);
      }
      continue;
    }
    for (const f of entries) {
      if (f.endsWith(".jsx")) out.push({ id: f.replace(/\.jsx$/, ""), kind });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

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

const allEntries = await loadLayoutEntries();
const layoutEntries = ONLY_ID
  ? allEntries.filter((e) => e.id === ONLY_ID)
  : allEntries;

if (layoutEntries.length === 0) {
  if (ONLY_ID) {
    console.error(
      `✗ No layout matches THUMB_LAYOUT_ID=${ONLY_ID}. ` +
        `Known ids: ${allEntries.map((e) => e.id).join(", ")}`
    );
  } else {
    console.error(
      `✗ No .jsx scaffolds found in ${SCAFFOLDS_DIR}. ` +
        `Did the scaffolds directory move?`
    );
  }
  process.exit(1);
}

console.log(
  `Capturing ${layoutEntries.length} thumbnail${layoutEntries.length === 1 ? "" : "s"} ` +
    `from ${BASE_URL} → ${THUMB_DIR}`
);

await mkdir(THUMB_DIR, { recursive: true });
await mkdir(resolve(THUMB_DIR, "playground"), { recursive: true });

const browser = await playwright.chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // Retina-crisp thumbnails; ~2x PNG size but negligible.
  });

  for (const { id: layoutId, kind } of layoutEntries) {
    const url = `${BASE_URL}/layout-preview/${layoutId}?snap=1`;
    const outPath =
      kind === "playground"
        ? resolve(THUMB_DIR, "playground", `${layoutId}.png`)
        : resolve(THUMB_DIR, `${layoutId}.png`);
    console.log(`  • ${layoutId}${kind === "playground" ? " (playground)" : ""} …`);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

      // Step 1: outer page mounted (ReadinessBeacon flipped data-ready).
      await page.waitForSelector(
        `[data-layout-id="${layoutId}"][data-ready="1"]`,
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
        `    ✗ ${layoutId} failed: ${err instanceof Error ? err.message : err}`
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
