#!/usr/bin/env node
/**
 * generate-registry-blocks.mjs — registries/<id>/blocks/*.jsx →
 * src/registry/<id>/blocks.generated.ts (the serialisable blocks map
 * the Studio Blocks area browses).
 *
 * Block files come from harvest-brightlocal-blocks.mjs: a header
 * comment (title — story name / source url / provenance caveats)
 * followed by the story's originalSource. This transform keeps the
 * SOURCE verbatim (CSF story object or bare JSX — the browser's
 * renderer normalises at display time) and lifts title/name from the
 * header.
 *
 *   node scripts/generate-registry-blocks.mjs [registry-id=brightlocal]
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// sucrase rides in apps/docs' devDeps (pnpm strict layout) — same
// fallback the harvesters use.
let transform;
try {
  ({ transform } = require("sucrase"));
} catch {
  ({ transform } = require(
    join(__dirname, "..", "..", "..", "apps", "docs", "node_modules", "sucrase"),
  ));
}

/**
 * Detect STORY-LOCAL DATA identifiers by executing the block in a
 * stubbed VM: React/hooks/components all stubbed, unknown globals
 * recorded. The recorded names (projectColumns, mainItems, …) exist
 * only in the DS's story file — the Blocks browser shims them as empty
 * arrays so structure still renders, and badges the card.
 */
function detectFreeIds(source) {
  const ReactStub = {
    createElement: (type, props, ...kids) => {
      if (typeof type === "function") return type({ ...(props ?? {}), children: kids });
      return { type };
    },
    Fragment: "f",
    useState: (i) => [i, () => {}],
    useRef: () => ({ current: null }),
    useMemo: (f) => f(),
    useCallback: (f) => f,
    useEffect: () => {},
    useLayoutEffect: () => {},
    useContext: () => ({}),
    forwardRef: (f) => f,
    createContext: () => ({ Provider: (p) => p.children }),
  };
  const stubC = () => (props) => (props && props.children) || null;
  const isObj = source.trim().startsWith("{");
  const tags = new Set();
  const tagRe = /<([A-Z][A-Za-z0-9]*)/g;
  let m;
  while ((m = tagRe.exec(source)) !== null) tags.add(m[1]);
  const mod = [
    "const fn=()=>()=>{};const breakpoint={sm:640,md:768,lg:1024,xl:1280};",
    [...tags].map((s) => `const ${s} = (props)=>props?.children??null;`).join("\n"),
    isObj
      ? `const __story=(${source.trim()});\nmodule.exports.default=function(){const R=__story.render;return R?R(__story.args??{}):null;}`
      : `module.exports.default=function(){return null;};`,
  ].join("\n");
  let js;
  try {
    js = transform(mod, { transforms: ["typescript", "jsx", "imports"], production: true }).code;
  } catch {
    return []; // parse failures are visible in the preview already
  }
  const missing = new Set();
  const base = { module: { exports: {} }, exports: {}, console, setTimeout, clearTimeout, React: ReactStub };
  const sandbox = new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      const g = globalThis[k];
      if (g !== undefined) return g;
      if (typeof k === "string") {
        missing.add(k);
        return []; // array shim — mirrors what the browser will inject
      }
      return undefined;
    },
    has() {
      return true;
    },
  });
  try {
    vm.runInNewContext(js, sandbox, { timeout: 2000 });
    const def = sandbox.module.exports.default;
    if (typeof def === "function") def({});
  } catch {
    /* runtime failure beyond shims — preview shows it */
  }
  return [...missing].filter((k) => !["window", "document", "navigator"].includes(k)).sort();
}
const id = process.argv[2] ?? "brightlocal";
if (!/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error("usage: generate-registry-blocks.mjs <registry-id>");
  process.exit(1);
}
const BLOCKS_DIR = join(__dirname, "..", "registries", id, "blocks");
const OUT_FILE = join(__dirname, "..", "src", "registry", id, "blocks.generated.ts");

const blocks = {};
for (const f of readdirSync(BLOCKS_DIR).filter((f) => f.endsWith(".jsx")).sort()) {
  const raw = readFileSync(join(BLOCKS_DIR, f), "utf-8");
  const lines = raw.split("\n");
  // Header = leading // comment run; source = everything after it.
  let i = 0;
  while (i < lines.length && (lines[i].startsWith("//") || lines[i].trim() === "")) i++;
  const headerLines = lines.slice(0, i).filter((l) => l.startsWith("//"));
  const source = lines.slice(i).join("\n").trim();
  if (!source) continue;
  const blockId = f.replace(/\.jsx$/, "");
  // "// Blocks/Form — Login Form" → group "Form", name "Login Form".
  const titleLine = (headerLines[0] ?? "").replace(/^\/\/\s*/, "");
  const [titlePart, namePart] = titleLine.split("—").map((s) => s.trim());
  const group = (titlePart ?? "").replace(/^Blocks\//, "") || blockId;
  const freeIds = detectFreeIds(source);
  blocks[blockId] = {
    id: blockId,
    group,
    name: namePart || blockId,
    source,
    ...(freeIds.length ? { freeIds } : {}),
  };
}

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  `// AUTO-GENERATED by scripts/generate-registry-blocks.mjs from
// registries/${id}/blocks/*.jsx — do not hand-edit; re-run after a
// blocks harvest. Source is the story's originalSource verbatim (CSF
// object or bare JSX); the Blocks browser normalises for rendering.
import type { RegistryBlock } from "../types";

export const ${id.toUpperCase().replace(/-/g, "_")}_BLOCKS: Readonly<
  Record<string, RegistryBlock>
> = ${JSON.stringify(blocks, null, 2)} as const;
`,
);
console.log(
  `[blocks] ${Object.keys(blocks).length} blocks → src/registry/${id}/blocks.generated.ts`,
);
