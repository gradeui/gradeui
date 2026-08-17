// Duplicate a screen (a `designs` row) inside its project, byte-for-byte.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/duplicate-screen.mts <projectId> <screenId> "<new name>"
//
// Why a script and not save_screen: the MCP tool takes the JSX as a tool
// ARGUMENT, so duplicating a large screen means round-tripping ~130k
// characters of source through the model's context to hand it straight
// back unchanged. This copies the row server-side instead — nothing is
// re-serialised, re-formatted, or re-validated, so the copy is provably
// identical to the original rather than merely intended to be.
//
// It also sidesteps the save-time contract check, which is correct HERE
// and only here: the source is already live and already passed validation
// when it was authored. Anything that EDITS a screen must keep going
// through save_screen so the validator sees it.
//
// The copy carries the whole `state` blob (appSource, tags, status, and
// any sibling key Studio owns) and lands at the end of the screen list.
// `projects.active_design_id` is deliberately NOT moved: switching the
// active screen under an open Studio canvas invites that canvas to
// autosave its stale source over the row it lands on.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const [projectId, screenId, newName] = process.argv.slice(2);
if (!projectId || !screenId || !newName) {
  throw new Error(
    'usage: duplicate-screen.mts <projectId> <screenId> "<new name>"',
  );
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Same shape as the MCP server's mintScreenId(): client-minted TEXT, not a UUID.
const mintScreenId = () =>
  "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const { data: source, error: readErr } = await sb
  .from("designs")
  .select("id,name,position,state,created_at,updated_at")
  .eq("project_id", projectId)
  .eq("id", screenId)
  .is("deleted_at", null)
  .maybeSingle();
if (readErr) throw readErr;
if (!source) {
  throw new Error(`no live screen "${screenId}" in project ${projectId}`);
}

const state = (source.state ?? {}) as Record<string, unknown>;
const appSource = typeof state.appSource === "string" ? state.appSource : "";
if (!appSource) {
  throw new Error(
    `screen "${source.name}" has no state.appSource — refusing to duplicate an empty screen`,
  );
}

// A name collision is almost always a double-run. Stop rather than leave
// two identically-named screens for someone to tell apart by id.
const { data: clash, error: clashErr } = await sb
  .from("designs")
  .select("id")
  .eq("project_id", projectId)
  .eq("name", newName)
  .is("deleted_at", null)
  .maybeSingle();
if (clashErr) throw clashErr;
if (clash) {
  throw new Error(
    `a live screen named "${newName}" already exists (id ${clash.id}) — pick another name`,
  );
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

const now = Date.now();
const id = mintScreenId();
const position = ((last?.position as number | undefined) ?? -1) + 1;

const { error: writeErr } = await sb.from("designs").insert({
  id,
  project_id: projectId,
  name: newName,
  state: { ...state, appSource },
  position,
  created_at: now,
  updated_at: now,
});
if (writeErr) throw writeErr;

// Read back and compare, so "duplicated" is verified rather than assumed.
const { data: copy, error: verifyErr } = await sb
  .from("designs")
  .select("id,name,position,state")
  .eq("id", id)
  .single();
if (verifyErr) throw verifyErr;

const copiedSource = (copy.state as Record<string, unknown>)
  ?.appSource as string;
const identical = copiedSource === appSource;
const carriedKeys = Object.keys((copy.state ?? {}) as object).sort();

console.log(
  [
    `duplicated "${source.name}" (${source.id}, position ${source.position})`,
    `        → "${copy.name}" (${copy.id}, position ${copy.position})`,
    `appSource: ${appSource.length} chars, byte-identical: ${identical ? "YES" : "NO — INVESTIGATE"}`,
    `state keys carried: ${carriedKeys.join(", ")}`,
    `active screen unchanged (reload Studio to see the copy)`,
  ].join("\n"),
);
if (!identical) process.exit(1);
