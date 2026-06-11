#!/usr/bin/env node
/**
 * capture-probe — bisect the 2026-06-11 black-poster bug.
 *
 * Drives the SAME headless Chromium the MCP capture uses at any embed
 * URL and reports what actually happened inside: did the DOM hydrate
 * (innerHTML), is there visible text (innerText — layout-aware, so
 * "DOM present but innerText empty" means CONTENT IS HIDDEN, not
 * missing), what did the console say, and a PNG to eyeball.
 *
 * Run from the repo root (resolves playwright from apps/mcp-server):
 *   node scripts/capture-probe.mjs http://localhost:3000/e/<token>?w=1280&motion=off
 *   node scripts/capture-probe.mjs https://gradeui.com/e/<token>?w=1280&motion=off
 *
 * localhost fails + production works  → dev-server-vs-headless issue,
 *   flip GRADE_SITE_URL back to production for captures.
 * Both fail → the capture toolchain itself (chromium version?).
 * Both work → the MCP server env differs from this shell; compare env.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(
  path.join(repoRoot, "apps", "mcp-server", "package.json"),
);
const { chromium } = require("playwright");

const url = process.argv[2];
if (!url) {
  console.error(
    "usage: node scripts/capture-probe.mjs <embed-url> [shell|full|headed]\n" +
      "  shell  — headless shell binary (what the MCP capture uses today)\n" +
      "  full   — full Chromium, new headless mode (channel: 'chromium')\n" +
      "  headed — visible window (ground truth)",
  );
  process.exit(2);
}
const flavor = process.argv[3] ?? "shell";

const t0 = Date.now();
const mark = (s) => console.log(`[${String(Date.now() - t0).padStart(5)}ms] ${s}`);

// Playwright's `headless: true` runs the STRIPPED "chromium headless
// shell", not full Chrome — a different binary with its own bugs. The
// 2026-06-11 finding: React never mounts in it (no errors, no content),
// while real Chrome is fine. `channel: "chromium"` forces the FULL
// browser in its native headless mode instead.
const browser = await chromium.launch(
  flavor === "headed"
    ? { headless: false }
    : flavor === "full"
      ? { headless: true, channel: "chromium" }
      : { headless: true },
);
mark(`chromium launched [${flavor}] (${browser.version()})`);
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  colorScheme: "dark",
});
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
// ALL console types — dev runtimes log their complaints at info/log
// level, and the localhost no-mount bug produces zero errors.
page.on("console", (m) =>
  errors.push(`console.${m.type()}: ${m.text().slice(0, 200)}`),
);
page.on("requestfailed", (r) =>
  errors.push(`requestfailed: ${r.failure()?.errorText} ${r.url().slice(0, 100)}`),
);

await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
mark("networkidle");

for (const at of [2, 5, 10, 20]) {
  await page.waitForTimeout(
    at * 1000 - (Date.now() - t0) > 0 ? at * 1000 - (Date.now() - t0) : 0,
  );
  const probe = await page.evaluate(() => {
    // Same recursive predicate as screenshotEmbed: text counts wherever
    // it lives, including inside same-origin iframes (the /e/ page's
    // screen renders in the FastIframeHost iframe).
    const textIn = (doc) => {
      let n = (doc.body?.innerText ?? "").trim().length;
      for (const f of doc.querySelectorAll("iframe")) {
        try {
          const inner = f.contentDocument;
          if (inner) n += textIn(inner);
        } catch { /* cross-origin */ }
      }
      return n;
    };
    const iframes = [];
    for (const f of document.querySelectorAll("iframe")) {
      try {
        const d = f.contentDocument;
        iframes.push(d ? `h:${d.body?.scrollHeight ?? 0},text:${(d.body?.innerText ?? "").trim().length}` : "x-origin");
      } catch { iframes.push("x-origin"); }
    }
    return {
      deepText: textIn(document),
      outerHtml: document.body.innerHTML.length,
      iframes: iframes.join(" | ") || "none",
      bg: getComputedStyle(document.body).backgroundColor,
    };
  });
  mark(`t+${at}s  deepText:${probe.deepText}  outerHTML:${probe.outerHtml}  iframes:[${probe.iframes}]  body.bg:${probe.bg}`);
  if (probe.deepText > 0) break;
}

