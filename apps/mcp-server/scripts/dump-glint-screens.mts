// One-shot: dump every screen's raw JSX (designs.state.appSource) for the
// Glint project to disk so the port can transform files instead of
// copy-pasting tool output. Service-role read, no writes.
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT = process.env.OUT_DIR;
if (!url || !key || !OUT) throw new Error("missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / OUT_DIR");

const PROJECT = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await supabase
  .from("designs")
  .select("id,name,position,updated_at,state")
  .eq("project_id", PROJECT)
  .order("position");
if (error) throw error;

mkdirSync(OUT, { recursive: true });
const manifest: Array<Record<string, unknown>> = [];
for (const row of data ?? []) {
  const state = (row.state ?? {}) as Record<string, unknown>;
  const src = typeof state.appSource === "string" ? state.appSource : "";
  const file = `${String(row.name).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()}.jsx`;
  writeFileSync(join(OUT, file), src);
  manifest.push({
    id: row.id,
    name: row.name,
    position: row.position,
    updatedAt: row.updated_at,
    tags: state.tags ?? null,
    chars: src.length,
    file,
  });
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
for (const m of manifest) {
  console.log(`${m.id}  ${String(m.chars).padStart(6)}  ${m.name}  tags=${JSON.stringify(m.tags)}`);
}
