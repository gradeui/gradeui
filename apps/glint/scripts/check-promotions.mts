/**
 * check-promotions: is the app copy of each screen still the current
 * promotion of its Studio screen?
 *
 * WHY THIS EXISTS (11 Aug 2026): Studio and this app hold two copies of
 * every screen, and nothing linked them. A screen edited in Studio after
 * promotion silently orphans the app copy, and the only symptom is
 * "these look different" days later, which is exactly how the wallets
 * card chevron ended up a ghost button here and an outline circle in
 * Studio, three and a half hours apart.
 *
 * WHY IT IS TWO-SIDED (same day, second lesson): the first version of
 * this check hashed the live Studio screen and compared it against a
 * `sourceHash` field in lib/screens.ts. Both sides of that comparison
 * were Studio. `--update` re-baselined that field against whatever
 * Studio held at that moment, so running it without re-promoting put a
 * stale app copy under a green tick, permanently. That is how the gold
 * wallet diverged: Studio's filter had moved to `tx.account === "gold"`
 * while the page here still read `tx.metal === "gold"`, and the guard
 * cheerfully reported all 15 screens matching.
 *
 * So the app copy now carries its own provenance. promote-screen.py
 * stamps `// source-hash: <sig>` into the generated page's header, and
 * this script compares the live Studio signature against THAT. The only
 * way to move the app side of the comparison is to generate the page
 * again, which is the thing that was being skipped. The registry field
 * survives as a fallback for pages promoted before the stamp existed
 * (reported as `legacy` below) and as a human-readable record.
 *
 * WHY NOT TIMESTAMPS: `promotedAt` records designs.updated_at, but any
 * metadata write (a tag script, a Studio open-and-save) bumps that
 * column without touching a pixel. Comparing timestamps flagged 13 of 14
 * screens as stale when only ONE had actually changed. So the check
 * hashes the SOURCE instead, and the timestamp is advisory only.
 *
 * WHAT IS NORMALISED AWAY before hashing:
 *   - `data-gds-source-id="N"`: Studio's selection protocol stamps these
 *     into the stored source on a canvas save, and strips them on an MCP
 *     save. They are render-identical, so hashing them raw would flag
 *     every canvas interaction.
 *   - whitespace, so reformatting is not a change.
 * Everything else counts, deliberately: this should be sensitive.
 * `source_signature` in promote-screen.py is a port of the same rules
 * and has to stay one.
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
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SCREENS } from "../lib/screens";

const here = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = "8e65f8f7-f995-4c47-bc39-8f68b42a86e4";
const WARN_ONLY = process.argv.includes("--warn");
const UPDATE = process.argv.includes("--update");
const APP_ROOT = join(here, "..");
const REGISTRY = join(APP_ROOT, "lib/screens.ts");
const APP_DIR = join(APP_ROOT, "app");

/** The comparable shape of a screen. See the note above. */
export function sourceSignature(appSource: string): string {
  const normalised = appSource
    .replace(/\s*data-gds-source-id="\d+"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return createHash("sha256").update(normalised).digest("hex").slice(0, 12);
}

/** Every page.tsx under app/, at any depth. */
function findPages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findPages(path));
    else if (entry.name === "page.tsx") out.push(path);
  }
  return out;
}

type PromotedPage = { path: string; designId: string; stamp?: string };

/**
 * Index the promoted pages BY THE DESIGN ID IN THEIR OWN HEADER, rather
 * than mapping a registry slug to a file path. A slug is not a path
 * here: the `(product)` route group means `/wallets/usd` lives at
 * `app/(product)/wallets/usd/page.tsx`, and any hand-written slug table
 * would go stale the first time a screen moved into or out of a group.
 * The header is written by promote-screen.py and already carries the id.
 */
