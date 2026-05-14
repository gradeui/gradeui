#!/usr/bin/env node
/**
 * generate-sidecars.mjs
 *
 * Reads every `packages/ui/components/ui/*.md` (sidecars live next to
 * their .tsx source) and emits
 * `src/playbook/components/sidecars.generated.ts` containing the raw
 * markdown as a `Record<string, string>`.
 *
 * Sidecars live in @gradeui/ui because (a) the single-source-of-truth
 * promise — sidecar and component change in the same commit — only
 * holds if they're co-located, and (b) shipping the .md files inside
 * the published @gradeui/ui tarball lets external consumers feed them
 * into their own AI tooling without reaching into @gradeui/studio.
 *
 * Why generated: the playbook has a zero-runtime-dep guarantee — no
 * `fs`, no Node specifics. The frontmatter parser and retrieval logic
 * run against in-memory strings so the package is portable to any
 * environment (edge runtime, MCP server, browser — anywhere).
 *
 * Run this any time you edit or add a `.md` sidecar:
 *
 *   pnpm -F @gradeui/studio generate:sidecars
 *
 * The generated file is committed. `prebuild` wires it in for CI so
 * the generated file always matches the source markdown on the main
 * branch.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIDECARS_DIR = join(__dirname, "..", "..", "ui", "components", "ui");
const OUT_FILE = join(__dirname, "..", "src", "playbook", "components", "sidecars.generated.ts");

const files = readdirSync(SIDECARS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

if (files.length === 0) {
  throw new Error(`[generate-sidecars] no .md files found in ${SIDECARS_DIR}`);
}

const entries = files.map((file) => {
  const raw = readFileSync(join(SIDECARS_DIR, file), "utf-8");
  // Use JSON.stringify for a bulletproof escape of backticks, backslashes,
  // template-literal sigils, and stray trailing newlines. Emitting as a
  // plain string constant keeps the generated file trivially tree-shakable.
  return `  ${JSON.stringify(file)}: ${JSON.stringify(raw)},`;
});

const header = `/* eslint-disable */
// THIS FILE IS GENERATED — do not edit by hand.
// Source: packages/ui/components/ui/*.md
// Regenerate: pnpm -F @gradeui/studio generate:sidecars
//
// Sidecars are inlined as strings so the playbook has zero runtime deps
// on the filesystem. See scripts/generate-sidecars.mjs for the why.

`;

const body = `export const SIDECARS: Readonly<Record<string, string>> = Object.freeze({\n${entries.join("\n")}\n});\n`;

writeFileSync(OUT_FILE, header + body, "utf-8");

console.log(`[generate-sidecars] wrote ${files.length} sidecars → ${OUT_FILE}`);
