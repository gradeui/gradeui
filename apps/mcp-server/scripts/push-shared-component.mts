// Create or update a project SHARED COMPONENT from a local file, through
// the SAME gate `save_shared_component` uses.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/push-shared-component.mts <projectId> <Name> <file.jsx> \
//     [--expected=<updatedAt>] [--description="One line"] [--dry-run]
//
// Why this exists: `save_shared_component` takes the module source as a
// tool ARGUMENT, so a 20k-character component goes through a model context
// on every save. This reads it from disk instead. Same reasoning, and the
// same safety rules, as push-screen.mts.
//
// It is NOT a way around validation. It runs, in the tool's order:
//   1. the export check (the module must export `Name`),
//   2. an esbuild parse gate (the contract validator is not a parse check),
//   3. validateAgainstContract against the project's registry,
//   4. saveSharedComponent(), the tool's own write path.
//
// Updates are compare-and-swap. Pass --expected with the version you
// edited from (the updated_at you dumped), and a component that changed
// since is refused rather than overwritten. Without --expected the script
// reads the live version immediately before writing, which only guards
// the last instant; prefer --expected. No live component of that name
// means create. Existing screens pick an update up on their next render.
import { readFileSync } from "node:fs";
import { transformSync as esbuildTransformSync } from "esbuild";
import { createClient } from "@supabase/supabase-js";
import { validateAgainstContract, formatViolations } from "@gradeui/studio/core";
import { contractsForRegistry } from "../src/registry-contracts.js";
import { saveSharedComponent } from "../src/shared-components.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const argv = process.argv.slice(2);
const opt = (name: string) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const dryRun = argv.includes("--dry-run");
const [projectId, name, file] = argv.filter((a) => !a.startsWith("--"));
if (!projectId || !name || !file) {
  throw new Error(
    'usage: push-shared-component.mts <projectId> <Name> <file.jsx> [--expected=<updatedAt>] [--description="..."] [--dry-run]',
  );
}
if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) throw new Error(`"${name}" is not a PascalCase component name`);

const source = readFileSync(file, "utf-8");
if (source.trim().length === 0) throw new Error(`${file} is empty, refusing to blank the component`);

// 1. The export check, verbatim from the tool.
const exportRe = new RegExp(
  `export\\s+(?:function|const|let|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`,
);
if (!exportRe.test(source)) throw new Error(`NOT SAVED: ${file} does not export \`${name}\``);

// 2. Parse gate.
try {
  esbuildTransformSync(source, { loader: "jsx", jsx: "automatic" });
} catch (err) {
  const e = err as { errors?: { text?: string; location?: { line?: number; column?: number } }[] };
  const first = e.errors?.[0];
  const where = first?.location ? ` at line ${first.location.line}:${first.location.column}` : "";
  throw new Error(`NOT SAVED: ${file} is not valid JSX${where}: ${first?.text ?? String(err)}`);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// 3. Contracts, from the project row's registry, as the tool resolves it.
const { data: project, error: projErr } = await sb
  .from("projects")
  .select("registry_id")
  .eq("id", projectId)
  .maybeSingle();
if (projErr) throw projErr;
if (!project) throw new Error(`no project ${projectId}`);
const { registry, contracts } = contractsForRegistry(project.registry_id as string | null);
const report = validateAgainstContract(source, { contracts });
const errors = report.violations.filter((v) => v.severity === "error");
console.log(
  `${file}: ${source.length} chars, validated against the "${registry.id}" registry, ${report.componentsChecked} components checked`,
);
if (errors.length > 0) {
  console.error(`\nNOT SAVED: ${errors.length} contract violation(s):\n\n${formatViolations(report)}`);
  process.exit(1);
}
if (report.violations.length > 0) console.log(`\n${report.violations.length} note(s):\n${formatViolations(report)}`);

// Which row, if any, this name already is.
const { data: live, error: liveErr } = await sb
  .from("shared_components")
  .select("id, updated_at, description")
  .eq("project_id", projectId)
  .eq("name", name)
  .is("deleted_at", null)
  .maybeSingle();
if (liveErr) throw liveErr;

if (dryRun) {
  console.log(`\n✓ validates clean. --dry-run, nothing written (${live ? `would update ${live.id}` : "would create"}).`);
  process.exit(0);
}

const expectedArg = opt("expected");
const expectedUpdatedAt = live ? (expectedArg ? Number(expectedArg) : (live.updated_at as number)) : undefined;
const result = await saveSharedComponent(sb, {
  projectId,
  name,
  source,
  description: opt("description") ?? (live?.description as string | undefined) ?? undefined,
  componentId: live ? (live.id as string) : undefined,
  expectedUpdatedAt,
});

if (result.conflict) {
  console.error(
    `\nNOT SAVED: ${name} changed since version ${expectedUpdatedAt} (now ${result.updatedAt}). Re-dump it, re-apply your edit, and push again.`,
  );
  process.exit(1);
}
if (result.nameTaken) {
  console.error(`\nNOT SAVED: another live component is already called ${name}.`);
  process.exit(1);
}
console.log(`\n✓ ${result.created ? "created" : "updated"} ${name} (${result.id}), version ${result.updatedAt}`);