function readPromotedPages(): { pages: Map<string, PromotedPage>; duplicates: string[] } {
  const pages = new Map<string, PromotedPage>();
  const duplicates: string[] = [];
  for (const path of findPages(APP_DIR)) {
    const head = readFileSync(path, "utf8").slice(0, 2000);
    // `version` is optional on purpose: the header normally reads
    // "(design <id>, version <ms>)", but /activity was promoted before
    // the version went in and reads "(design <id>)". The id is the part
    // this needs, and a page that has one should never fall out of the
    // check over a missing timestamp.
    const designId = /\(design\s+([A-Za-z0-9_-]+)[,)]/.exec(head)?.[1];
    if (!designId) continue; // hand-written page (a redirect, /s/<id>, ...)
    const stamp = /^\/\/\s*source-hash:\s*([0-9a-f]{6,64})\s*$/m.exec(head)?.[1];
    const page: PromotedPage = { path: relative(APP_ROOT, path), designId, stamp };
    const existing = pages.get(page.designId);
    if (existing) duplicates.push(`${page.designId}: ${existing.path} and ${page.path}`);
    else pages.set(page.designId, page);
  }
  return { pages, duplicates };
}

/** Minimal .env.local reader, no dependency for a dev-time script. */
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
  console.error(`check-promotions: query failed: ${res.status} ${await res.text()}`);
  process.exit(WARN_ONLY ? 0 : 1);
}
const live = new Map((((await res.json()) as DesignRow[]) ?? []).map((r) => [r.id, r]));
const { pages, duplicates } = readPromotedPages();

/** Entries whose registry baseline `--update` may move. See the gate below. */
const baselineable: { slug: string; id: string; hash: string; updatedAt: number }[] = [];
/** The unmaskable failures: Studio has moved since the page was generated. */
const stale: string[] = [];
/** Registry entries with no promoted page, and pages with no live design. */
const orphaned: string[] = [];
const missing: string[] = [];
/** Promoted before the stamp existed, so still checked the old one-sided way. */
const legacy: string[] = [];
const rows: string[] = [];

const pad = (s: string, n: number) => (s.length > n ? s : s.padEnd(n));

for (const s of SCREENS) {
  const label = `${pad(s.slug, 22)} ${pad(s.name, 36)}`;
  const row = live.get(s.id);
  if (!row) {
    missing.push(`${s.slug} (${s.id})`);
    rows.push(`  ?  ${label} no such design in Studio`);
    continue;
  }
  const hash = sourceSignature(row.state?.appSource ?? "");
  const page = pages.get(s.id);

  if (!page) {
    orphaned.push(`${s.slug} (${s.id})`);
    rows.push(`  !  ${label} no promoted page carries this design id`);
    continue;
  }

  if (page.stamp) {
    // The two-sided comparison. Note what is NOT consulted: s.sourceHash.
    if (page.stamp === hash) {
      rows.push(`  ✓  ${label} ${page.path}`);
      // The page vouches for itself, so the registry field is free to
      // catch up. promotedAt moves only on this branch, where the app
      // copy is known current, so it never records a promotion that did
      // not happen.
      if (s.sourceHash !== hash || s.promotedAt !== row.updated_at) {
        baselineable.push({ slug: s.slug, id: s.id, hash, updatedAt: row.updated_at });
      }
    } else {
      stale.push(`${s.slug} (${page.path})`);
      rows.push(`  ✗  ${label} STALE: page ${page.stamp}, Studio now ${hash}`);
    }
    continue;
  }

  // Legacy mode: no stamp in the page, so the best available baseline is
  // the registry field and the check is one-sided again for this screen.
  legacy.push(s.slug);
  if (!s.sourceHash) {
    baselineable.push({ slug: s.slug, id: s.id, hash, updatedAt: row.updated_at });
    rows.push(`  ·  ${label} legacy, no baseline recorded (run --update)`);
  } else if (s.sourceHash !== hash) {
    baselineable.push({ slug: s.slug, id: s.id, hash, updatedAt: row.updated_at });
    rows.push(`  ✗  ${label} legacy, Studio changed (${s.sourceHash} → ${hash})`);
  } else {
    rows.push(`  ~  ${label} legacy check only (no source-hash in ${page.path})`);
  }
}

