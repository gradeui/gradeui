/**
 * Read a Studio SCREEN's raw JSX to a file (or stdout).
 *
 * The read half of write-screen.mts, and the last corner of the set:
 * read/write for components existed, write for screens existed, and
 * getting a screen's source out meant round-tripping it through a tool
 * result and retyping it. Promotion needs the exact bytes Studio holds,
 * because the drift guard hashes them, so retyping is the one thing that
 * cannot be allowed to happen here.
 *
 * Prints the updated_at, which is what `promote-screen.py --version`
 * wants and what write-screen.mts wants for its concurrency guard.
 *
 * Dev-time only: reads the service-role key from apps/docs/.env.local.
 *
 * USAGE
 *   pnpm -F @gradeui/glint read:screen -- --id dmsp02q871y5u --out /tmp/x.jsx
 *   pnpm -F @gradeui/glint read:screen -- --id dmsp02q871y5u          (stdout)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const id = arg("--id");
const out = arg("--out");
if (!id) {
  console.error("read-screen: need --id <designId> [--out <path>]");
  process.exit(2);
}

/** Minimal .env.local reader, so this needs no dependency. */
function loadEnv(path: string): Record<string, string> {
  const res: Record<string, string> = {};
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return res;
  }
  for (const line of raw.split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (m) res[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return res;
}

const env = loadEnv(join(here, "../../docs/.env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("read-screen: no Supabase credentials.");
  process.exit(2);
}

const res = await fetch(
  `${url}/rest/v1/designs?project_id=eq.${PROJECT_ID}&id=eq.${encodeURIComponent(id)}` +
    "&select=id,name,updated_at,state",
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
if (!res.ok) {
  console.error(`read-screen: query failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const rows = (await res.json()) as {
  id: string;
  name: string;
  updated_at: number;
  state: Record<string, unknown>;
}[];
if (rows.length !== 1) {
  console.error(`read-screen: expected one design ${id}, found ${rows.length}.`);
  process.exit(1);
}
const [row] = rows;
const source = String((row.state ?? {}).appSource ?? "");
if (!source.trim()) {
  console.error(`read-screen: "${row.name}" has no appSource.`);
  process.exit(1);
}

if (out) {
  writeFileSync(out, source);
  console.error(
    `"${row.name}" (${row.id}): updated_at ${row.updated_at}, ` +
      `${source.length} chars -> ${out}\n` +
      `Promote with: --version ${row.updated_at}`,
  );
} else {
  process.stdout.write(source);
}
