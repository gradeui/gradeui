#!/usr/bin/env node
/**
 * generate-registry-sidecars.mjs
 *
 * The registry-generic sibling of generate-sidecars.mjs: reads
 * `registries/<id>/sidecars/*.md` and emits
 * `src/registry/<id>/sidecars.generated.ts` with the raw markdown inlined
 * as a `Record<string, string>`.
 *
 * gradeui's own sidecars stay where they are (co-located with component
 * source in packages/ui, bundled by generate-sidecars.mjs) — this script
 * is for EXTERNAL design systems whose sidecars have no component source
 * to live next to. Same zero-runtime-dep rationale: the playbook and
 * registry run against in-memory strings everywhere (edge, MCP, browser).
 *
 *   pnpm -F @gradeui/studio generate:registry-sidecars <id>
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const id = process.argv[2];
if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error("usage: generate-registry-sidecars.mjs <registry-id>   (kebab-case)");
  process.exit(1);
}

const SIDECARS_DIR = join(__dirname, "..", "registries", id, "sidecars");
const OUT_DIR = join(__dirname, "..", "src", "registry", id);
const OUT_FILE = join(OUT_DIR, "sidecars.generated.ts");

const allMd = readdirSync(SIDECARS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

// Same zombie-file guard as generate-sidecars.mjs.
const fileEntries = allMd
  .map((file) => ({ file, raw: readFileSync(join(SIDECARS_DIR, file), "utf-8") }))
  .filter(({ raw }) => raw.trim().length > 0);

if (fileEntries.length === 0) {
  throw new Error(`[generate-registry-sidecars] no non-empty .md files found in ${SIDECARS_DIR}`);
}

const entries = fileEntries.map(
  ({ file, raw }) => `  ${JSON.stringify(file)}: ${JSON.stringify(raw)},`,
);

const constName = `${id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (_, c) => c.toUpperCase())}`;

const out = `/* eslint-disable */
// THIS FILE IS GENERATED — do not edit by hand.
// Source: packages/studio/registries/${id}/sidecars/*.md
// Regenerate: pnpm -F @gradeui/studio generate:registry-sidecars ${id}

export const ${constName.toUpperCase()}_SIDECARS: Readonly<Record<string, string>> = Object.freeze({
${entries.join("\n")}
});
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, out);
console.log(
  `[generate-registry-sidecars] ${fileEntries.length} sidecars → src/registry/${id}/sidecars.generated.ts`,
);
