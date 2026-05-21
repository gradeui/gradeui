#!/usr/bin/env node
/**
 * generate-scaffolds-playground.mjs
 *
 * Reads every `src/playbook/layouts/scaffolds-playground/*.jsx` and emits
 * `src/playbook/layouts/scaffolds-playground.generated.ts` containing
 * each scaffold's metadata + raw source, keyed by filename (sans `.jsx`).
 *
 * Companion to `generate-scaffolds.mjs` — same shape, different folder,
 * different output, different downstream consumer (the picker's
 * Playground tab vs the model's REFERENCE_LAYOUTS).
 *
 * Unlike the curated scaffolds (which are listed in a central
 * `REFERENCE_LAYOUTS` array), playground scaffolds are self-describing.
 * Each file carries a JSDoc frontmatter block at the top that this
 * script parses:
 *
 *   @label        Required. Short name shown on the picker card.
 *   @description  Optional. One-liner under the label.
 *   @tags         Optional. Space-separated soft-match tokens.
 *   @source       Optional. URL or filename the scaffold was generated from
 *                 (e.g. the screenshot). Surfaced as a link on the card.
 *   @notes        Optional. Free-text. Shown when the card is expanded.
 *
 * The bundle is committed (matches the curated-scaffold workflow) so
 * dev/CI doesn't need a build step before the page renders.
 *
 * Run after adding or editing a `.jsx` in scaffolds-playground/:
 *
 *   pnpm -F @gradeui/studio gen:scaffolds-playground
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCAFFOLDS_DIR = join(__dirname, "..", "src", "playbook", "layouts", "scaffolds-playground");
const OUT_FILE = join(__dirname, "..", "src", "playbook", "layouts", "scaffolds-playground.generated.ts");

mkdirSync(dirname(OUT_FILE), { recursive: true });

let files = [];
try {
  files = readdirSync(SCAFFOLDS_DIR)
    .filter((f) => f.endsWith(".jsx"))
    .sort();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
  files = [];
}

/**
 * Pull a single `@tag value` line out of a JSDoc block. Multi-line
 * values are joined on whitespace until the next `@tag` or block end.
 */
function readTag(block, name) {
  const re = new RegExp(`@${name}\\s+([\\s\\S]*?)(?=\\n\\s*\\*\\s*@\\w+|\\n\\s*\\*\\/)`, "i");
  const match = block.match(re);
  if (!match) return null;
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function readFrontmatter(raw) {
  const stripped = raw.replace(/^﻿/, "").trimStart();
  const match = stripped.match(/^\/\*\*([\s\S]*?)\*\//);
  if (!match) return null;
  return match[0];
}

const entries = files.map((file) => {
  const raw = readFileSync(join(SCAFFOLDS_DIR, file), "utf-8");
  const id = file.replace(/\.jsx$/, "");
  const block = readFrontmatter(raw);

  const label = (block && readTag(block, "label")) || id;
  const description = (block && readTag(block, "description")) || "";
  const tagsRaw = (block && readTag(block, "tags")) || "";
  const tags = tagsRaw.split(/\s+/).filter(Boolean);
  const source = (block && readTag(block, "source")) || "";
  const notes = (block && readTag(block, "notes")) || "";

  return {
    id, label, description, tags, source, notes, raw,
  };
});

const body = entries
  .map((e) => {
    return `  ${JSON.stringify(e.id)}: {\n` +
      `    id: ${JSON.stringify(e.id)},\n` +
      `    label: ${JSON.stringify(e.label)},\n` +
      `    description: ${JSON.stringify(e.description)},\n` +
      `    tags: ${JSON.stringify(e.tags)},\n` +
      `    source: ${JSON.stringify(e.source)},\n` +
      `    notes: ${JSON.stringify(e.notes)},\n` +
      `    scaffold: ${JSON.stringify(e.raw)},\n` +
      `  },`;
  })
  .join("\n");

const header = `/* eslint-disable */
// THIS FILE IS GENERATED — do not edit by hand.
// Source: packages/studio/src/playbook/layouts/scaffolds-playground/*.jsx
// Regenerate: pnpm -F @gradeui/studio gen:scaffolds-playground
//
// Playground scaffolds are the dev-only "Playground" tab in Studio's
// starter picker. They live alongside the curated scaffolds folder
// but are exposed via a SEPARATE export — PLAYGROUND_SCAFFOLDS, not
// REFERENCE_LAYOUTS — so the model's retrieval / system prompt never
// see them. Tree-shaken away unless explicitly imported by a consumer
// (which today is only the StarterPicker's Playground tab).

`;

const interfaceDecl = `export interface PlaygroundScaffold {
  id: string;
  label: string;
  description: string;
  tags: string[];
  source: string;
  notes: string;
  scaffold: string;
}
`;

const out = `${header}${interfaceDecl}\nexport const PLAYGROUND_SCAFFOLDS: Readonly<Record<string, PlaygroundScaffold>> = Object.freeze({\n${body}\n});\n`;

writeFileSync(OUT_FILE, out, "utf-8");

console.log(`[generate-scaffolds-playground] wrote ${entries.length} scaffold(s) → ${OUT_FILE}`);
