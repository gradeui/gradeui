#!/usr/bin/env node
/**
 * draft-brightlocal-sidecars.mjs
 *
 * One-time (re-runnable) transform: BrightLocal's shipped metadata →
 * draft sidecars in the Grade sidecar frontmatter schema.
 *
 *   node scripts/draft-brightlocal-sidecars.mjs /path/to/unpacked/@brightlocal/ui-components
 *
 * Sources (all shipped inside the npm tarball):
 *   component-meta.json  — 65 components + 3 blocks: exports, variants,
 *                          props, aliases, whenToUse, doNotUseFor,
 *                          alternatives, a11yContract, dataHookRequired
 *   deprecations.json    — per-item deprecations folded into prop notes
 *
 * Output: registries/brightlocal/sidecars/<kebab-name>.md
 *
 * These are DRAFTS. The transform is faithful to the meta file but the
 * meta file doesn't carry prop types or composition idioms — review each
 * file (grep for `TODO(review)`) before trusting retrieval quality.
 * After review, regenerate the inlined bundle:
 *
 *   pnpm -F @gradeui/studio generate:registry-sidecars brightlocal
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "registries", "brightlocal", "sidecars");

const pkgDir = process.argv[2];
if (!pkgDir) {
  console.error("usage: draft-brightlocal-sidecars.mjs <path-to-unpacked-package>");
  process.exit(1);
}

const meta = JSON.parse(readFileSync(join(pkgDir, "component-meta.json"), "utf-8"));
const deprecations = JSON.parse(readFileSync(join(pkgDir, "deprecations.json"), "utf-8"));

/**
 * GROUND TRUTH CHECK — component-meta.json has drifted from the published
 * exports (v2.20.0 lists H1/P/Muted/InputPassword etc.; the dist actually
 * ships TypographyH1/TypographyP/TypographyMuted/InputPasswordRoot…).
 * A name that isn't a real export becomes `undefined` at the import site
 * and crashes the preview with "Element type is invalid". So: parse the
 * REAL barrel (dist/index.js re-export lines), and reconcile each meta
 * export against it — exact match keeps, `<Component><Name>` prefix match
 * substitutes (H1 → TypographyH1), anything else is dropped and logged.
 * (Worth reporting upstream to BrightLocal — their own AI_USAGE consumers
 * hit the same wall.)
 */
const barrelSrc = readFileSync(join(pkgDir, "dist", "index.js"), "utf-8");
const REAL_EXPORTS = new Set(
  [...barrelSrc.matchAll(/import\s*\{([^}]+)\}\s*from/g)].flatMap((m) =>
    m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean),
  ),
);

function reconcileExports(component) {
  const out = [];
  for (const name of component.exports ?? [component.name]) {
    if (REAL_EXPORTS.has(name)) {
      out.push(name);
    } else if (REAL_EXPORTS.has(`${component.name}${name}`)) {
      out.push(`${component.name}${name}`);
      console.warn(
        `[reconcile] ${component.name}: meta export "${name}" → real export "${component.name}${name}"`,
      );
    } else {
      console.warn(
        `[reconcile] ${component.name}: meta export "${name}" has NO real export — dropped`,
      );
    }
  }
  return out;
}

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Deprecated prop names per component — folded into prop annotations. */
const deprecatedProps = new Map();
for (const d of deprecations) {
  if (d.type !== "prop") continue;
  if (!deprecatedProps.has(d.component)) deprecatedProps.set(d.component, []);
  deprecatedProps.get(d.component).push(d);
}

function fmList(items) {
  return `[${items.join(", ")}]`;
}

