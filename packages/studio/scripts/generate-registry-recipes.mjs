#!/usr/bin/env node
/**
 * generate-registry-recipes.mjs — registries/<id>/recipes/*.jsx →
 * src/registry/<id>/recipes.generated.ts (RegistryBlock[] with
 * group "Recipes").
 *
 * Recipes ride the BLOCKS slot: the Blocks browser already groups by
 * `block.group` and renders plain-JSX sources (non-story sources get
 * the padded-div wrap + DS-import census + stubs), so a recipe is just
 * a block whose group is "Recipes" and whose description tells a human
 * what the pattern is for. Header grammar (from the harvester):
 *   // <Name> — <description>
 *   // keywords: a, b, c        (kept in source for future retrieval)
 *   // components: card, button
 *
 *   node scripts/generate-registry-recipes.mjs [registry-id=brightlocal]
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

// sucrase rides in apps/docs devDeps (pnpm strict layout) — same
// fallback as the blocks generator.
const requireLocal = createRequire(import.meta.url);
let transform;
try {
  ({ transform } = requireLocal("sucrase"));
} catch {
  ({ transform } = requireLocal(
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "apps", "docs", "node_modules", "sucrase"),
  ));
}

/**
 * Recipe free-identifier audit — the recipes-shaped sibling of the
 * blocks generator's detectFreeIds. Recipes are module-shaped docs
 * (imports + prelude + JSX [+ trailing snippets]); replicate the
 * preview build (strip imports, prelude/first-tree split, brace-aware)
 * and execute in a proxy sandbox that records identifiers the source
 * references but doesn't define. The Blocks preview shims those
 * (hooks → () => ({}), handlers → noop, data → []) and badges the card.
 */
function detectRecipeFreeIds(source) {
  const cleaned = source
    .replace(/^(?:\/\/[^\n]*\n)+/, "")
    .replace(/\{\/\*[^*]*?\*\/\}/g, "<div />")
    .replace(/^import\b[\s\S]*?["'][^"'\n]+["'];?[ \t]*$/gm, "")
    .trim();
  const lines = cleaned.split("\n");
  let braceDepth = 0;
  let jsxStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (braceDepth === 0 && /^</.test(t) && !/^<\//.test(t)) { jsxStart = i; break; }
    braceDepth += (lines[i].match(/\{/g) ?? []).length - (lines[i].match(/\}/g) ?? []).length;
  }
  let body;
  if (jsxStart < 0) {
    const def = cleaned.match(/^(?:export\s+)?function\s+([A-Z]\w*)/m) ??
      cleaned.match(/^const\s+([A-Z]\w*)\s*=/m);
    if (!def) return [];
    body = `module.exports.default = function BlockPreview() {\n${cleaned}\n  return <${def[1]} dataHook="preview" />;\n}`;
  } else {
    const prelude = lines.slice(0, jsxStart).join("\n").trim();
    let depth = 0, end = lines.length - 1;
    for (let i = jsxStart; i < lines.length; i++) {
      const l = lines[i];
      depth += (l.match(/<[A-Za-z]/g) ?? []).length - (l.match(/<\//g) ?? []).length - (l.match(/\/>/g) ?? []).length;
      if (depth <= 0) { end = i; break; }
    }
    body = `module.exports.default = function BlockPreview() {\n${prelude}\n  return (<div>\n${lines.slice(jsxStart, end + 1).join("\n")}\n</div>);\n}`;
  }
  const tags = new Set([...source.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]));
  const mod = [
    "const fn=()=>()=>{};",
    [...tags].map((t) => `const ${t} = (p)=>p?.children??null;`).join("\n"),
    body,
  ].join("\n");
  let js;
  try {
    js = transform(mod, { transforms: ["typescript", "jsx", "imports"], production: true }).code;
  } catch {
    return []; // parse failures surface in the preview's error strip
  }
  const ReactStub = {
    createElement: (t, p, ...k) => (typeof t === "function" ? t({ ...(p ?? {}), children: k }) : { t }),
    Fragment: "f",
    useState: (i) => [i, () => {}], useRef: () => ({ current: null }), useMemo: (f) => f(),
    useCallback: (f) => f, useEffect: () => {}, useLayoutEffect: () => {}, useContext: () => ({}),
    forwardRef: (f) => f, createContext: () => ({ Provider: (p) => p.children }),
  };
  const missing = new Set();
  const base = { module: { exports: {} }, exports: {}, console, setTimeout, clearTimeout, React: ReactStub };
  const sandbox = new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === Symbol.unscopables) return undefined;
      if (typeof k === "string" && /^[A-Za-z_$]/.test(k) && k !== "undefined") missing.add(k);
      const p = new Proxy(function () {}, { get: () => p, apply: () => p, construct: () => p });
      return p;
    },
    has: () => true,
  });
  try {
    vm.runInNewContext(`with (sandbox) { ${js} }\nsandbox.module.exports.default({});`, { sandbox }, { timeout: 2000 });
  } catch {
    /* runtime errors surface in the preview; ids seen so far still help */
  }
  return [...missing].sort();
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2] ?? "brightlocal";
if (!/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error("usage: generate-registry-recipes.mjs <registry-id>");
  process.exit(1);
}
const RECIPES_DIR = join(__dirname, "..", "registries", id, "recipes");
const OUT_FILE = join(__dirname, "..", "src", "registry", id, "recipes.generated.ts");

if (!existsSync(RECIPES_DIR)) {
  console.error(`no recipes dir: registries/${id}/recipes`);
  process.exit(1);
}

const recipes = [];
for (const f of readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".jsx")).sort()) {
  const raw = readFileSync(join(RECIPES_DIR, f), "utf-8");
  const firstLine = (raw.split("\n")[0] ?? "").replace(/^\/\/\s*/, "");
  const [name, description] = firstLine.split("—").map((s) => s.trim());
  const freeIds = detectRecipeFreeIds(raw.trim());
  recipes.push({
    id: `recipe-${f.replace(/\.jsx$/, "")}`,
    group: "Recipes",
    name: name || f.replace(/\.jsx$/, ""),
    description: description || undefined,
    // Full file incl. header comments — provenance + keywords stay
    // visible in the code view (and greppable for future retrieval).
    source: raw.trim(),
    ...(freeIds.length ? { freeIds } : {}),
  });
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
// Record keyed by id — same shape as blocks.generated.ts, so the
// registry can spread the two into one `blocks` map.
const record = Object.fromEntries(recipes.map((r) => [r.id, r]));
writeFileSync(
  OUT_FILE,
  `// AUTO-GENERATED by scripts/generate-registry-recipes.mjs from
// registries/${id}/recipes/*.jsx — the .jsx files are the authoring
// home (hand-editable); do not hand-edit this file.
import type { RegistryBlock } from "../types";

export const ${id.toUpperCase().replace(/-/g, "_")}_RECIPES: Readonly<
  Record<string, RegistryBlock>
> = ${JSON.stringify(record, null, 2)} as const;
`,
);
console.log(`[recipes] ${recipes.length} recipe(s) → src/registry/${id}/recipes.generated.ts`);
