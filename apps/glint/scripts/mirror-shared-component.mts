/**
 * Write one Studio SHARED COMPONENT's source from a local file.
 *
 * WHY THIS EXISTS. The normal way to edit a Studio shared component is the
 * `save_shared_component` MCP tool. On 11 Aug 2026 that tool's server
 * dropped its shared-component tools mid-session while the screen tools
 * kept working, which left six ported modules edited in the APP TWIN ONLY
 * and no way to mirror them up. Twin drift in that direction is how
 * /activity lost its shared table and /status confirmed the wrong company,
 * so "wait for the tooling" was not a safe answer.
 *
 * It PATCHes the same row, with the same columns and the same optimistic
 * concurrency guard, as apps/mcp-server/src/shared-components.ts does:
 *   update({ name, source, description, updated_at }) where id + project_id
 *   + updated_at match.
 * The database write is therefore identical. What it does NOT do is the
 * tool layer's pre-flight JSX contract validation, so:
 *
 *   ALWAYS RENDER THE COMPONENT AFTER WRITING, via a screen that uses it,
 *   before you call it done. A bad prop will not be refused here; it will
 *   surface as "the generated code couldn't run" in the preview. That is
 *   exactly how a first attempt at the USD wallet screen failed, by calling
 *   an Accounts helper that existed only in the app twin.
 *
 * It refuses any name outside the known twin list, so a typo cannot create
 * a stray component or overwrite something unrelated.
 *
 * Dev-time only: reads the service-role key from apps/docs/.env.local,
 * which never ships with this app.
 *
 * --create INSERTS a component that does not exist yet, which the missing
 * MCP tool would otherwise be the only way to do. It refuses if the name is
 * already live, so it can never silently overwrite an existing module, and it
 * mints the id exactly as apps/mcp-server does.
 *
 * USAGE
 *   pnpm -F @gradeui/glint mirror:component -- --name Market --file /tmp/market.jsx
 *   pnpm -F @gradeui/glint mirror:component -- --name Market --file /tmp/market.jsx --dry
 *   ... --name X --file /tmp/x.jsx --create --description "one line"
 *
 * AFTERWARDS
 *   1. Render a screen that uses it and LOOK at it.
 *   2. `pnpm -F @gradeui/glint check:twins --update` to record that this
 *      pair now agrees. Only after you have actually reconciled it.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";

/** The only names this will write. Mirrors the TWINS map in check-twins.mts. */
const ALLOWED = new Set([
  "Accounts",
  "AutoInvestToggle",
  "AccountDetails",
  "Persona",
  "Market",
  "FlowStore",
  "Wordmark",
  "MetalButton",
  "ActivityTable",
  "TradeFlow",
  "MetalPriceCard",
  "MetalWalletCard",
  "PhoneField",
  "AppChrome",
  "OnboardingLayout",
]);

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

const name = arg("--name");
const file = arg("--file");
const description = arg("--description");
const CREATE = process.argv.includes("--create");
const DRY = process.argv.includes("--dry");

if (!name || !file) {
  console.error(
    "mirror-shared-component: need --name <StudioComponentName> --file <path.jsx>",
  );
  process.exit(2);
}
if (!ALLOWED.has(name)) {
  console.error(
    `mirror-shared-component: "${name}" is not a known twin.\n` +
      `Known: ${[...ALLOWED].sort().join(", ")}\n` +
      "Add it to ALLOWED here and to TWINS in check-twins.mts if it is genuinely new.",
  );
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
const key =
  env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("mirror-shared-component: no Supabase credentials.");
  process.exit(2);
}
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const source = readFileSync(file, "utf8");
if (!source.trim()) {
  console.error(`mirror-shared-component: ${file} is empty. Refusing.`);
  process.exit(2);
}
/* A shared component must export a function of its own name: that is the
   contract "@project/components" resolves against. Catching it here beats
   discovering it as a blank preview. */
if (!new RegExp(`export function ${name}\\b`).test(source)) {
  console.error(
    `mirror-shared-component: ${file} has no "export function ${name}".\n` +
      'That export name is the contract "@project/components" resolves, so the\n' +
      "import would return undefined and the screen would render nothing.",
  );
  process.exit(2);
}

const lookup = await fetch(
  `${url}/rest/v1/shared_components?project_id=eq.${PROJECT_ID}` +
    `&name=eq.${encodeURIComponent(name)}&deleted_at=is.null` +
    "&select=id,name,description,updated_at",
  { headers },
);
if (!lookup.ok) {
  console.error(`mirror-shared-component: lookup failed: ${lookup.status} ${await lookup.text()}`);
  process.exit(1);
}
const found = (await lookup.json()) as {
  id: string;
  description: string | null;
  updated_at: number;
}[];
if (CREATE) {
  /* Refuse if it is already there: --create must never become a way to
     overwrite a module by accident. Drop the flag to update one. */
  if (found.length > 0) {
    console.error(
      `mirror-shared-component: "${name}" already exists (id ${found[0].id}). ` +
        "Drop --create to update it.",
    );
    process.exit(1);
  }
  /* Same id shape apps/mcp-server/src/shared-components.ts mints. */
  const newId =
    "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const at = Date.now();
  console.log(`${name}: creating id ${newId}, ${source.length} chars`);
  if (DRY) {
    console.log("--dry: nothing written.");
    process.exit(0);
  }
  const ins = await fetch(`${url}/rest/v1/shared_components`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({
      id: newId,
      project_id: PROJECT_ID,
      name,
      source,
      description: description ?? null,
      created_at: at,
      updated_at: at,
    }),
  });
  if (!ins.ok) {
    console.error(
      `mirror-shared-component: create failed: ${ins.status} ${await ins.text()}`,
    );
    process.exit(1);
  }
  console.log(
    `Created ${name} (${newId}), updated_at ${at}.\n` +
      "NOW: add it to TWINS in check-twins.mts and COMPONENT_MODULES in\n" +
      "promote-screen.py, write the app twin, then render a screen using it.",
  );
  process.exit(0);
}
if (found.length !== 1) {
  console.error(
    `mirror-shared-component: expected exactly one live "${name}", found ${found.length}.`,
  );
  process.exit(1);
}
const [row] = found;

console.log(
  `${name}: id ${row.id}, current updated_at ${row.updated_at}, ` +
    `${source.length} chars to write`,
);
if (DRY) {
  console.log("--dry: nothing written.");
  process.exit(0);
}

const now = Date.now();
const res = await fetch(
  `${url}/rest/v1/shared_components?project_id=eq.${PROJECT_ID}` +
    `&id=eq.${encodeURIComponent(row.id)}` +
    `&updated_at=eq.${row.updated_at}`,
  {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ source, updated_at: now }),
  },
);
if (!res.ok) {
  console.error(`mirror-shared-component: write failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const wrote = (await res.json()) as { id: string; updated_at: number }[];
if (wrote.length === 0) {
  console.error(
    `mirror-shared-component: CONFLICT. "${name}" changed under us ` +
      `(expected updated_at ${row.updated_at}). Nothing written. Re-read and retry.`,
  );
  process.exit(1);
}

console.log(
  `Wrote ${name} (${row.id}), updated_at ${row.updated_at} -> ${wrote[0].updated_at}.\n` +
    "NOW RENDER IT. This path skips the MCP contract validation, so a bad prop\n" +
    "shows up as a broken preview rather than a refused save. Then run\n" +
    "`pnpm -F @gradeui/glint check:twins --update` to record the pair as agreed.",
);
