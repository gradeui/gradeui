// What steering actually reaches the model, per project. Read-only.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/audit-project-rules.mts
//
// Reports each project's brief/dos/donts, its authored rules files, and
// any registry rules files switched off. Written after finding that this
// server ignored authored rules files entirely (they landed in the docs
// app on Jul 13 and were never threaded through here), so "which rules is
// this project actually generating under?" had no answer you could look up.
import { createClient } from "@supabase/supabase-js";
import { readProjectRules } from "@gradeui/studio/core";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");

const sb = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await sb
  .from("projects")
  .select("id, name, registry_id, context, dos, donts, rules_files, deleted_at")
  .is("deleted_at", null);
if (error) throw error;

for (const p of data ?? []) {
  const { disabledRuleIds, files } = readProjectRules(p.rules_files);
  const authored = Array.isArray(p.rules_files)
    ? (p.rules_files as { kind?: string }[]).filter((f) => f?.kind !== "registry")
    : [];
  const bits = [
    p.context?.trim() ? "brief" : null,
    p.dos?.length ? `${p.dos.length} do` : null,
    p.donts?.length ? `${p.donts.length} don't` : null,
  ].filter(Boolean);
  if (!bits.length && !authored.length && !disabledRuleIds.length) continue;
  console.log(`\n${p.name}  [${p.registry_id ?? "gradeui"}]  ${p.id}`);
  if (bits.length) console.log(`  steering: ${bits.join(", ")}`);
  if (disabledRuleIds.length)
    console.log(`  registry rules OFF: ${disabledRuleIds.join(", ")}`);
  for (const f of authored) {
    const g = f as { name?: string; content?: string; enabled?: boolean };
    const live = files.some((x) => x.name === g.name);
    const chars = (g.content ?? "").trim().length;
    console.log(
      `  rules file: ${g.name} (${chars} chars) — ${live ? "INJECTED (was silently dropped by MCP before this fix)" : g.enabled === false ? "switched off" : "not injected (.css or empty)"}`,
    );
  }
}