// ── WHO is hiding the content? ──────────────────────────────────────
// The 2026-06-11 signature is "DOM present, innerText 0" — content
// rendered but invisible. Find a text node we KNOW the screen renders,
// then climb to the root reporting every ancestor's hiding-relevant
// computed styles. The culprit announces itself.
const chain = await page.evaluate(() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textEl = null;
  while (walker.nextNode()) {
    const t = walker.currentNode.textContent?.trim() ?? "";
    if (t.length > 3) { textEl = walker.currentNode.parentElement; break; }
  }
  if (!textEl) return ["NO TEXT NODES AT ALL in body"];
  const rows = [];
  for (let el = textEl; el; el = el.parentElement) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const suspicious =
      cs.display === "none" || cs.visibility !== "visible" ||
      parseFloat(cs.opacity) === 0 || r.width === 0 || r.height === 0 ||
      (cs.transform !== "none" && cs.transform.includes("matrix(0"));
    rows.push(
      `${suspicious ? ">>> " : "    "}<${el.tagName.toLowerCase()}> ` +
      `${String(el.className).slice(0, 60)} | ` +
      `display:${cs.display} vis:${cs.visibility} opacity:${cs.opacity} ` +
      `size:${Math.round(r.width)}x${Math.round(r.height)} ` +
      `transform:${cs.transform === "none" ? "none" : cs.transform.slice(0, 40)} ` +
      `clip:${cs.clipPath !== "none" ? cs.clipPath.slice(0, 20) : "-"} ` +
      `filter:${cs.filter !== "none" ? cs.filter.slice(0, 20) : "-"}`,
    );
  }
  return rows;
});
console.log("\nancestor chain from first text node (>>> = hiding here):");
chain.forEach((r) => console.log(r));

// ── Runtime vitals — is the page's event/frame machinery alive? ─────
// The localhost-dev no-mount bug has no errors; if rAF doesn't tick or
// timers stall, anything deferring hydration onto them waits forever.
const vitals = await page.evaluate(async () => {
  const rafTicks = await new Promise((resolve) => {
    let n = 0;
    const t0 = performance.now();
    const stop = setTimeout(() => resolve(`${n} ticks in 1000ms (TIMER fired)`), 1000);
    requestAnimationFrame(function f() {
      if (++n >= 5) {
        clearTimeout(stop);
        resolve(`5 ticks in ${Math.round(performance.now() - t0)}ms`);
      } else requestAnimationFrame(f);
    });
  });
  const ric = await new Promise((resolve) => {
    const stop = setTimeout(() => resolve("NEVER (1s)"), 1000);
    (window.requestIdleCallback ?? ((cb) => cb()))(() => {
      clearTimeout(stop);
      resolve("fired");
    });
  });
  return {
    rafTicks,
    requestIdleCallback: ric,
    visibility: document.visibilityState,
    hasFocus: document.hasFocus(),
    nextFlight: typeof window.__next_f !== "undefined"
      ? `present (${window.__next_f.length} chunks)`
      : "absent",
    scripts: document.scripts.length,
    fontsStatus: document.fonts?.status ?? "?",
  };
});
console.log("\nruntime vitals:", JSON.stringify(vitals, null, 2));

const out = path.join(repoRoot, "capture-probe.png");
await page.screenshot({ path: out, type: "png" });
mark(`screenshot → ${out}`);
if (errors.length) {
  console.log("\npage errors/warnings (deduped):");
  [...new Set(errors)].slice(0, 15).forEach((e) => console.log("  " + e));
} else {
  console.log("\nno page errors or warnings at all.");
}
await browser.close();
