/**
 * The TWIN drift guard: which side of a ported module moved.
 *
 * WHY THIS EXISTS. Every shared module in this demo exists TWICE: a Studio
 * shared component (plain JSX, the drafting copy) and a hand-ported twin in
 * this app (TypeScript). Editing one does not touch the other. The rule is
 * STUDIO FIRST, THEN PORT, and on 11 Aug 2026 that rule was broken in both
 * directions on the same day:
 *
 *   - Studio's `Market` never got the four chart ranges, so its Gold and
 *     Silver wallet screens called `Market.RANGES.map(...)` against a
 *     module with no RANGES and threw on render.
 *   - Studio's `Activity — history` screen still inlined the whole table
 *     after the app had been refactored onto the shared ActivityTable, so
 *     re-promoting that screen REVERTED the app by 275 lines.
 *   - Studio's application-status screen still hard-coded "Aurora Bullion
 *     LLC", so re-promoting it made the app confirm the wrong company on a
 *     customer-facing screen.
 *
 * `check-promotions.mts` could not see any of that: it guards SCREENS. The
 * ported modules had no guard at all, which is why the drift was invisible
 * rather than merely unfixed.
 *
 * WHY IT DOES NOT COMPARE THE TWO COPIES. It cannot. One is plain JSX
 * reading helpers off statics namespaces, the other is TypeScript with
 * named imports and type annotations. There is no hash that is equal for
 * both when they agree, so a direct comparison is impossible.
 *
 * WHAT IT DOES INSTEAD. It records a PAIR of hashes at the moment the two
 * were last reconciled, then re-hashes each side independently. That does
 * not tell you whether they agree, but it tells you the thing that actually
 * matters, WHICH SIDE MOVED SINCE THEY LAST AGREED:
 *
 *   both unchanged   -> in sync, nothing to do
 *   Studio moved     -> Studio is ahead. Port it down.
 *   twin moved       -> the app is ahead. Mirror it up to Studio, or the
 *                       next port of that module silently reverts it.
 *   both moved       -> they diverged independently. Needs a human to
 *                       reconcile; no script can pick a winner.
 *
 * READS SUPABASE over its REST endpoint with the service-role key, the
 * same way check-promotions.mts does. No @supabase/supabase-js dependency:
 * this app does not carry one, and a guard is not worth a dependency. It
 * also does NOT depend on the Studio MCP tools being connected. That matters: the session this was written in had
 * lost the shared-component MCP tools, and a guard that only works when
 * the tooling is healthy is not a guard.
 *
 * Dev-time only. The service-role key never ships with this app.
 *
 * USAGE
 *   pnpm -F @gradeui/glint check:twins            report, non-zero on drift
 *   pnpm -F @gradeui/glint check:twins --warn     report, always zero
 *   pnpm -F @gradeui/glint check:twins --update   re-baseline after you
 *                                                 have RECONCILED a pair
 *   ... --update --only Market,TradeFlow           baseline just those
 *
 * --update RECORDS AGREEMENT, IT DOES NOT CREATE IT. Running it on a
 * drifted pair just tells the guard "these two are fine now", which is a
 * lie if you have not actually made them match. Reconcile first.
 *
 * WHICH IS WHY --only EXISTS. A bare --update baselines EVERY pair, and on
 * first run that is almost always wrong: you have reconciled some of them,
 * not all. Baselining the rest would bless drift you have not looked at and
 * the guard would then report green forever. Pass --only with the pairs you
 * have actually reconciled, and leave the others reading "no baseline",
 * which is honest: unguarded, not agreed.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";
const BASELINE = join(here, "twins.baseline.json");
const APP_ROOT = join(here, "..");

const WARN_ONLY = process.argv.includes("--warn");
const UPDATE = process.argv.includes("--update");
/** Restrict --update to named pairs. See the --only note in the header. */
const ONLY = (() => {
  const i = process.argv.indexOf("--only");
  if (i === -1) return null;
  const raw = process.argv[i + 1];
  if (!raw) {
    console.error("check-twins: --only needs a comma-separated list of names.");
    process.exit(2);
  }
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
})();

