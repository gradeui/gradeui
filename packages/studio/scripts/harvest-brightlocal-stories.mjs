#!/usr/bin/env node
/**
 * harvest-brightlocal-stories.mjs
 *
 * Fills the BrightLocal sidecar BODIES with real worked examples harvested
 * from their live Storybook — the same thing that makes gradeui's sidecars
 * good (the refs block ships each sidecar's body: examples + anti-patterns
 * are what teach the model the DS's idioms, not just its API).
 *
 * Usage (run on your machine — needs network + a browser):
 *   cd packages/studio
 *   node scripts/harvest-brightlocal-stories.mjs https://storybook.brightlocal.com
 *
 * Requires playwright (available via apps/docs devDeps; otherwise
 * `npx playwright install chromium` once).
 *
 * What it does:
 *   1. GET <storybook>/index.json → all entries. Keeps `ui-components-*--docs`
 *      pages (their actual id scheme — verified July 2026; the original
 *      `components-*` filter matched NOTHING, which is why the sidecar
 *      bodies stayed example-less).
 *   2. For each, opens <storybook>/iframe.html?id=<id>&viewMode=docs in
 *      headless chromium, expands every "Show code" toggle, and scrapes the
 *      `.docblock-source` code blocks (the canonical story JSX).
 *   3. Maps the docs page to its sidecar (kebab name match against
 *      registries/brightlocal/sidecars/*.md) and REPLACES the sidecar body
 *      below the frontmatter with up to MAX_EXAMPLES fenced jsx blocks
 *      (each capped at MAX_CHARS — the refs block pays tokens per char).
 *   4. Leaves frontmatter untouched. Re-run `pnpm -F @gradeui/studio
 *      generate:registry-sidecars brightlocal` afterwards.
 *
 * Idempotent — safe to re-run when their Storybook updates.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SIDECARS_DIR = join(__dirname, "..", "registries", "brightlocal", "sidecars");

const MAX_EXAMPLES = 3;
const MAX_CHARS = 1200;

const base = (process.argv[2] ?? "https://storybook.brightlocal.com").replace(/\/$/, "");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  try {
    ({ chromium } = require(join(__dirname, "..", "..", "..", "apps", "docs", "node_modules", "playwright")));
  } catch {
    console.error("playwright not found — `pnpm add -D playwright -F @gradeui/studio` or run from a workspace that has it.");
    process.exit(1);
  }
}

const index = await fetch(`${base}/index.json`).then((r) => r.json());
const entries = Object.values(index.entries ?? index.stories ?? {}).filter(
  (e) =>
    e.type === "docs" &&
    /^ui-components-[a-z0-9-]+--docs$/.test(e.id),
);
console.log(`[harvest] ${entries.length} component docs pages`);

const sidecarFiles = readdirSync(SIDECARS_DIR).filter((f) => f.endsWith(".md"));
const sidecarFor = (docId) => {
  // "ui-components-alert-dialog--docs" → "alert-dialog.md". Their ids
  // are not always hyphenated where the sidecar name is
  // ("aspectratio" vs "aspect-ratio.md"), so fall back to a
  // hyphen-insensitive match.
  const slug = docId.replace(/^ui-components-/, "").replace(/--docs$/, "");
  const exact = sidecarFiles.find((f) => f === `${slug}.md`);
  if (exact) return exact;
  const flat = slug.replace(/-/g, "");
  return (
    sidecarFiles.find((f) => f.replace(/\.md$/, "").replace(/-/g, "") === flat) ??
    null
  );
};

const browser = await chromium.launch();
const page = await browser.newPage();
let updated = 0;

for (const entry of entries) {
  const file = sidecarFor(entry.id);
  if (!file) {
    console.warn(`[harvest] no sidecar for ${entry.id} — skipped`);
    continue;
  }
  try {
    console.log(`[harvest] ${entry.id} …`);
    // NOT networkidle — Storybook docs pages hold connections open
    // (HMR ping, telemetry), so networkidle never settles and the run
    // wedges on the first page that keeps a socket alive. DOM-ready +
    // an explicit wait for the docs blocks is what we actually need.
    await page.goto(`${base}/iframe.html?id=${entry.id}&viewMode=docs`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page
      .waitForSelector(".docblock-source, .docblock-code-toggle, .sbdocs", {
        timeout: 8000,
      })
      .catch(() => {});
    // Expand every "Show code" toggle so the source blocks exist in
    // DOM. Tight per-click timeout — a stale/covered toggle must not
    // stall the whole harvest (Playwright's default is 30s per click).
    for (const btn of await page.locator("button:has-text('Show code')").all()) {
      await btn.click({ timeout: 1500 }).catch(() => {});
    }
    await page.waitForTimeout(400);
    const codes = await page
      .locator(".docblock-source code, .docblock-code-toggle + div code, .prismjs")
      .allInnerTexts();
    const examples = [...new Set(codes)]
      .map((c) => c.trim())
      .filter((c) => c.length > 40 && c.includes("<"))
      .slice(0, MAX_EXAMPLES)
      .map((c) => (c.length > MAX_CHARS ? c.slice(0, MAX_CHARS) + "\n/* …truncated */" : c));
    if (!examples.length) {
      console.warn(`[harvest] ${entry.id}: no code blocks found`);
      continue;
    }
    const path = join(SIDECARS_DIR, file);
    const raw = readFileSync(path, "utf-8");
    const fenceEnd = raw.indexOf("\n---", 3) + 4;
    const frontmatter = raw.slice(0, fenceEnd);
    // CURATION-SAFE: hand-authored examples live between the
    // frontmatter and the CURATED_END marker and SURVIVE re-harvests —
    // only the harvested region below is replaced. The card.md rich
    // examples (stat-summary / entity card, reconstructed from the Lab
    // dashboard) are the reason this exists: a re-run must never
    // clobber curation. To curate: put your ```jsx blocks right after
    // the frontmatter and close with the marker line.
    const CURATED_END = "<!-- curated:end — harvested examples below are replaced on re-harvest -->";
    const oldBody = raw.slice(fenceEnd);
    const markerIdx = oldBody.indexOf(CURATED_END);
    const curated =
      markerIdx >= 0
        ? oldBody.slice(0, markerIdx + CURATED_END.length)
        : `\n${CURATED_END}`;
    const body = [
      curated,
      "",
      ...examples.map((c) => "```jsx\n" + c + "\n```"),
      "",
      `<!-- Examples harvested from ${base} (${entry.id}); re-run harvest-brightlocal-stories.mjs to refresh. -->`,
      "",
    ].join("\n");
    writeFileSync(path, frontmatter + body);
    updated++;
    console.log(`[harvest] ${file} ← ${examples.length} example(s)`);
  } catch (err) {
    console.warn(`[harvest] ${entry.id} failed:`, err.message);
  }
}

await browser.close();
console.log(`[harvest] updated ${updated} sidecars — now run: pnpm -F @gradeui/studio generate:registry-sidecars brightlocal`);
