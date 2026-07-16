#!/usr/bin/env node
/**
 * rename-nav-ids-supabase.mjs — one-off DB half of the nav-id rename
 * (repo half landed in 7928474). Model: scripts/rename-rds-to-gds.py —
 * single sweep, no migration, script documents every pattern it touched.
 *
 * Rewrites `designs.state.appSource` for the "Brightlocal Vision - Share"
 * project: activeId / navLinks / dataHook tokens from cryptic prefixes to
 * full words (rk-* → rankings-*, lp-* → location-profile-*,
 * lsg-* → local-search-grid-*, cit-* → citations-*, ai sub-items →
 * ai-insights-*, hub-lsg-* → hub-local-search-grid-*).
 *
 * PRESERVES the rest of the `state` jsonb (tags, status, kind, …) —
 * unlike mcp-server saveScreen, which currently replaces state wholesale
 * (known gap, queued).
 *
 * Usage (from repo root):
 *   node scripts/rename-nav-ids-supabase.mjs           # dry run — prints per-screen diff counts
 *   node scripts/rename-nav-ids-supabase.mjs --write   # persist, optimistic-concurrency guarded
 *
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
 * Falls back to reading apps/docs/.env.local.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PROJECT_ID = "47e40175-0d55-4d21-960b-26bdf6b01282"; // Brightlocal Vision - Share
const WRITE = process.argv.includes("--write");

// ── the map (word-boundary; order matters only for the lsg-kw pair) ──
const RENAMES = [
  ["rk-keywords", "rankings-keyword-groups"],
  ["rk-positions", "rankings-positions"],
  ["rk-table", "rankings-table"],
  ["rk-competitors", "rankings-competitors"],
  ["rk-settings", "rankings-settings"],
  ["rk-general", "rankings-general"],
  ["rk-search", "rankings-search"],
  ["rk-advanced", "rankings-advanced"],
  ["rk-alerts", "rankings-alerts"],
  ["lp-cb-data", "location-profile-citation-builder-data"],
  ["lp-connect", "location-profile-connect"],
  ["lp-core", "location-profile-core"],
  ["lp-general", "location-profile-general"],
  ["lp-business", "location-profile-business"],
  ["lp-gbt", "location-profile-google-business-tracking"],
  ["lp-categories", "location-profile-categories"],
  ["lp-hours", "location-profile-hours"],
  ["lp-about", "location-profile-about"],
  ["lp-additional", "location-profile-additional"],
  ["lp-images", "location-profile-images"],
  ["lp-alerts", "location-profile-alerts"],
  ["lsg-add", "local-search-grid-add"],
  ["lsg-settings", "local-search-grid-settings"],
  ["cit-live", "citations-live"],
  ["cit-pending", "citations-pending"],
  ["cit-competitor", "citations-competitor"],
  ["cit-builder", "citations-builder"],
  ["ai-website-content", "ai-insights-website-content"],
  ["ai-gbp", "ai-insights-google-business-profile"],
  ["ai-reviews", "ai-insights-reviews"],
  ["ai-citations", "ai-insights-citations"],
  ["ai-export", "ai-insights-export"],
  ["hub-lsg-cta", "hub-local-search-grid-cta"],
  ["hub-lsg-card", "hub-local-search-grid-card"],
  // dataHooks found in live screens only (post-sweep audit of every
  // \b(rk|lp|cit|lsg)-* token across the project)
  ["rk-sidebar", "rankings-sidebar"],
  ["rk-page-body", "rankings-page-body"],
  ["rk-page-header", "rankings-page-header"],
  ["rk-app-layout", "rankings-app-layout"],
  ["lsg-sidebar-provider", "local-search-grid-sidebar-provider"],
  ["lsg-sidebar", "local-search-grid-sidebar"],
  ["lsg-page-header", "local-search-grid-page-header"],
  ["lsg-app-layout", "local-search-grid-app-layout"],
  ["lsg-page-body", "local-search-grid-page-body"],
];

function applyMap(src) {
  const counts = {};
  let out = src;
  // prefix forms first: lsg-kw-<anything> (incl. `lsg-kw-${i}`), then lsg-kw<digit>
  out = out.replace(/\blsg-kw-/g, () => ((counts["lsg-kw-*"] = (counts["lsg-kw-*"] ?? 0) + 1), "local-search-grid-keyword-"));
  out = out.replace(/\blsg-kw(\d)/g, (_, d) => ((counts["lsg-kw<n>"] = (counts["lsg-kw<n>"] ?? 0) + 1), `local-search-grid-keyword-${d}`));
  for (const [from, to] of RENAMES) {
    const re = new RegExp(`\\b${from.replace(/[-]/g, "\\-")}\\b`, "g");
    out = out.replace(re, () => ((counts[from] = (counts[from] ?? 0) + 1), to));
  }
  return { out, counts };
}

// ── env ──
function loadEnv() {
  let url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.join(here, "..", "apps", "docs", ".env.local");
    try {
      for (const line of readFileSync(envPath, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const v = m[2].replace(/^["']|["']$/g, "");
        if (!url && (m[1] === "SUPABASE_URL" || m[1] === "NEXT_PUBLIC_SUPABASE_URL")) url = v;
        if (!key && m[1] === "SUPABASE_SERVICE_ROLE_KEY") key = v;
      }
    } catch {
      /* fall through to the throw below */
    }
  }
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env or apps/docs/.env.local)",
    );
  }
  return { url, key };
}