/**
 * Studio shared-component NAME -> the app file holding its ported twin.
 *
 * Keyed on the name, not the component id: ids are opaque and a rename in
 * Studio should surface here as "no such component" rather than silently
 * passing against a stale id.
 *
 * Keep this in step with COMPONENT_MODULES in promote-screen.py, which maps
 * the same names to their import specifiers. A module that appears there
 * and not here is a module with no drift guard.
 */
const TWINS: Record<string, string> = {
  Accounts: "lib/accounts.ts",
  Persona: "lib/persona.ts",
  Market: "lib/market.ts",
  FlowStore: "lib/flow-store.ts",
  Wordmark: "components/wordmark.tsx",
  MetalButton: "components/metal-button.tsx",
  ActivityTable: "components/activity-table.tsx",
  TradeFlow: "components/trade-flow.tsx",
  MetalPriceCard: "components/metal-price-card.tsx",
  MetalWalletCard: "components/metal-wallet-card.tsx",
  PhoneField: "components/phone-field.tsx",
  AppChrome: "components/layouts/app-chrome.tsx",
  OnboardingLayout: "components/layouts/onboarding.tsx",
};

/**
 * Deliberately unguarded, with the reason, so an empty slot never looks
 * like an oversight.
 *
 * BuyFlow: superseded by TradeFlow and has no app twin at all. It is dead
 * in Studio too (no screen imports it). Guarding it would report permanent
 * drift against a file that should not exist.
 */
const NO_TWIN = new Set(["BuyFlow"]);

/**
 * The comparable shape of one side's source.
 *
 * Studio's canvas stamps `data-gds-source-id="N"` attributes in and an MCP
 * save strips them, and neither changes a pixel, so they go. Whitespace
 * runs collapse so reformatting is not a change. Nothing else is
 * normalised: a comment edit IS a change, because a comment that no longer
 * matches its code is exactly the kind of rot this is meant to catch.
 */
function signature(src: string): string {
  const normalised = src
    .replace(/\s*data-gds-source-id="\d+"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalised).digest("hex").slice(0, 12);
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
  console.error(
    "check-twins: no Supabase credentials. Expected NEXT_PUBLIC_SUPABASE_URL and\n" +
      "SUPABASE_SERVICE_ROLE_KEY in apps/docs/.env.local or the environment.",
  );
  process.exit(2);
}

type Baseline = Record<string, { studio: string; twin: string; reconciled: string }>;
const baseline: Baseline = existsSync(BASELINE)
  ? (JSON.parse(readFileSync(BASELINE, "utf8")) as Baseline)
  : {};

type ComponentRow = { id: string; name: string; source: string | null };