console.log(
  `\ncheck-promotions: ${SCREENS.length} screens, live Studio source against the\n` +
    `promoted page's own source-hash. Studio project ${PROJECT_ID}\n`,
);
console.log(rows.join("\n"));
console.log(
  "\nLegend\n" +
    "  ✓  current: the page's source-hash stamp matches the live Studio screen\n" +
    "  ✗  drifted: re-promote with scripts/promote-screen.py. A STALE line comes\n" +
    "     from the page's own stamp, so --update cannot clear it.\n" +
    "  ~  legacy: page predates the source-hash stamp, so this falls back to\n" +
    "     lib/screens.ts and both sides of the comparison are Studio.\n" +
    "     Re-promote to make it two-sided.\n" +
    "  ·  legacy with no registry baseline either.\n" +
    "  !  no page under app/ carries this design id.\n" +
    "  ?  no such design in the Studio project.",
);

for (const d of duplicates) {
  console.log(`\nAmbiguous: two pages claim one design (${d}). Only the first was checked.`);
}

/**
 * `--update` re-baselines the registry, and that is ALL it can do. The
 * stale list is deliberately outside its reach: those hashes live in the
 * generated pages, and the fix is to generate them again. Silencing a
 * stale app copy was the original hole.
 */
let baselined = 0;
if (UPDATE && baselineable.length) {
  let src = readFileSync(REGISTRY, "utf8");
  const failed: string[] = [];
  for (const d of baselineable) {
    const idAt = src.indexOf(`id: "${d.id}",`);
    const start = idAt === -1 ? -1 : src.lastIndexOf("\n  {", idAt);
    const end = idAt === -1 ? -1 : src.indexOf("\n  },", idAt);
    if (start === -1 || end === -1) {
      failed.push(d.slug);
      continue;
    }
    let block = src.slice(start, end);
    block = block.replace(/promotedAt: \d+,/, `promotedAt: ${d.updatedAt},`);
    block = /sourceHash: "[^"]*",/.test(block)
      ? block.replace(/sourceHash: "[^"]*",/, `sourceHash: "${d.hash}",`)
      : `${block}\n    sourceHash: "${d.hash}",`;
    src = src.slice(0, start) + block + src.slice(end);
  }
  writeFileSync(REGISTRY, src);
  baselined = baselineable.length - failed.length;
  console.log(`\nBaselined ${baselined} screen(s) in lib/screens.ts.`);
  if (failed.length) {
    console.log(`Could not find registry entries for: ${failed.join(", ")}. Edit by hand.`);
  }
}

const problems = stale.length + orphaned.length + missing.length;
const rebaseline = UPDATE ? 0 : baselineable.filter((b) => legacy.includes(b.slug)).length;

if (!problems && !rebaseline) {
  const suffix = legacy.length ? ` (${legacy.length} in legacy mode)` : "";
  console.log(
    baselined
      ? `\nRegistry re-baselined. Nothing else outstanding${suffix}.\n`
      : `\nAll ${SCREENS.length} screens match the source they were promoted from${suffix}.\n`,
  );
  process.exit(0);
}

const counts = [
  stale.length ? `${stale.length} stale app cop${stale.length === 1 ? "y" : "ies"}` : "",
  rebaseline ? `${rebaseline} legacy drift` : "",
  orphaned.length ? `${orphaned.length} without a page` : "",
  missing.length ? `${missing.length} missing from Studio` : "",
].filter(Boolean);

console.log(
  `\n${counts.join(", ")}.\n` +
    (stale.length
      ? `Re-promote: ${stale.join(", ")}.\n` +
        "Then run --update to bring lib/screens.ts along.\n"
      : "Re-promote with scripts/promote-screen.py, then run --update to re-baseline.\n"),
);
process.exit(WARN_ONLY ? 0 : 1);
