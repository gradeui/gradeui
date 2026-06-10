#!/usr/bin/env node
/**
 * css-rule-diff — the THEME-MIGRATION.md A6 verification gate.
 *
 * Parses two CSS files (unminified Tailwind output) into
 * (at-rule context ¦ selector) → sorted-declarations maps and reports:
 *   - rules only in A (removals — the failure mode that matters)
 *   - rules only in B (additions)
 *   - rules whose declarations changed
 *
 * Normalizations applied before comparing (visually-equivalent forms):
 *   - whitespace collapse
 *   - `oklch(var(--x) / 1)` ≡ `oklch(var(--x))` — the v3 <alpha-value>
 *     substitution artifact vs v4's bare wrap.
 *
 * Known-benign deltas when diffing the old @config build against the
 * native @theme build (verified June 2026, Phase A):
 *   - @layer theme :root additionally emits --font-sans/--font-mono
 *     (v4 default stacks) + --default-(mono-)font-family pointers; the
 *     runtime --font-sans/--font-mono in @gradeui/core tokens.css are
 *     unlayered and win the cascade, so computed values are identical.
 *   - preflight html/code rules reference var(--default-font-family,…)
 *     instead of var(--font-sans,…) — same resolution chain.
 *
 * Usage:
 *   tailwindcss -i styles/globals.css -o /tmp/old.css   # at the old rev
 *   tailwindcss -i styles/globals.css -o /tmp/new.css   # at the new rev
 *   node scripts/css-rule-diff.mjs /tmp/old.css /tmp/new.css
 *
 * Exits 1 if any rules were removed or changed (additions alone exit 0
 * with a warning — additive utilities can't change existing renders).
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(path.join(repoRoot, "packages/ui/package.json"));
const postcss = require("postcss");

function normVal(v) {
  return v
    .replace(/\s+/g, " ")
    .replace(/oklch\((var\(--[\w-]+\)) \/ 1\)/g, "oklch($1)")
    .trim();
}

function collect(file) {
  const root = postcss.parse(readFileSync(file, "utf8"));
  const map = new Map();
  function push(key, decl) {
    if (!map.has(key)) map.set(key, []);
    if (decl) map.get(key).push(decl);
  }
  function walk(node, ctx) {
    if (node.type === "rule") {
      const key = ctx
        .concat("R:" + node.selector.replace(/\s+/g, " ").trim())
        .join(" ¦ ");
      for (const child of node.nodes || []) {
        if (child.type === "decl")
          push(
            key,
            child.prop +
              ": " +
              normVal(child.value) +
              (child.important ? " !important" : ""),
          );
        else walk(child, key.split(" ¦ "));
      }
    } else if (node.type === "atrule") {
      const name =
        "@" +
        node.name +
        (node.params ? " " + node.params.replace(/\s+/g, " ") : "");
      if (!node.nodes) return push(ctx.concat("A:" + name).join(" ¦ "), null);
      for (const child of node.nodes) {
        if (child.type === "decl")
          push(
            ctx.concat("A:" + name).join(" ¦ "),
            child.prop + ": " + normVal(child.value),
          );
        else walk(child, ctx.concat("A:" + name));
      }
    } else if (node.type === "root") {
      for (const child of node.nodes) walk(child, ctx);
    }
  }
  walk(root, []);
  const out = new Map();
  for (const [k, decls] of map) out.set(k, decls.slice().sort().join("; "));
  return out;
}

/**
 * The documented benign deltas (see header): a changed rule passes if
 * every declaration that differs between old and new is part of v4's
 * default-font indirection. Everything else is a gate failure.
 */
const BENIGN_DECL = /^(--font-sans|--font-mono|--default-(mono-)?font-|font-family|font-feature-settings|font-variation-settings)/;
function benignChange(oldDecls, newDecls) {
  const o = new Set(oldDecls.split("; "));
  const n = new Set(newDecls.split("; "));
  const diff = [
    ...[...o].filter((d) => !n.has(d)),
    ...[...n].filter((d) => !o.has(d)),
  ];
  return diff.length > 0 && diff.every((d) => BENIGN_DECL.test(d));
}

const [, , fileA, fileB] = process.argv;
if (!fileA || !fileB) {
  console.error("usage: node scripts/css-rule-diff.mjs <old.css> <new.css>");
  process.exit(2);
}
const a = collect(fileA);
const b = collect(fileB);
const onlyA = [],
  onlyB = [],
  changed = [],
  benign = [];
for (const [k, v] of a) {
  if (!b.has(k)) onlyA.push(k);
  else if (b.get(k) !== v)
    (benignChange(v, b.get(k)) ? benign : changed).push(k);
}
for (const k of b.keys()) if (!a.has(k)) onlyB.push(k);

console.log(`rules old: ${a.size}  new: ${b.size}`);
console.log(`\n=== REMOVED (only in old) — ${onlyA.length} ===`);
onlyA.forEach((k) => console.log("  " + k));
console.log(`\n=== ADDED (only in new) — ${onlyB.length} ===`);
onlyB.forEach((k) => console.log("  " + k));
console.log(`\n=== CHANGED — ${changed.length} ===`);
changed.forEach((k) => {
  console.log("  " + k);
  console.log("    OLD: " + a.get(k));
  console.log("    NEW: " + b.get(k));
});
console.log(
  `\n=== BENIGN (v4 default-font indirection, documented) — ${benign.length} ===`,
);
benign.forEach((k) => console.log("  " + k));

if (onlyA.length || changed.length) process.exit(1);
if (onlyB.length) console.warn("\n(additions only — review, but not a gate failure)");
console.log("\nGATE: PASS");
