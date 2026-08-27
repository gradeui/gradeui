// Create a NEW screen in a project from a local JSX file, through the SAME
// contract gate `save_screen` uses.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/create-screen.mts <projectId> "<name>" <file.jsx> [--dry-run]
//
// Why this exists: push-screen.mts updates an EXISTING screen and
// duplicate-screen.mts copies one server-side, but neither creates a screen
// from a file — the only route was `save_screen` with the JSX as a tool
// ARGUMENT, which ships the whole file through a model context to create it.
//
// Validation is identical to push-screen.mts: same contractsForRegistry(),
// same validateAgainstContract(). It is not a way around the check.
//
// The new screen lands at the end of the list. `projects.active_design_id`
// is deliberately NOT moved: switching the active screen under an open
// Studio canvas invites that canvas to autosave stale source over the row
// it lands on.
import { readFileSync } from "node:fs";
import { transformSync as esbuildTransformSync } from "esbuild";
import { createClient } from "@supabase/supabase-js";
import { validateAgainstContract, formatViolations } from "@gradeui/studio/core";
import { contractsForRegistry } from "../src/registry-contracts.js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const [projectId, name, file] = argv.filter((a) => !a.startsWith("--"));
if (!projectId || !name || !file) {
  throw new Error('usage: create-screen.mts <projectId> "<name>" <file.jsx> [--dry-run]');
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const jsx = readFileSync(file, "utf-8");

// An EMPTY file is never a legitimate screen. Without this the validator
// happily reports "0 components checked" and the write goes through,
// blanking the screen — which is exactly what a shell one-liner does when
// the file it was told to read does not exist. Refuse before the write.
if (jsx.trim().length === 0) {
  throw new Error(`${file} is empty — refusing to blank the screen`);
}

// PARSE GATE. validateAgainstContract checks COMPONENT CONTRACTS, not that
// the file is valid JSX — a screen with a syntax error sails through it and
// then dies in the sandbox with "render error", which looks like a broken
// goto or a stale cache rather than a bad save (27 Aug: a {/* */} comment
// placed directly inside `return (` shipped this way and cost an hour).
// esbuild is already a dependency of the renderer, so this is the same
// parser the sandbox will use.
const assertParses = (source: string, label: string) => {
  try {
    esbuildTransformSync(source, { loader: "jsx", jsx: "automatic" });
  } catch (err) {
    const e = err as { errors?: { text?: string; location?: { line?: number; column?: number } }[] };
    const first = e.errors?.[0];
    const where = first?.location ? ` at line ${first.location.line}:${first.location.column}` : "";
    throw new Error(
      `${label} is not valid JSX${where}: ${first?.text ?? String(err)}\nNOT SAVED — fix the syntax and try again.`,
    );
  }
};

assertParses(jsx, file);

const { data: project, error: projErr } = await sb
  .from("projects")
  .select("registry_id")
  .eq("id", projectId)
  .maybeSingle();
if (projErr) throw projErr;
if (!project) throw new Error(`no project ${projectId}`);

const { registry, contracts } = contractsForRegistry(project.registry_id as string | null);
const report = validateAgainstContract(jsx, { contracts });
const errors = report.violations.filter((v) => v.severity === "error");

console.log(
  `${file}: ${jsx.length} chars, validated against the "${registry.id}" registry (${Object.keys(contracts).length} contracts), ${report.componentsChecked} components checked`,
);

if (errors.length > 0) {
  console.error(`\nNOT SAVED — ${errors.length} contract violation(s):\n\n${formatViolations(report)}`);
  process.exit(1);
}
if (report.violations.length > 0) {
  console.log(`\n${report.violations.length} non-blocking note(s):\n${formatViolations(report)}`);
}

// A name collision is almost always a double-run. Stop rather than leave two
// identically-named screens for someone to tell apart by id.
const { data: clash, error: clashErr } = await sb
  .from("designs")
  .select("id")
  .eq("project_id", projectId)
  .eq("name", name)
  .is("deleted_at", null)
  .maybeSingle();
if (clashErr) throw clashErr;
if (clash) throw new Error(`a live screen named "${name}" already exists (id ${clash.id})`);

if (flags.has("--dry-run")) {
  console.log("\n✓ validates clean, no name clash. --dry-run, nothing written.");
  process.exit(0);
}

const { data: last, error: posErr } = await sb
  .from("designs")
  .select("position")
  .eq("project_id", projectId)
  .is("deleted_at", null)
  .order("position", { ascending: false })
  .limit(1)
  .maybeSingle();
if (posErr) throw posErr;

// Same shape as the MCP server's mintScreenId(): client-minted TEXT, not a UUID.
const id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const position = ((last?.position as number | undefined) ?? -1) + 1;
const now = Date.now();

const { error: writeErr } = await sb.from("designs").insert({
  id,
  project_id: projectId,
  name,
  state: { appSource: jsx },
  position,
  created_at: now,
  updated_at: now,
});
if (writeErr) throw writeErr;

const { data: made, error: verifyErr } = await sb
  .from("designs")
  .select("id,name,position,state")
  .eq("id", id)
  .single();
if (verifyErr) throw verifyErr;
const stored = (made.state as Record<string, unknown>)?.appSource as string;

console.log(
  [
    `\n✓ created "${made.name}" (${made.id}, position ${made.position})`,
    `appSource: ${jsx.length} chars, stored byte-identical: ${stored === jsx ? "YES" : "NO — INVESTIGATE"}`,
    `active screen unchanged (reload Studio to see it)`,
  ].join("\n"),
);
if (stored !== jsx) process.exit(1);
