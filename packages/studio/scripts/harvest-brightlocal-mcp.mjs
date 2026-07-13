#!/usr/bin/env node
/**
 * harvest-brightlocal-mcp.mjs — type the sidecar FRONTMATTER props from
 * BrightLocal's own MCP server.
 *
 * (https://brightlocal-design-system-mcp.vercel.app/api/mcp — documented
 * in their Storybook under Getting Started → MCP Server.)
 *
 * v1 of this script replaced sidecar BODIES with MCP prose — the bodies
 * are now owned by harvest-brightlocal-stories.mjs (canonical examples,
 * incl. hand-curated blocks), so this script no longer touches them.
 * What the MCP is uniquely good for is the PROPS: `get_component_api`
 * returns fully-typed prop tables (name/type/required/description,
 * deprecations inline) plus `extractedVariants` (real enum values pulled
 * from the cva source). That's exactly the data the frontmatter `props:`
 * block needs — and the contracts generator
 * (generate-brightlocal-contracts.mjs) parses that block, so typed
 * frontmatter flows straight into the Studio settings panel as enum /
 * boolean / string knobs instead of hidden "plumbing" entries.
 *
 * Line grammar emitted (must match parsePropLine in the contracts
 * generator): `name[?][: type][ (a | b)] — description`.
 *
 * Usage (network required; plain node ≥18):
 *   cd packages/studio
 *   node scripts/harvest-brightlocal-mcp.mjs [slug ...]
 *   node scripts/generate-brightlocal-contracts.mjs
 *   node scripts/generate-registry-sidecars.mjs
 *
 * Idempotent; only the frontmatter `props:` block (and `variants:` when
 * the MCP has firmer data) is rewritten. Bodies and every other
 * frontmatter key are preserved byte-for-byte.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIDECARS_DIR = join(__dirname, "..", "registries", "brightlocal", "sidecars");
const ENDPOINT = "https://brightlocal-design-system-mcp.vercel.app/api/mcp";

// Our house line for the QA hook — richer than the MCP's one-liner and
// referenced by BRIGHTLOCAL_EXTRA_RULES; always emitted verbatim.
const DATA_HOOK_LINE =
  '- dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. "settings-save-button")';

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
  if (json.error) throw new Error(json.error.message);
  const text = json.result?.content?.find((c) => c.type === "text")?.text;
  return text ? JSON.parse(text) : null;
}

/** Collapse a prop description to one line; surface deprecations. */
function cleanDescription(raw) {
  if (!raw) return "";
  let d = String(raw).replace(/\s+/g, " ").trim();
  const dep = d.match(/@deprecated\s*(.*)$/i);
  if (dep) {
    const rest = d.slice(0, dep.index).replace(/@default\s+\S+/gi, "").trim();
    return `DEPRECATED: ${dep[1].trim()}${rest ? ` (${rest})` : ""}`;
  }
  // Keep @default — genuinely useful in the panel — but inline it.
  d = d.replace(/@default\s+(\S+)/gi, "(default $1)");
  return d;
}

/** Map an MCP prop to our grammar, using extractedVariants for enums. */
function propLine(p, variantValues) {
  const name = p.name;
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) return null; // parser can't take it
  if (name === "dataHook") return DATA_HOOK_LINE;
  const opt = p.required ? "" : "?";
  const values = variantValues.get(name);
  const desc = cleanDescription(p.description);
  if (values && values.length > 1) {
    return `- ${name}${opt} (${values.join(" | ")})${desc ? ` — ${desc}` : ""}`;
  }
  // Simple scalar types only — anything richer stays untyped and the
  // contracts generator records it as plumbing (conservative on purpose).
  const t = /^(string|number|boolean)$/.test(p.type ?? "") ? `: ${p.type}` : "";
  return `- ${name}${opt}${t}${desc ? ` — ${desc}` : ""}`;
}

const args = process.argv.slice(2);
const files = readdirSync(SIDECARS_DIR)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => args.length === 0 || args.includes(basename(f, ".md")));

let updated = 0;
let skipped = 0;
for (const file of files) {
  const slug = basename(file, ".md");
  try {
    const api = await call("get_component_api", { name: slug });
    const primary = api?.props?.primary;
    if (!Array.isArray(primary) || primary.length === 0) {
      skipped++;
      console.log(`[mcp-props] ${slug}: no typed props from MCP — left as-is`);
      continue;
    }

    // Enum values by prop name, from the cva-extracted variants.
    const variantValues = new Map(
      (api.extractedVariants ?? [])
        .filter((v) => Array.isArray(v.values) && v.values.length > 0)
        .map((v) => [v.name, v.values]),
    );

    const lines = [];
    const seen = new Set();
    for (const p of primary) {
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      const line = propLine(p, variantValues);
      if (line) lines.push(line);
    }
    // Sub-component props (e.g. CardHeader align, CardTitle size) —
    // plain names, only when they don't collide with a root prop.
    for (const sub of api.props?.subComponents ?? []) {
      for (const p of sub.props ?? []) {
        if (seen.has(p.name)) continue;
        seen.add(p.name);
        const line = propLine(
          { ...p, description: `${sub.name}: ${p.description ?? ""}`.trim() },
          variantValues,
        );
        if (line) lines.push(line);
      }
    }
    if (!seen.has("dataHook")) lines.push(DATA_HOOK_LINE);
    if (lines.length === 0) {
      skipped++;
      continue;
    }

    const raw = readFileSync(join(SIDECARS_DIR, file), "utf-8");
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) throw new Error("no frontmatter");
    let fm = fmMatch[1];

    const propsBlock = `props:\n${lines.map((l) => `  ${l}`).join("\n")}`;
    fm = /^props:\n(?:  - .*\n?)*/m.test(fm)
      ? fm.replace(/^props:\n(?:  - .*\n?)*/m, propsBlock + "\n")
      : fm + `\n${propsBlock}`;

    // Firm up `variants:` when the MCP extracted a `variant` axis.
    const vv = variantValues.get("variant");
    if (vv && /^variants:\s*\[[^\]]*\]/m.test(fm)) {
      fm = fm.replace(/^variants:\s*\[[^\]]*\]/m, `variants: [${vv.join(", ")}]`);
    }

    writeFileSync(
      join(SIDECARS_DIR, file),
      raw.replace(/^---\n[\s\S]*?\n---/, `---\n${fm.replace(/\n+$/, "")}\n---`),
    );
    updated++;
    console.log(`[mcp-props] ${slug} ✓ (${lines.length} props)`);
  } catch (err) {
    skipped++;
    console.warn(`[mcp-props] ${slug}: ${err.message} — left as-is`);
  }
}
console.log(
  `[mcp-props] ${updated} updated, ${skipped} skipped. Now run:\n` +
    "  node scripts/generate-brightlocal-contracts.mjs\n" +
    "  node scripts/generate-registry-sidecars.mjs",
);
