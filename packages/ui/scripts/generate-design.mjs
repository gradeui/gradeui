#!/usr/bin/env node
/**
 * generate-design.mjs
 *
 * Assembles ONE comprehensive, agent-facing design document — `DESIGN.md` —
 * from the package's own single-source-of-truth markdown:
 *
 *   1. foundations/_intro.md      → what Grade is + the non-negotiable scaffold rule
 *   2. foundations/*.md           → the RULES that aren't components
 *                                   (themes, colour scopes, expressive, typography, spacing)
 *   3. components/ui/*.md         → every component sidecar (when_to_use, props, examples)
 *
 * Because it is GENERATED from the same sidecars the components ship, it can
 * never drift from the code: edit a sidecar, regenerate, and DESIGN.md is
 * current. It ships in the npm tarball so ANY consumer (any agent, any dev —
 * not just Grade Studio) gets the full design system context from the installed
 * package alone. This is the portability contract: the package self-describes.
 *
 *   pnpm -F @gradeui/ui generate:design
 *
 * Wired into `prebuild` so CI keeps it in sync on main.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const FOUNDATIONS_DIR = join(PKG_ROOT, "foundations");
const SIDECARS_DIR = join(PKG_ROOT, "components", "ui");
const OUT_FILE = join(PKG_ROOT, "DESIGN.md");
const INDEX_FILE = join(PKG_ROOT, "DESIGN.index.md");

// Pull `name:` and the first sentence of `when_to_use:` from a sidecar's
// YAML-ish frontmatter for the cheap scan index.
function summarise(raw, fallbackName) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  const block = fm ? fm[1] : "";
  const name = (block.match(/^name:\s*(.+)$/m)?.[1] || fallbackName).trim();
  let use = block.match(/^when_to_use:\s*([\s\S]*?)(?:\n[a-z_]+:|$)/m)?.[1] || "";
  use = use.replace(/\s+/g, " ").trim();
  const firstSentence = use.split(/(?<=\.)\s/)[0] || use;
  return { name, summary: firstSentence.slice(0, 160) };
}

// Foundations render in a deliberate reading order; the rest fall in alpha after.
const FOUNDATION_ORDER = [
  "themes.md",
  "color-scopes.md",
  "expressive.md",
  "typography.md",
  "spacing-layout.md",
];

const read = (dir, file) => readFileSync(join(dir, file), "utf-8").trim();
const nonEmpty = (dir, file) => read(dir, file).length > 0;

// 1. Intro (header + scaffold rule)
const intro = read(FOUNDATIONS_DIR, "_intro.md");

// 2. Foundations — ordered list first, then any others alphabetically.
const allFoundations = readdirSync(FOUNDATIONS_DIR)
  .filter((f) => f.endsWith(".md") && f !== "_intro.md")
  .filter((f) => nonEmpty(FOUNDATIONS_DIR, f));
const orderedFoundations = [
  ...FOUNDATION_ORDER.filter((f) => allFoundations.includes(f)),
  ...allFoundations.filter((f) => !FOUNDATION_ORDER.includes(f)).sort(),
];

// 3. Component sidecars — every non-empty .md, alphabetical.
const sidecars = readdirSync(SIDECARS_DIR)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => nonEmpty(SIDECARS_DIR, f))
  .sort();

const banner =
  `<!-- GENERATED FILE — do not edit by hand.\n` +
  `     Source: foundations/*.md + components/ui/*.md\n` +
  `     Regenerate: pnpm -F @gradeui/ui generate:design -->\n`;

const parts = [banner, intro];

parts.push(`\n\n---\n\n# Foundations\n\nThe rules that aren't components.`);
for (const f of orderedFoundations) {
  parts.push(`\n\n---\n\n${read(FOUNDATIONS_DIR, f)}`);
}

parts.push(
  `\n\n---\n\n# Components\n\n${sidecars.length} components. Each sidecar carries ` +
    `\`when_to_use\`, \`props\`, \`composes_with\`, and worked examples. Programmatic ` +
    `prop schemas are also importable from \`@gradeui/ui/contracts\`.`
);
for (const f of sidecars) {
  parts.push(`\n\n---\n\n${read(SIDECARS_DIR, f)}`);
}

writeFileSync(OUT_FILE, parts.join("") + "\n", "utf-8");

// --- Cheap scan index: one line per component so an agent can pick what it
// needs and pull only that sidecar, instead of loading all of DESIGN.md. ---
const indexRows = sidecars.map((f) => {
  const { name, summary } = summarise(read(SIDECARS_DIR, f), f.replace(/\.md$/, ""));
  return `| \`${name}\` | ${summary} |`;
});
const index = [
  `<!-- GENERATED — pnpm -F @gradeui/ui generate:design -->`,
  `# Grade component index`,
  ``,
  `A cheap scan of all ${sidecars.length} components. Read the foundations + this`,
  `index first; then pull only the sidecars you need from \`components/ui/<name>.md\``,
  `(or the full \`@gradeui/ui/DESIGN.md\`). Foundations: ${orderedFoundations
    .map((f) => f.replace(/\.md$/, ""))
    .join(", ")}.`,
  ``,
  `| component | when to use |`,
  `| --- | --- |`,
  ...indexRows,
  ``,
].join("\n");
writeFileSync(INDEX_FILE, index, "utf-8");

console.log(
  `[generate-design] wrote DESIGN.md (${(Buffer.byteLength(parts.join("")) / 1024).toFixed(
    0
  )}KB) + DESIGN.index.md — ${orderedFoundations.length} foundations + ${sidecars.length} components`
);