const { url, key } = loadEnv();
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const rest = (p) => `${url.replace(/\/$/, "")}/rest/v1${p}`;

const res = await fetch(
  rest(
    `/designs?project_id=eq.${PROJECT_ID}&select=id,name,state,updated_at&order=position.asc`,
  ),
  { headers },
);
if (!res.ok) throw new Error(`fetch designs: ${res.status} ${await res.text()}`);
const rows = await res.json();
console.log(`${rows.length} screen(s) in project ${PROJECT_ID}\n`);

let touched = 0;
for (const row of rows) {
  const src = row.state?.appSource;
  if (typeof src !== "string") {
    console.log(`- ${row.name} (${row.id}): no appSource — skipped`);
    continue;
  }
  const { out, counts } = applyMap(src);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.log(`- ${row.name} (${row.id}): clean, nothing to do`);
    continue;
  }
  touched++;
  console.log(`- ${row.name} (${row.id}): ${total} replacement(s)`);
  for (const [k, n] of Object.entries(counts)) console.log(`    ${k} ×${n}`);

  if (WRITE) {
    // Patch appSource ONLY; carry the rest of state (tags etc.) untouched.
    const newState = { ...row.state, appSource: out };
    const now = Date.now();
    const upd = await fetch(
      rest(`/designs?id=eq.${row.id}&updated_at=eq.${row.updated_at}`),
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify({ state: newState, updated_at: now }),
      },
    );
    const body = await upd.json();
    if (!upd.ok) throw new Error(`update ${row.id}: ${upd.status} ${JSON.stringify(body)}`);
    if (!Array.isArray(body) || body.length === 0)
      throw new Error(
        `update ${row.id}: version conflict (row moved past updated_at=${row.updated_at}) — re-run`,
      );
    // verify: re-read and confirm no old tokens remain
    const chk = await fetch(rest(`/designs?id=eq.${row.id}&select=state`), { headers });
    const [fresh] = await chk.json();
    const leftovers = (fresh.state.appSource.match(/\b(rk|lp|cit)-[a-z]|lsg-(kw|add|settings)|hub-lsg|ai-(gbp|export)\b/g) ?? []).length;
    console.log(`    saved (updated_at ${now}); leftover old tokens: ${leftovers === 0 ? "none ✓" : `${leftovers} ✗`}`);
  }
}
console.log(`\n${WRITE ? "WROTE" : "DRY RUN — would write"}: ${touched} screen(s).${WRITE ? "" : " Re-run with --write to persist."}`);
