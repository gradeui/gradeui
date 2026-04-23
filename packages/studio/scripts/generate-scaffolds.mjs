#!/usr/bin/env node
/**
 * generate-scaffolds.mjs
 *
 * Reads every `src/playbook/layouts/scaffolds/*.jsx` and emits
 * `src/playbook/layouts/scaffolds.generated.ts` containing the raw JSX
 * source as a `Record<string, string>` keyed by the filename (without
 * extension).
 *
 * Why: the playbook has a zero-runtime-dep guarantee — no `fs`, no Node
 * specifics. Authoring each reference layout as a real `.jsx` file
 * (instead of a template literal inside TS) gives us syntax highlighting,
 * no backtick/sigil escaping, and one file per scaffold so edits don't
 * hit a 900-line god file.
 *
 * Filename → id convention: `ecommerce-listing.jsx` → `"ecommerce-listing"`.
 * The `ReferenceLayout` registry in `layouts/index.ts` looks up the
 * scaffold source by that same id.
 *
 * Run this any time you add or edit a `.jsx` scaffold:
 *
 *   pnpm -F @gradeui/studio generate:scaffolds
 *
 * The generated file is committed. `prebuild` wires it in for CI so
 * the generated file always matches the `.jsx` sources on main.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLDS_DIR = join(__dirname, "..", "src", "playbook", "layouts", "scaffolds");
const OUT_FILE = join(__dirname, "..", "src", "playbook", "layouts", "scaffolds.generated.ts");

const files = readdirSync(SCAFFOLDS_DIR)
  .filter((f) => f.endsWith(".jsx"))
  .sort();

if (files.length === 0) {
  throw new Error(`[generate-scaffolds] no .jsx files found in ${SCAFFOLDS_DIR}`);
}

const entries = files.map((file) => {
  const raw = readFileSync(join(SCAFFOLDS_DIR, file), "utf-8");
  const id = file.replace(/\.jsx$/, "");
  // JSON.stringify handles backslashes, embedded quotes, and newlines.
  // We want the playbook to see the JSX source verbatim — Sandpack (and
  // the system prompt) will treat it as plain text.
  return `  ${JSON.stringify(id)}: ${JSON.stringify(raw)},`;
});

const header = `/* eslint-disable */
// THIS FILE IS GENERATED — do not edit by hand.
// Source: packages/studio/src/playbook/layouts/scaffolds/*.jsx
// Regenerate: pnpm -F @gradeui/studio generate:scaffolds
//
// Scaffolds are inlined as strings so the playbook has zero runtime deps
// on the filesystem. See scripts/generate-scaffolds.mjs for the why.

`;

const body = `export const SCAFFOLDS: Readonly<Record<string, string>> = Object.freeze({\n${entries.join("\n")}\n});\n`;

writeFileSync(OUT_FILE, header + body, "utf-8");

console.log(`[generate-scaffolds] wrote ${files.length} scaffolds → ${OUT_FILE}`);
