#!/usr/bin/env node
/**
 * generate-sidecars.mjs
 *
 * Reads every `src/playbook/sidecars/*.md` and emits
 * `src/playbook/components/sidecars.generated.ts` containing the raw
 * markdown as a `Record<string, string>`.
 *
 * Why: the playbook has a zero-runtime-dep guarantee — no `fs`, no Node
 * specifics. The frontmatter parser and retrieval logic run against
 * in-memory strings so the package is portable to any environment
 * (edge runtime, MCP server, browser — anywhere).
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
const SIDECARS_DIR = join(__dirname, "..", "src", "playbook", "sidecars");
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
// Source: packages/studio/src/playbook/sidecars/*.md
// Regenerate: pnpm -F @gradeui/studio generate:sidecars
//
// Sidecars are inlined as strings so the playbook has zero runtime deps
// on the filesystem. See scripts/generate-sidecars.mjs for the why.

`;

const body = `export const SIDECARS: Readonly<Record<string, string>> = Object.freeze({\n${entries.join("\n")}\n});\n`;

writeFileSync(OUT_FILE, header + body, "utf-8");

console.log(`[generate-sidecars] wrote ${files.length} sidecars → ${OUT_FILE}`);
