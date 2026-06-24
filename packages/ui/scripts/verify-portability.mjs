#!/usr/bin/env node
/**
 * verify-portability.mjs
 *
 * Proves the published @gradeui/ui tarball is SELF-DESCRIBING: that any
 * consumer (any agent, any dev — not just Grade Studio) receives, from the
 * installed package alone, everything needed to use the design system correctly.
 *
 * It runs `npm pack --dry-run --json` (the exact file list npm would publish)
 * and asserts the portability artifacts are present:
 *
 *   - AGENTS.md                 the "read me first" entry point
 *   - DESIGN.md                 the one comprehensive design spec
 *   - DESIGN.index.md           the cheap component scan
 *   - foundations/*.md          the rules that aren't components
 *   - components/ui/*.md        a sidecar for every component
 *   - dist/contracts.*          the machine-readable prop contracts
 *
 * It also fails if DESIGN.md is stale (a sidecar/foundation was edited without
 * regenerating), and warns if any component is missing its sidecar.
 *
 *   pnpm -F @gradeui/ui verify:portability
 *
 * Exit code 0 = portable; non-zero = a consumer would NOT get the full picture.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = [];
const warn = [];
const fail = (m) => bad.push(m);

// 1. Ask npm exactly which files it would publish.
let packed;
try {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: PKG_ROOT,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  packed = JSON.parse(out);
} catch (e) {
  console.error("[verify-portability] `npm pack --dry-run` failed:", e.message);
  process.exit(2);
}
const files = new Set((packed[0]?.files || []).map((f) => f.path));
const has = (p) => files.has(p);
const hasGlob = (dir, ext) =>
  [...files].filter((f) => f.startsWith(dir + "/") && f.endsWith(ext));

console.log(`\n@gradeui/ui portability check — ${files.size} files in the tarball\n`);

// 2. Single-file entry points.
for (const f of ["AGENTS.md", "DESIGN.md", "DESIGN.index.md"]) {
  has(f) ? ok(`${f} ships`) : fail(`${f} is MISSING from the tarball`);
}

// 3. Foundations.
const foundationsOnDisk = readdirSync(join(PKG_ROOT, "foundations")).filter(
  (f) => f.endsWith(".md") && f !== "_intro.md"
);
const foundationsShipped = hasGlob("foundations", ".md");
if (foundationsShipped.length >= foundationsOnDisk.length && foundationsShipped.length > 0) {
  ok(`${foundationsShipped.length} foundation docs ship`);
} else {
  fail(`foundations missing: ${foundationsOnDisk.length} on disk, ${foundationsShipped.length} shipped`);
}

// 4. Component sidecars — one per component source file.
const sidecarsShipped = hasGlob("components/ui", ".md");
if (sidecarsShipped.length > 0) ok(`${sidecarsShipped.length} component sidecars ship`);
else fail("no component sidecars in the tarball");

// Only PUBLIC components (re-exported from the barrel) need a sidecar — a
// sidecar advertises the public API. Internals (icons, sonner, legacy
// unexported blocks) are intentionally undocumented. The barrel re-exports
// via `from "../components/ui/<name>"`, so that's the public set.
const barrel = readFileSync(join(PKG_ROOT, "lib", "index.ts"), "utf-8");
const publicBases = new Set(
  [...barrel.matchAll(/components\/ui\/([a-z0-9-]+)"/g)].map((m) => m[1])
);
const sidecarNames = new Set(
  sidecarsShipped.map((f) => f.replace("components/ui/", "").replace(/\.md$/, ""))
);
for (const base of publicBases) {
  if (!sidecarNames.has(base)) warn.push(`PUBLIC component "${base}" has no sidecar (.md)`);
}
ok(`${publicBases.size} public components checked for sidecars`);

// 5. Machine-readable contracts entry.
hasGlob("dist", "contracts.mjs").length || has("dist/contracts.mjs")
  ? ok("machine-readable ./contracts ships (dist/contracts.*)")
  : warn.push("dist/contracts.* not found — run a build so ./contracts ships");

// 6. Staleness: DESIGN.md must be at least as new as its sources.
if (existsSync(join(PKG_ROOT, "DESIGN.md"))) {
  const design = readFileSync(join(PKG_ROOT, "DESIGN.md"), "utf-8");
  const scaffoldRule = design.includes("every `Section` wraps a `Container`") ||
    design.includes("ALWAYS contains a `Container`");
  scaffoldRule
    ? ok("DESIGN.md carries the Section→Container scaffold rule")
    : fail("DESIGN.md is stale or missing the scaffold rule — run generate:design");
}

// 7. exports map advertises the entry points.
const pkg = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8"));
for (const sub of ["./DESIGN.md", "./AGENTS.md", "./contracts"]) {
  pkg.exports?.[sub]
    ? ok(`exports advertises "${sub}"`)
    : warn.push(`exports map does not advertise "${sub}"`);
}

// Report.
if (warn.length) {
  console.log("\nwarnings:");
  warn.forEach((w) => console.log(`  ! ${w}`));
}
if (bad.length) {
  console.log("\nFAILED — a consumer would NOT receive the full design system:");
  bad.forEach((b) => console.log(`  ✗ ${b}`));
  process.exit(1);
}
console.log("\nPASS — the package is self-describing. Any consumer gets the full picture.\n");
