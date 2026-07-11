#!/usr/bin/env node
/**
 * harvest-brightlocal-mcp.mjs
 *
 * Fill the BrightLocal sidecar BODIES from BrightLocal's OWN MCP server
 * (https://brightlocal-design-system-mcp.vercel.app/api/mcp — documented
 * in their Storybook under Getting Started → MCP Server). Their
 * `get_component_api` tool returns canonical per-component description,
 * guidance prose, full prop tables, and examples — authoritative, always
 * current (redeployed on every ui-components release), and exactly the
 * content that makes gradeui's sidecars work (the refs block ships each
 * sidecar body into the generation prompt).
 *
 * Usage (network required; plain node ≥18, no browser):
 *   cd packages/studio
 *   node scripts/harvest-brightlocal-mcp.mjs
 *   pnpm generate:registry-sidecars brightlocal
 *
 * Frontmatter is preserved; only the body below the second `---` fence is
 * replaced. Idempotent — re-run whenever they release.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIDECARS_DIR = join(__dirname, "..", "registries", "brightlocal", "sidecars");
const ENDPOINT = "https://brightlocal-design-system-mcp.vercel.app/api/mcp";
const MAX_BODY_CHARS = 3500; // refs block pays tokens per char — keep tight

let rpcId = 0;
async function call(name, args) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
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

function section(title, content) {
  if (!content) return "";
  const s = typeof content === "string" ? content : JSON.stringify(content, null, 1);
  return `## ${title}\n\n${s.trim()}\n\n`;
}

function renderProps(api) {
  const props = api?.props ?? api?.api?.props;
  if (!props) return "";
  const rows = (Array.isArray(props) ? props : Object.entries(props).map(([k, v]) => ({ name: k, ...v })))
    .map((p) => `- ${p.name}${p.required ? "" : "?"}${p.type ? `: ${p.type}` : ""}${p.default !== undefined ? ` (default ${JSON.stringify(p.default)})` : ""}${p.description ? ` — ${p.description}` : ""}`)
    .join("\n");
  return `## Props (from BrightLocal MCP)\n\n${rows}\n\n`;
}

function renderExamples(api) {
  const ex = api?.examples ?? api?.usage ?? api?.recipes;
  if (!ex) return "";
  const list = Array.isArray(ex) ? ex : [ex];
  return list
    .slice(0, 3)
    .map((e) => {
      const code = typeof e === "string" ? e : e.code ?? e.source ?? JSON.stringify(e, null, 1);
      return "```jsx\n" + String(code).trim() + "\n```\n";
    })
    .join("\n");
}

const files = readdirSync(SIDECARS_DIR).filter((f) => f.endsWith(".md"));
let updated = 0;
for (const file of files) {
  const slug = basename(file, ".md");
  try {
    const api = await call("get_component_api", { name: slug });
    if (!api) throw new Error("empty response");
    const guidance = api.guidance ?? api.component?.guidance;
    const description = api.component?.description ?? api.description;
    let body =
      "\n" +
      (description ? description.trim() + "\n\n" : "") +
      section("Guidance", guidance) +
      renderProps(api) +
      renderExamples(api) +
      `<!-- Harvested from BrightLocal's MCP server (get_component_api "${slug}") — re-run harvest-brightlocal-mcp.mjs to refresh. -->\n`;
    if (body.length > MAX_BODY_CHARS) body = body.slice(0, MAX_BODY_CHARS) + "\n/* …truncated */\n";
    const raw = readFileSync(join(SIDECARS_DIR, file), "utf-8");
    const fenceEnd = raw.indexOf("\n---", 3) + 4;
    writeFileSync(join(SIDECARS_DIR, file), raw.slice(0, fenceEnd) + "\n" + body);
    updated++;
    console.log(`[mcp-harvest] ${file} ✓`);
  } catch (err) {
    console.warn(`[mcp-harvest] ${slug}: ${err.message} — body left as-is`);
  }
}
console.log(`[mcp-harvest] ${updated}/${files.length} sidecars updated. Now run: pnpm -F @gradeui/studio generate:registry-sidecars brightlocal`);
