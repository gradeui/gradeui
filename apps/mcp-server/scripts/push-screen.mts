// Push a locally-edited screen file back into Supabase, through the SAME
// contract gate `save_screen` uses.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/push-screen.mts <projectId> <screenId> <file.jsx> [--dry-run] [--make-active]
//
// Why this exists: `save_screen` takes the JSX as a tool ARGUMENT, so
// iterating on a 60k-character screen means shipping the whole file
// through a model context on every step. This reads it from disk instead.
//
// It is NOT a way around validation. It imports the same three things the
// MCP tool does and calls them the same way:
//
//   contractsForRegistry()   from ../src/registry-contracts  (registry resolution)
//   validateAgainstContract  from @gradeui/studio/core       (the gate)
//   saveScreen()             from ../src/designs             (the write path)
//
// so the state merge, position handling and optimistic-concurrency
// semantics are byte-identical to a `save_screen` call. If it ever
// diverges, that is a bug in this file, not a licence to skip the check.
//
// Two deliberate differences from the tool, both safety-side:
//   - `makeActive` defaults to FALSE. Moving the active screen under an
//     open Studio canvas invites that canvas to autosave stale source
//     over the row it lands on.
//   - `expectedUpdatedAt` is ALWAYS sent, read immediately before the
//     write, so a concurrent Studio save is refused rather than clobbered.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { validateAgainstContract, formatViolations } from "@gradeui/studio/core";
import { contractsForRegistry } from "../src/registry-contracts.js";
import { getScreen, saveScreen } from "../src/designs.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const [projectId, screenId, file] = argv.filter((a) => !a.startsWith("--"));
if (!projectId || !screenId || !file) {
  throw new Error(
    "usage: push-screen.mts <projectId> <screenId> <file.jsx> [--dry-run] [--make-active]",
  );
}
const dryRun = flags.has("--dry-run");

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const jsx = readFileSync(file, "utf-8");

// Registry comes from the PROJECT ROW, exactly as save_screen resolves it.
const { data: project, error: projErr } = await sb
  .from("projects")
  .select("registry_id")
  .eq("id", projectId)
  .maybeSingle();
if (projErr) throw projErr;
if (!project) throw new Error(`no project ${projectId}`);

const { registry, contracts } = contractsForRegistry(
  project.registry_id as string | null,
);

const report = validateAgainstContract(jsx, { contracts });
const errors = report.violations.filter((v) => v.severity === "error");

console.log(
  `${file}: ${jsx.length} chars, validated against the "${registry.id}" registry (${Object.keys(contracts).length} contracts), ${report.componentsChecked} components checked`,
);

if (errors.length > 0) {
  console.error(
    `\nNOT SAVED — ${errors.length} contract violation(s):\n\n${formatViolations(report)}`,
  );
  process.exit(1);
}

const warnings = report.violations.length;
if (warnings > 0) {
  console.log(`\n${warnings} non-blocking note(s):\n${formatViolations(report)}`);
}

if (dryRun) {
  console.log("\n✓ validates clean. --dry-run, nothing written.");
  process.exit(0);
}

// Read the live version immediately before writing so a concurrent Studio
// autosave loses the race instead of being silently overwritten.
const current = await getScreen(sb, projectId, screenId);
if (!current) throw new Error(`no screen ${screenId} in project ${projectId}`);

const result = await saveScreen(sb, {
  projectId,
  screenId,
  jsx,
  makeActive: flags.has("--make-active"),
  expectedUpdatedAt: current.updatedAt,
});

if (result.conflict) {
  console.error(
    `\nNOT SAVED — screen ${screenId} changed underneath us (now version ${result.updatedAt}).\nSomething else wrote to it: re-dump with dump-screen.mts, re-apply your edit, and push again.`,
  );
  process.exit(1);
}

console.log(
  `\n✓ saved "${current.name}" (${result.id}, position ${result.position}) — version ${current.updatedAt} → ${result.updatedAt}`,
);
