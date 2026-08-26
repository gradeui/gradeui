// Soft-delete a screen — the CLI sibling of the Studio rail's delete.
// Sets designs.deleted_at to Date.now() (epoch ms, NOT a timestamp
// string — the column is bigint), scoped by project_id as well as id,
// matching supabase-adapter.ts's deleteDesign(). Reversible: clearing
// deleted_at brings the row back with its revisions and messages
// intact. There is no delete tool on the MCP server, so this is how a
// scratch screen gets binned without opening Studio.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/soft-delete.mts <projectId> <screenId>
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("missing supabase env");

const [projectId, screenId] = process.argv.slice(2);
if (!projectId || !screenId) throw new Error("usage: soft-delete.mts <projectId> <screenId>");

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: before, error: e0 } = await sb
  .from("designs")
  .select("id,name,position,deleted_at")
  .eq("project_id", projectId)
  .eq("id", screenId)
  .maybeSingle();
if (e0) throw e0;
if (!before) throw new Error(`no screen ${screenId} in project ${projectId}`);
console.log("target:", before);

const { error } = await sb
  .from("designs")
  .update({ deleted_at: Date.now() })
  .eq("project_id", projectId)
  .eq("id", screenId);
if (error) throw error;
console.log(`soft-deleted "${before.name}" (${screenId})`);
