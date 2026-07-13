#!/usr/bin/env node
/**
 * harvest-brightlocal-recipes.mjs — BrightLocal's composition RECIPES →
 * registries/brightlocal/recipes/*.jsx (hand-editable, one per recipe).
 *
 * Their DS MCP ships ~29 curated composition patterns via
 * `get_composition_recipe` — page-level patterns (LoginPage,
 * SettingsPage, PageHeader, StatsGrid, EmptyState, FilterBar…) that the
 * Storybook blocks section does NOT cover (blocks are component-family
 * stories: datatable/sidebar/form/inputlist/map only). Each recipe has a
 * description, a component list, keywords, and a model-sized JSX example.
 *
 * Enumeration hack: the server has no list_recipes tool, but asking for
 * a nonexistent recipe returns the full catalogue in `suggestions`.
 *
 * Header convention (parsed by generate-registry-recipes.mjs):
 *   // <Name> — <description>
 *   // keywords: a, b, c
 *   // components: card, button
 *
 * Usage:
 *   cd packages/studio
 *   node scripts/harvest-brightlocal-recipes.mjs
 *   node scripts/generate-registry-recipes.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "registries", "brightlocal", "recipes");
const ENDPOINT = "https://brightlocal-design-system-mcp.vercel.app/api/mcp";

let rpcId = 0;
async function call(name, args) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++rpcId,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const json = await res.json();
  const text = json.result?.content?.find((c) => c.type === "text")?.text;
  return text ? JSON.parse(text) : (json.error ?? null);
}

// PascalCase → kebab-case filename.
const kebab = (s) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").toLowerCase();

mkdirSync(OUT_DIR, { recursive: true });

// Enumerate: a miss returns { error, suggestions: [...] }.
const probe = await call("get_composition_recipe", { name: "__list__" });
const names = probe?.suggestions;
if (!Array.isArray(names) || names.length === 0) {
  console.error("[recipes] could not enumerate recipes:", JSON.stringify(probe)?.slice(0, 200));
  process.exit(1);
}
console.log(`[recipes] catalogue: ${names.length} recipes`);

let written = 0;
for (const name of names) {
  try {
    const r = await call("get_composition_recipe", { name });
    if (!r?.example) {
      console.warn(`[recipes] ${name}: no example — skipped`);
      continue;
    }
    const header = [
      `// ${r.name} — ${String(r.description ?? "").replace(/\s+/g, " ").trim()}`,
      r.keywords?.length ? `// keywords: ${r.keywords.join(", ")}` : null,
      r.components?.length ? `// components: ${r.components.join(", ")}` : null,
      `// Harvested from BrightLocal's DS MCP (get_composition_recipe "${r.name}") —`,
      `// hand-edit freely; re-running the harvester OVERWRITES this file.`,
    ]
      .filter(Boolean)
      .join("\n");
    writeFileSync(join(OUT_DIR, `${kebab(r.name)}.jsx`), `${header}\n\n${r.example.trim()}\n`);
    written++;
    console.log(`[recipes] ${kebab(r.name)}.jsx ✓`);
  } catch (err) {
    console.warn(`[recipes] ${name}: ${err.message}`);
  }
}
console.log(`[recipes] ${written}/${names.length} → registries/brightlocal/recipes/. Now run: node scripts/generate-registry-recipes.mjs`);
