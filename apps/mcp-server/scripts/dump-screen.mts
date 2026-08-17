// Dump one screen's raw JSX (designs.state.appSource) to a file, so tools
// and subagents can read it from disk instead of round-tripping it through
// a model context. Service-role read, no writes.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/dump-screen.mts <projectId> <screenId> <outFile>
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const [projectId, screenId, outFile] = process.argv.slice(2);
if (!projectId || !screenId || !outFile) {
  throw new Error("usage: dump-screen.mts <projectId> <screenId> <outFile>");
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await sb
  .from("designs")
  .select("id,name,position,state")
  .eq("project_id", projectId)
  .eq("id", screenId)
  .is("deleted_at", null)
  .maybeSingle();
if (error) throw error;
if (!data) throw new Error(`no live screen "${screenId}" in project ${projectId}`);

const state = (data.state ?? {}) as Record<string, unknown>;
const src = typeof state.appSource === "string" ? state.appSource : "";
if (!src) throw new Error(`screen "${data.name}" has no state.appSource`);

writeFileSync(outFile, src);
console.log(
  `"${data.name}" (${data.id}, position ${data.position}) → ${outFile}  [${src.length} chars, ${src.split("\n").length} lines]`,
);
