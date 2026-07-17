// goto-by-id.mjs — flip every by-NAME goto to "screen:<id>" (18 Jul).
// Ids survive renames (a name-keyed link broke the day Local Search
// Grid was renamed); names remain a resolver fallback for hand
// authoring, but persisted wiring is ids. Patches THREE stamp shapes
// in designs.state.appSource, only when the value is a known screen
// name in this project:
//   goto: "Name"            (crumbs, navLinks objects in source)
//   goto="Name"             (JSX props — LocationCard, HubStatCard)
//   data-grade-goto="Name"  (raw stamps)
// Idempotent: screen:<id> values don't match any screen name, so a
// second run is a no-op. Dry-run by default; --write to patch.
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.env.GRADEUI_ROOT ?? "/sessions/bold-optimistic-fermat/mnt/gradeui";
const PROJECT = "47e40175-0d55-4d21-960b-26bdf6b01282";
const WRITE = process.argv.includes("--write");

let url, key;
for (const line of readFileSync(path.join(ROOT, "apps/docs/.env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  const v = m[2].replace(/^["']|["']$/g, "");
  if (m[1] === "NEXT_PUBLIC_SUPABASE_URL" || m[1] === "SUPABASE_URL") url = url ?? v;
  if (m[1] === "SUPABASE_SERVICE_ROLE_KEY") key = v;
}
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const rest = (p) => url.replace(/\/$/, "") + "/rest/v1" + p;

const rows = await (
  await fetch(rest(`/designs?project_id=eq.${PROJECT}&select=id,name,state,updated_at`), { headers: H })
).json();

// Every screen name in the project → its id. Names are unique here;
// bail loudly if that ever stops being true (ambiguous rewiring).
const byName = new Map();
for (const r of rows) {
  if (byName.has(r.name)) {
    console.error(`ABORT: duplicate screen name "${r.name}" — rewiring would be ambiguous`);
    process.exit(1);
  }
  byName.set(r.name, r.id);
}

const STAMPS = [
  /(goto:\s*")([^"]+)(")/g, // object syntax (crumbs, navLinks)
  /(goto=")([^"]+)(")/g, // JSX prop (also matches data-grade-goto=")
];

let patched = 0;
for (const row of rows) {
  const src = row.state?.appSource;
  if (typeof src !== "string") continue;
  const hits = [];
  let next = src;
  for (const re of STAMPS) {
    next = next.replace(re, (whole, pre, val, post) => {
      const id = byName.get(val);
      if (!id) return whole; // already screen:<id>, or not a screen name
      hits.push(`${val} → screen:${id}`);
      return `${pre}screen:${id}${post}`;
    });
  }
  if (next === src) continue;
  patched++;
  console.log(`${WRITE ? "PATCH" : "would patch"}: ${row.name}`);
  for (const h of [...new Set(hits)]) console.log(`  ${h}`);
  if (!WRITE) continue;
  const res = await fetch(rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`), {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ state: { ...row.state, appSource: next }, updated_at: Date.now() }),
  });
  const body = await res.json();
  if (!(res.ok && body.length)) console.error(`  FAILED: ${JSON.stringify(body).slice(0, 120)}`);
}
console.log(`${WRITE ? "patched" : "would patch"} ${patched} screen(s). ${WRITE ? "" : "Run with --write to apply."}`);
