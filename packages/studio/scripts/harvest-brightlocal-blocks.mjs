#!/usr/bin/env node
/**
 * harvest-brightlocal-blocks.mjs
 *
 * Pulls the `blocks-*` stories — their COMPOSED PATTERNS (DataTable,
 * Form/SplitLayout login, the whole Map state family) — out of the live
 * Storybook and into registries/brightlocal/blocks/*.jsx.
 *
 * Why this exists: the blocks (and lab) sections are HIDDEN from
 * index.json (docs-only tags), so the sidecar harvest never sees them —
 * but the preview runtime's story store carries
 * `parameters.docs.source.originalSource` for every story, and for the
 * blocks section that source is real, readable JSX (unlike lab, whose
 * source was minified at build time — "<ta/>"). 41/42 blocks stories
 * are recoverable this way.
 *
 * Limits (client-findings material): story-file-LOCAL helper components
 * (LoginFormComponent, MarketingContentComponent in blocks-form) exist
 * only in their repo — the harvested source references them but can't
 * include them. Ask BrightLocal for the blocks story source, or
 * reconstruct from the rendered DOM (their data-slot marks make that
 * tractable — see the card.md stat-summary example for the technique).
 *
 * Usage (your machine — needs network + playwright chromium):
 *   cd packages/studio
 *   node scripts/harvest-brightlocal-blocks.mjs https://storybook.brightlocal.com
 *
 * Output: registries/brightlocal/blocks/<story-id>.jsx with a header
 * comment (title / story name / source url). Idempotent. These are the
 * seed data for the Studio "Blocks" area (per-registry pattern library:
 * browsable grid, insertable as starters, fed to the agent as
 * composition examples).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "registries", "brightlocal", "blocks");

const base = (process.argv[2] ?? "https://storybook.brightlocal.com").replace(/\/$/, "");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  try {
    // pnpm's strict layout hides apps/docs' devDeps from this package —
    // reach into its node_modules directly (same fallback as the
    // stories harvester).
    ({ chromium } = require(
      join(__dirname, "..", "..", "..", "apps", "docs", "node_modules", "playwright"),
    ));
  } catch (err) {
    console.error(
      "playwright not found — install it where npx can see it:\n" +
        "  cd ../../apps/docs && npx playwright install chromium\n" +
        `(resolution error: ${err instanceof Error ? err.message : err})`,
    );
    process.exit(1);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
// Any docs page boots the preview runtime + full story store.
await page.goto(`${base}/iframe.html?id=ui-components-button--docs&viewMode=docs`, {
  waitUntil: "domcontentloaded",
  timeout: 20000,
});
await page.waitForFunction(() => Boolean(window.__STORYBOOK_PREVIEW__), null, {
  timeout: 15000,
});

const blocks = await page.evaluate(async () => {
  const store = await window.__STORYBOOK_PREVIEW__.extract();
  const out = [];
  for (const [id, s] of Object.entries(store)) {
    if (!id.startsWith("blocks-")) continue;
    const src = s?.parameters?.docs?.source?.originalSource ?? "";
    out.push({ id, title: s.title, name: s.name, src });
  }
  return out;
});
await browser.close();

mkdirSync(OUT_DIR, { recursive: true });
let written = 0;
for (const b of blocks) {
  if (!b.src || b.src.length < 40) {
    console.warn(`[blocks] ${b.id}: no usable source — skipped`);
    continue;
  }
  // Minified/mangled story source (the lab failure mode) — flag, keep
  // anyway for reference, a human can DOM-reconstruct.
  const mangled = /=>\s*<[a-z]{1,2}\s*\/>/.test(b.src);
  const header = [
    `// ${b.title} — ${b.name}`,
    `// Harvested from ${base}/?path=/story/${b.id}`,
    `// (parameters.docs.source.originalSource — story-file-local helper`,
    `// components are NOT included; they live in BrightLocal's repo.)`,
    mangled ? "// WARNING: source looks minified — reconstruct from rendered DOM." : "",
    "",
  ]
    .filter(Boolean)
    .join("\n");
  writeFileSync(join(OUT_DIR, `${b.id}.jsx`), header + b.src + "\n");
  written++;
}
console.log(`[blocks] wrote ${written}/${blocks.length} → registries/brightlocal/blocks/`);
