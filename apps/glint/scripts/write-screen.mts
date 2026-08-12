/**
 * Write a Studio SCREEN's raw JSX from a local file.
 *
 * The sibling of mirror-shared-component.mts, for designs rather than
 * shared_components. Same shape, same reasoning, same caveat.
 *
 * WHY, given save_screen exists and works. Because save_screen takes the
 * source as a TOOL ARGUMENT, so editing a 300-line screen means the whole
 * file round-trips through the model: read it, retype it, hope nothing was
 * dropped. For a targeted change to a big screen (move a block, reorder
 * some buttons) that transcription is the largest risk in the operation,
 * and it is a risk with no upside. This edits the file on disk with normal
 * tools and writes exactly those bytes.
 *
 * WHAT YOU GIVE UP. save_screen validates the JSX against the project's
 * component contracts before writing and refuses a bad prop with a precise
 * message. This does not. So:
 *
 *   ALWAYS RENDER THE SCREEN AFTERWARDS. A contract error will surface as
 *   "This screen hit a snag / the generated code couldn't run" instead of a
 *   refused save. That already happened once, on the USD wallet, when a
 *   screen called an Accounts helper that existed only in the app twin.
 *
 * PREFER save_screen when you are authoring a screen from scratch or
 * changing props: the validator earns its keep there. Prefer this when you
 * are moving existing, already-valid JSX around inside a large file.
 *
 * It uses the same optimistic-concurrency guard as the MCP path: pass the
 * updated_at you read, and the write is refused if anything changed under
 * you. Studio's canvas autosaves, so that guard is not theoretical.
 *
 * Dev-time only: reads the service-role key from apps/docs/.env.local.
 *
 * USAGE
 *   pnpm -F @gradeui/glint write:screen -- --id dmskex612bcy1 --name "New name" \
 *     --file /tmp/dashboard.jsx --expect 1786463799728
 *   ... --dry     look up the row and report, write nothing
 *
 * Omitting --expect writes unconditionally. Do not: it is how you silently
 * clobber a canvas autosave. Read the version first.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const id = arg("--id");
const file = arg("--file");
const expect = arg("--expect");
/* Optional rename. designs.name is the goto TARGET every screen links by,
   so renaming is a content change like any other and belongs on this path
   rather than in a separate tool. */
const rename = arg("--name");
const DRY = process.argv.includes("--dry");

if (!id || !file) {
  console.error("write-screen: need --id <designId> --file <path.jsx> [--expect <updated_at>]");
  process.exit(2);
}

/** Minimal .env.local reader, so this needs no dependency. */
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
  console.error("write-screen: no Supabase credentials.");
  process.exit(2);
}
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const source = readFileSync(file, "utf8");
if (!source.trim()) {
  console.error(`write-screen: ${file} is empty. Refusing.`);
  process.exit(2);
}
/* A screen must default-export a component named App: that is what every
   renderer mounts. Catching it here beats a blank preview. */
if (!/export default function App\b/.test(source)) {
  console.error(
    `write-screen: ${file} has no "export default function App".\n` +
      "Every renderer mounts App, so the screen would render nothing.",
  );
  process.exit(2);
}

const lookup = await fetch(
  `${url}/rest/v1/designs?project_id=eq.${PROJECT_ID}&id=eq.${encodeURIComponent(id)}` +
    "&select=id,name,updated_at,state",
  { headers },
);
if (!lookup.ok) {
  console.error(`write-screen: lookup failed: ${lookup.status} ${await lookup.text()}`);
  process.exit(1);
}
const found = (await lookup.json()) as {
  id: string;
  name: string;
  updated_at: number;
  state: Record<string, unknown>;
}[];
if (found.length !== 1) {
  console.error(`write-screen: expected one design ${id}, found ${found.length}.`);
  process.exit(1);
}
const [row] = found;
const before = String((row.state ?? {}).appSource ?? "");

console.log(
  `"${row.name}" (${row.id}): updated_at ${row.updated_at}, ` +
    `${before.length} chars -> ${source.length} chars`,
);
if (expect && String(row.updated_at) !== expect) {
  console.error(
    `write-screen: CONFLICT. Expected updated_at ${expect} but Studio holds ` +
      `${row.updated_at}. Something wrote to this screen (a canvas autosave?). ` +
      "Nothing written: re-dump, re-apply your edit, retry.",
  );
  process.exit(1);
}
if (DRY) {
  console.log("--dry: nothing written.");
  process.exit(0);
}

const now = Date.now();
/* Merge into the existing state: it carries tags and other keys that are
   nothing to do with the source, and replacing the object would drop them. */
const state = { ...(row.state ?? {}), appSource: source };
const patch: Record<string, unknown> = { state, updated_at: now };
if (rename) patch.name = rename;
let q =
  `${url}/rest/v1/designs?project_id=eq.${PROJECT_ID}&id=eq.${encodeURIComponent(id)}`;
if (expect) q += `&updated_at=eq.${expect}`;

const res = await fetch(q, {
  method: "PATCH",
  headers: { ...headers, Prefer: "return=representation" },
  body: JSON.stringify(patch),
});
if (!res.ok) {
  console.error(`write-screen: write failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const wrote = (await res.json()) as { updated_at: number }[];
if (wrote.length === 0) {
  console.error("write-screen: CONFLICT on write, nothing changed. Re-read and retry.");
  process.exit(1);
}

console.log(
  `Wrote "${row.name}"${rename ? ` (renamed to "${rename}")` : ""}, ` +
    `updated_at ${row.updated_at} -> ${wrote[0].updated_at}.\n` +
    "NOW RENDER IT: this path skips the contract validation save_screen does,\n" +
    "so a bad prop shows as a broken preview rather than a refused save.\n" +
    "Then re-promote with scripts/promote-screen.py, or check:promotions will\n" +
    "report the app copy stale, which it should.",
);
