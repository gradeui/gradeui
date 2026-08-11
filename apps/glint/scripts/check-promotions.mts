/**
 * check-promotions — has any Studio screen moved on since it was promoted?
 *
 * WHY THIS EXISTS (11 Aug 2026): Studio and this app hold two copies of
 * every screen, and nothing linked them. A screen edited in Studio after
 * promotion silently orphans the app copy, and the only symptom is
 * "these look different" days later — which is exactly how the wallets
 * card chevron ended up a ghost button here and an outline circle in
 * Studio, three and a half hours apart.
 *
 * WHY NOT TIMESTAMPS: `promotedAt` records designs.updated_at, but any
 * metadata write (a tag script, a Studio open-and-save) bumps that
 * column without touching a pixel. Comparing timestamps flagged 13 of 14
 * screens as stale when only ONE had actually changed. So the check
 * hashes the SOURCE instead, and the timestamp is advisory only.
 *
 * WHAT IS NORMALISED AWAY before hashing:
 *   - `data-gds-source-id="N"` — Studio's selection protocol stamps these
 *     into the stored source on a canvas save, and strips them on an MCP
 *     save. They are render-identical, so hashing them raw would flag
 *     every canvas interaction.
 *   - whitespace, so reformatting is not a change.
 * Everything else counts, deliberately: this should be sensitive.
 *
 *   pnpm -F @gradeui/glint check:promotions            # exits 1 if drifted
 *   pnpm -F @gradeui/glint check:promotions --warn     # always exits 0
 *   pnpm -F @gradeui/glint check:promotions --update   # re-baseline after promoting
 *
 * Read-only against Supabase (except --update, which rewrites
 * lib/screens.ts locally). Dev-time only: it reads the service-role key
 * from apps/docs/.env.local, which never ships with this app.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCREENS } from "../lib/screens";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";
const WARN_ONLY = process.argv.includes("--warn");
const UPDATE = process.argv.includes("--update");
const REGISTRY = join(here, "../lib/screens.ts");

/** The comparable shape of a screen — see the note above. */
export function sourceSignature(appSource: string): string {
  const normalised = appSource
    .replace(/\s*data-gds-source-id="\d+"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalised).digest("hex").slice(0, 12);
}

/** Minimal .env.local reader — no dependency for a dev-time script. */
function loadEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return out;
  }
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = loadEnv(join(here, "../../docs/.env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "check-promotions: no Supabase credentials (looked in apps/docs/.env.local for\n" +
      "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).",
  );
  process.exit(WARN_ONLY ? 0 : 1);
}

type DesignRow = { id: string; name: string; updated_at: number; state: { appSource?: string } };

const res = await fetch(
  `${url}/rest/v1/designs?project_id=eq.${PROJECT_ID}&select=id,name,updated_at,state`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
if (!res.ok) {
  console.error(`check-promotions: query failed — ${res.status} ${await res.text()}`);
  process.exit(WARN_ONLY ? 0 : 1);
}
const live = new Map((((await res.json()) as DesignRow[]) ?? []).map((r) => [r.id, r]));

const drifted: { slug: string; id: string; hash: string; updatedAt: number }[] = [];
const missing: string[] = [];
const rows: string[] = [];

for (const s of SCREENS) {
  const row = live.get(s.id);
  if (!row) {
    missing.push(`${s.slug} (${s.id})`);
    rows.push(`  ?  ${s.slug.padEnd(24)} ${s.name} — no such design in Studio`);
    continue;
  }
  const hash = sourceSignature(row.state?.appSource ?? "");
  if (!s.sourceHash) {
    drifted.push({ slug: s.slug, id: s.id, hash, updatedAt: row.updated_at });
    rows.push(`  ·  ${s.slug.padEnd(24)} ${s.name} — no baseline recorded (run --update)`);
  } else if (s.sourceHash !== hash) {
    drifted.push({ slug: s.slug, id: s.id, hash, updatedAt: row.updated_at });
    rows.push(`  ✗  ${s.slug.padEnd(24)} ${s.name} — Studio changed (${s.sourceHash} → ${hash})`);
  } else {
    rows.push(`  ✓  ${s.slug.padEnd(24)} ${s.name}`);
  }
}

console.log(`\ncheck-promotions — ${SCREENS.length} screens against Studio project ${PROJECT_ID}\n`);
console.log(rows.join("\n"));

if (UPDATE && drifted.length) {
  let src = readFileSync(REGISTRY, "utf8");
  for (const d of drifted) {
    const entry = new RegExp(`(id:\\s*"${d.id}",[\\s\\S]{0,200}?)(\\n(\\s*)sourceHash:\\s*"[^"]*",)?(\\n\\s*\\},)`);
    src = src.replace(entry, (_m, head, _existing, _indent, tail) => {
      const pad = /\n(\s*)promotedAt:/.exec(head)?.[1] ?? "    ";
      return `${head}\n${pad}sourceHash: "${d.hash}",${tail}`;
    });
  }
  writeFileSync(REGISTRY, src);
  console.log(`\nBaselined ${drifted.length} screen(s) in lib/screens.ts.\n`);
  process.exit(0);
}

if (!drifted.length && !missing.length) {
  console.log(`\nAll ${SCREENS.length} screens match the source they were promoted from.\n`);
  process.exit(0);
}

console.log(
  `\n${drifted.length} changed in Studio, ${missing.length} missing.\n` +
    `Re-promote with scripts/promote-screen.py, then run --update to re-baseline.\n`,
);
process.exit(WARN_ONLY ? 0 : 1);