function draftSidecar(c) {
  const real = reconcileExports(c);
  // Six meta ROOT names are themselves phantoms (Typography, Chart, Map,
  // DatePicker, Resizable, InputPassword) — the ref header renders a
  // ready-to-paste import line from `name` + subcomponents, so the name
  // MUST be a real export. Lead with the first real export and keep the
  // meta name as a retrieval alias.
  let realName = REAL_EXPORTS.has(c.name) ? c.name : real[0];
  if (!realName) {
    // Meta listed ONLY the phantom root (InputPassword). Fall back to the
    // real exports that share its prefix (InputPasswordRoot/Field/…),
    // preferring the *Root convention, and fold them in as the surface.
    const prefixed = [...REAL_EXPORTS].filter((n) => n.startsWith(c.name)).sort();
    realName = prefixed.find((n) => n === `${c.name}Root`) ?? prefixed[0] ?? c.name;
    real.push(...prefixed);
    if (prefixed.length) {
      console.warn(`[reconcile] ${c.name}: root is phantom — using ${prefixed.join(", ")}`);
    }
  }
  const aliasExtra = realName === c.name ? [] : [c.name.toLowerCase()];
  const subs = real.filter((e) => e !== realName);
  const variants = c.variants?.variant ?? [];
  const sizes = c.variants?.size ?? [];
  const otherAxes = Object.entries(c.variants ?? {}).filter(([k]) => k !== "variant" && k !== "size");

  const props = [];
  for (const [axis, values] of otherAxes) {
    props.push(`${axis}? (${values.join(" | ")})`);
  }
  for (const p of c.props ?? []) {
    // Meta carries names only — types need a review pass against src/.
    props.push(`${p}? — TODO(review): type + one-line description from src`);
  }
  if (c.dataHookRequired) {
    props.push(
      "dataHook: string — REQUIRED (renders data-hook; kebab-case {context}-{componentType}, e.g. \"settings-save-button\")",
    );
  } else {
    props.push("dataHook?: string — optional on structural components (renders data-hook)");
  }
  for (const d of deprecatedProps.get(c.name) ?? []) {
    props.push(`${d.item} — DEPRECATED since ${d.since}: ${d.reason} (${d.ticket})`);
  }

  const whenParts = [...(c.whenToUse ?? [])];
  if (c.doNotUseFor?.length) {
    whenParts.push(`Do NOT use for: ${c.doNotUseFor.join("; ")}.`);
  }
  for (const alt of c.alternatives ?? []) {
    whenParts.push(alt.rule.endsWith(".") ? alt.rule : `${alt.rule}.`);
  }
  const composes = [...new Set((c.alternatives ?? []).map((a) => a.component))];

  const fm = [];
  fm.push("---");
  fm.push(`name: ${realName}`);
  // Barrel form — Studio's internal normal form. The per-file subpath the
  // BrightLocal convention requires at handoff is carried separately and
  // consumed by the exporters via registry.package.importMap.
  fm.push(`import: "@brightlocal/ui-components"`);
  fm.push(`subpath: "${c.import}"`);
  if (subs.length) fm.push(`subcomponents: ${fmList(subs)}`);
  if (variants.length) fm.push(`variants: ${fmList(variants)}`);
  if (sizes.length) fm.push(`sizes: ${fmList(sizes)}`);
  if (props.length) {
    fm.push("props:");
    for (const p of props) fm.push(`  - ${p}`);
  }
  if (whenParts.length) fm.push(`when_to_use: ${whenParts.join(" ")}`);
  if (composes.length) fm.push(`composes_with: ${fmList(composes)}`);
  const aliases = [...(c.aliases ?? []), ...aliasExtra];
  if (aliases.length) fm.push(`aliases: ${fmList(aliases)}`);
  fm.push("---");

  const body = [];
  body.push("");
  body.push("```jsx");
  body.push(exampleFor({ ...c, name: realName }, subs));
  body.push("```");
  if (c.a11yContract?.keyboardInteraction?.length) {
    body.push("");
    body.push(
      `A11y: role=${c.a11yContract.role ?? "—"}; keyboard: ${c.a11yContract.keyboardInteraction.join(", ")}.`,
    );
  }
  if (c.knownGaps?.length) {
    body.push("");
    for (const g of c.knownGaps) {
      body.push(`Known gap: ${g.description} (${g.ticket}). Workaround: ${g.workaround}`);
    }
  }
  body.push("");
  body.push("<!-- TODO(review): drafted from component-meta.json — verify props against src/, add a real composition example. -->");
  body.push("");
  return fm.join("\n") + "\n" + body.join("\n");
}

/** Minimal honest usage example. Compound components nest their first
 *  couple of sub-exports; simple ones render with required conventions. */
function exampleFor(c, subs) {
  const hook = c.dataHookRequired ? ` dataHook="example-${kebab(c.name)}"` : "";
  if (!c.compound || subs.length === 0) {
    return `<${c.name}${hook} />`;
  }
  const inner = subs
    .slice(0, 3)
    .map((s) => `  <${s}>…</${s}>`)
    .join("\n");
  return `<${c.name}${hook}>\n${inner}\n</${c.name}>`;
}

mkdirSync(OUT_DIR, { recursive: true });
const all = [...meta.components, ...meta.blocks];
let n = 0;
for (const c of all) {
  const file = join(OUT_DIR, `${kebab(c.name)}.md`);
  writeFileSync(file, draftSidecar(c));
  n++;
}
console.log(`[draft-brightlocal-sidecars] wrote ${n} drafts to ${OUT_DIR}`);