const res = await fetch(
  `${url}/rest/v1/shared_components?project_id=eq.${PROJECT_ID}` +
    `&deleted_at=is.null&select=id,name,source&order=name`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
if (!res.ok) {
  console.error(
    `check-twins: query failed: ${res.status} ${await res.text()}`,
  );
  process.exit(WARN_ONLY ? 0 : 1);
}

const live = new Map(
  (((await res.json()) as ComponentRow[]) ?? []).map((r) => [
    r.name,
    { id: r.id, source: r.source ?? "" },
  ]),
);

type Verdict =
  | "in-sync"
  | "studio-ahead"
  | "app-ahead"
  | "both-moved"
  | "no-baseline"
  | "no-studio"
  | "no-twin";

const rows: string[] = [];
const next: Baseline = { ...baseline };
let drift = 0;
let unguarded = 0;

for (const [name, rel] of Object.entries(TWINS)) {
  const studio = live.get(name);
  const twinPath = join(APP_ROOT, rel);
  const pad = name.padEnd(17);

  if (!studio) {
    rows.push(`  ?  ${pad} no shared component named this in Studio`);
    drift++;
    continue;
  }
  if (!existsSync(twinPath)) {
    rows.push(`  !  ${pad} no twin at ${rel}`);
    drift++;
    continue;
  }

  const studioHash = signature(studio.source);
  const twinHash = signature(readFileSync(twinPath, "utf8"));
  const base = baseline[name];

  let verdict: Verdict;
  if (!base) verdict = "no-baseline";
  else if (base.studio === studioHash && base.twin === twinHash)
    verdict = "in-sync";
  else if (base.studio !== studioHash && base.twin !== twinHash)
    verdict = "both-moved";
  else if (base.studio !== studioHash) verdict = "studio-ahead";
  else verdict = "app-ahead";

  switch (verdict) {
    case "in-sync":
      rows.push(`  ✓  ${pad} in sync`);
      break;
    case "no-baseline":
      rows.push(`  ·  ${pad} no baseline recorded (reconcile, then --update)`);
      unguarded++;
      break;
    case "studio-ahead":
      rows.push(
        `  ↓  ${pad} STUDIO AHEAD: port ${rel} down from Studio (${base!.studio} → ${studioHash})`,
      );
      drift++;
      break;
    case "app-ahead":
      rows.push(
        `  ↑  ${pad} APP AHEAD: mirror ${rel} up to Studio (${base!.twin} → ${twinHash})`,
      );
      drift++;
      break;
    case "both-moved":
      rows.push(
        `  ✗  ${pad} BOTH MOVED since they last agreed: reconcile by hand`,
      );
      drift++;
      break;
  }

  if (UPDATE && (!ONLY || ONLY.has(name))) {
    next[name] = {
      studio: studioHash,
      twin: twinHash,
      reconciled: new Date().toISOString(),
    };
  }
}

for (const name of live.keys()) {
  if (!TWINS[name] && !NO_TWIN.has(name)) {
    rows.push(`  ·  ${name.padEnd(17)} in Studio but not in the TWINS map`);
    unguarded++;
  }
}

console.log(
  `\ncheck-twins — ${Object.keys(TWINS).length} ported modules against Studio project ${PROJECT_ID}\n`,
);
console.log(rows.join("\n"));
console.log(`
Legend
  ✓  in sync: neither side has moved since they last agreed.
  ↓  Studio ahead: Studio was edited and the twin was not. Port it down.
  ↑  app ahead: the twin was edited and Studio was not. Mirror it up, or
     the next port of this module silently reverts the app. This is how
     /activity lost its shared table and /status confirmed the wrong
     company on 11 Aug 2026.
  ✗  both moved: they diverged independently. No script can pick a winner.
  ·  unguarded: no baseline, or a Studio component missing from TWINS.
  ?  named in TWINS but no such component in Studio (renamed? deleted?).
  !  named in TWINS but the twin file is missing.

This compares each side against ITS OWN last-reconciled state, not against
the other: one copy is plain JSX and one is TypeScript, so no hash is equal
for both when they agree. It answers "which side moved", not "do they match".`);

if (UPDATE) {
  const unknown = ONLY ? [...ONLY].filter((n) => !TWINS[n]) : [];
  if (unknown.length) {
    console.error(
      `\ncheck-twins: --only names no such twin: ${unknown.join(", ")}. Nothing written.`,
    );
    process.exit(2);
  }
  writeFileSync(BASELINE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    `\nBaselined ${Object.keys(next).length} pair(s) in scripts/twins.baseline.json` +
      (ONLY ? ` (--only ${[...ONLY].join(", ")})` : "") +
      "." +
      `\nThat records AGREEMENT. It does not create it: if a pair was drifted and` +
      `\nyou did not reconcile it first, you have just hidden the drift.`,
  );
}

/* Report the three states separately. An UNGUARDED pair is not "in sync":
   nobody has ever recorded that those two agree, so the guard has no opinion
   on it. Rolling them into a single "all in sync" line is how a guard starts
   getting believed when it should not be. */
const total = Object.keys(TWINS).length;
const inSync = total - drift - unguarded;
const parts = [`${inSync} in sync`];
if (drift) parts.push(`${drift} drifted`);
if (unguarded) parts.push(`${unguarded} unguarded, never reconciled`);
console.log(`\n${parts.join(", ")}, of ${total} ported modules.`);
if (unguarded && !drift) {
  console.log(
    "Unguarded is not a pass: it means no baseline exists for that pair.\n" +
      "Reconcile each one, then `--update --only <Name>` to record it.",
  );
}
if (drift && !WARN_ONLY) process.exit(1);
