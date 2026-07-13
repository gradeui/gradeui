#!/usr/bin/env node
/**
 * generate-brightlocal-contracts.mjs — BrightLocal registry contract specs.
 *
 * Transforms the committed BrightLocal sidecars
 * (registries/brightlocal/sidecars/*.md — themselves harvested from the
 * package's component-meta.json + MCP server and re-grounded in
 * dist/index.js) into serialisable RegistryContractSpec objects at
 * src/registry/brightlocal/contracts.generated.ts.
 *
 * Why sidecars and not component-meta.json directly: the meta is not
 * committed here (it lives in the npm tarball), it drifted 23 exports
 * from the real barrel, and the sidecars are the reviewed, grounded
 * transform of it. Contracts are Studio's normal form; the sidecars are
 * the boundary format. Re-run after a sidecar review pass:
 *
 *   node scripts/generate-brightlocal-contracts.mjs
 *
 * Inference rules (deliberately conservative — a wrong control is worse
 * than a missing one):
 *   - frontmatter `variants:` / `sizes:` arrays → enum KNOBS named
 *     `variant` / `size`, default = first entry (BL's cva default).
 *   - prop lines `name? (a | b | c)` → enum knob.
 *   - prop lines with explicit `: string` / `: boolean` / `: number` →
 *     that kind.
 *   - untyped props in KNOWN_BOOLEANS → boolean knob.
 *   - `on*` handlers → design "event" (recorded, filtered from UI).
 *   - dataHook / ariaLabel / value plumbing → design "plumbing".
 *   - everything else untyped → string "plumbing" (recorded, hidden)
 *     until the sidecar review pass types it.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SIDECAR_DIR = join(__dirname, "..", "registries", "brightlocal", "sidecars");
const OUT_FILE = join(
  __dirname,
  "..",
  "src",
  "registry",
  "brightlocal",
  "contracts.generated.ts",
);

/** Untyped prop names we can safely call boolean presence knobs. */
const KNOWN_BOOLEANS = new Set([
  "disabled",
  "loading",
  "asChild",
  "iconOnly",
  "fullWidth",
  "open",
  "defaultOpen",
  "modal",
  "checked",
  "defaultChecked",
  "error",
  "withHandle",
  "unmountOnExit",
  "closable",
  "required",
  "readOnly",
]);

/** Untyped names that are wiring, not design knobs. */
const PLUMBING_NAMES = new Set([
  "dataHook",
  "ariaLabel",
  "value",
  "defaultValue",
  "name",
  "id",
  "type",
]);

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  const out = { props: [] };
  const name = fm.match(/^name:\s*(.+)$/m);
  if (name) out.name = name[1].trim();
  const variants = fm.match(/^variants:\s*\[([^\]]*)\]/m);
  if (variants) out.variants = variants[1].split(",").map((s) => s.trim()).filter(Boolean);
  const sizes = fm.match(/^sizes:\s*\[([^\]]*)\]/m);
  if (sizes) out.sizes = sizes[1].split(",").map((s) => s.trim()).filter(Boolean);
  const propsBlock = fm.match(/^props:\n((?:  - .*\n?)*)/m);
  if (propsBlock) {
    out.props = propsBlock[1]
      .split("\n")
      .map((l) => l.replace(/^  - /, "").trim())
      .filter(Boolean);
  }
  return out;
}

/** `name[?][: type][ (a | b)] — desc` → RegistryPropSpec | null. */
function parsePropLine(line) {
  const [sig, ...descParts] = line.split("—").map((s) => s.trim());
  let description = descParts.join(" — ").trim() || undefined;
  if (description && /^TODO\(review\)/.test(description)) description = undefined;

  const m = sig.match(/^([A-Za-z][A-Za-z0-9]*)(\?)?(?::\s*([a-z]+))?(?:\s*\(([^)]+)\))?$/);
  if (!m) return null;
  const [, name, opt, type, enumBody] = m;
  const optional = Boolean(opt);

  let kind;
  let values;
  let design = "knob";

  if (enumBody && enumBody.includes("|")) {
    kind = "enum";
    values = enumBody.split("|").map((s) => s.trim()).filter(Boolean);
  } else if (type === "boolean") {
    kind = "boolean";
  } else if (type === "number") {
    kind = "number";
  } else if (type === "string") {
    kind = "string";
  } else if (KNOWN_BOOLEANS.has(name)) {
    kind = "boolean";
  } else if (/^on[A-Z]/.test(name)) {
    kind = "string";
    design = "event";
  } else {
    // Untyped and unrecognised — record, don't render, until the
    // sidecar review pass supplies a type.
    kind = "string";
    design = "plumbing";
  }

  if (design === "knob" && PLUMBING_NAMES.has(name)) design = "plumbing";

  return { name, spec: { kind, values, design, optional: optional || undefined, description } };
}

function firstBodyLine(md) {
  const body = md.replace(/^---\n[\s\S]*?\n---\n?/, "");
  const line = body.split("\n").map((l) => l.trim()).find((l) => l && !/^[#<`\/{]/.test(l) && !/^(import|export|const|let|return)\b/.test(l)); // prose only — example-only bodies yield undefined
  return line || undefined;
}

function buildSpec(fm, md) {
  const props = {};
  const variantDefaults = {};

  if (fm.variants?.length) {
    props.variant = {
      kind: "enum",
      values: fm.variants,
      design: "knob",
      optional: true,
      default: fm.variants[0],
    };
    variantDefaults.variant = fm.variants[0];
  }
  if (fm.sizes?.length) {
    props.size = {
      kind: "enum",
      values: fm.sizes,
      design: "knob",
      optional: true,
      default: fm.sizes[0],
    };
    variantDefaults.size = fm.sizes[0];
  }
  for (const line of fm.props) {
    const parsed = parsePropLine(line);
    if (!parsed || props[parsed.name]) continue;
    props[parsed.name] = parsed.spec;
  }

  return {
    name: fm.name,
    description: firstBodyLine(md),
    props,
    variantDefaults: Object.keys(variantDefaults).length ? variantDefaults : undefined,
  };
}

function main() {
  const files = readdirSync(SIDECAR_DIR).filter((f) => f.endsWith(".md")).sort();
  const specs = {};
  for (const f of files) {
    const md = readFileSync(join(SIDECAR_DIR, f), "utf-8");
    const fm = parseFrontmatter(md);
    if (!fm?.name) {
      console.warn(`skip ${f}: no frontmatter name`);
      continue;
    }
    specs[fm.name] = buildSpec(fm, md);
  }

  const json = JSON.stringify(specs, (_k, v) => v, 2)
    // Drop keys serialised as undefined-free already by JSON; nothing to do.
    ;

  const out = `// AUTO-GENERATED by scripts/generate-brightlocal-contracts.mjs from
// registries/brightlocal/sidecars/*.md — do not hand-edit; re-run the
// script after a sidecar review pass. Serialisable contract specs (no
// zod — registry rule 1); the settings panel converts these into real
// ComponentContracts at the edge (apps/docs/lib/registry-contracts).
import type { RegistryContractSpec } from "../types";

export const BRIGHTLOCAL_CONTRACTS: Readonly<
  Record<string, RegistryContractSpec>
> = ${json} as const;
`;

  writeFileSync(OUT_FILE, out);
  console.log(
    `wrote ${Object.keys(specs).length} contract specs → src/registry/brightlocal/contracts.generated.ts`,
  );
}

main();
