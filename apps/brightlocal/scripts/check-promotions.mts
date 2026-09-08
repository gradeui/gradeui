/**
 * check-promotions: is the app copy of each screen still the current
 * promotion of its Studio screen? Same design as apps/glint: the
 * promoted page carries `// source-hash: <sig>`, and this compares the
 * live Studio source's signature against that stamp. The only way to
 * clear drift is to promote again.
 *
 *   pnpm -F @gradeui/brightlocal check:promotions          # exits 1 if drifted
 *   pnpm -F @gradeui/brightlocal check:promotions --warn   # always exits 0
 *
 * Reads the service-role key from apps/docs/.env.local (dev-time only).
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { SCREENS, hrefFor } from "../lib/screens";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const require = createRequire(join(app, "../mcp-server/package.json"));
const { createClient } = require("@supabase/supabase-js");

const env = readFileSync(join(app, "../docs/.env.local"), "utf8");
const get = (k: string) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const sb = createClient(get("NEXT_PUBLIC_SUPABASE_URL")!, get("SUPABASE_SERVICE_ROLE_KEY")!);

function sourceSignature(src: string): string {
  const normalised = src.replace(/\s*data-gds-source-id="\d+"/g, "").replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalised, "utf8").digest("hex").slice(0, 12);
}

const warn = process.argv.includes("--warn");
let drifted = 0;
for (const s of SCREENS) {
  const rel = s.scope === "root" ? s.path : join("locations/[location]", s.path);
  const direct = join(app, "app/(app)", rel, "page.jsx");
  const page = existsSync(direct) ? direct : join(app, "app/(app)", rel, "_option-a/page.jsx");
  const stamp = existsSync(page) ? readFileSync(page, "utf8").match(/^\/\/ source-hash: (\w+)/m)?.[1] : undefined;
  const { data, error } = await sb.from("designs").select("state, updated_at").eq("id", s.id).single();
  if (error || !data) {
    console.log(`? ${s.path}  (${s.id}) not readable: ${error?.message}`);
    continue;
  }
  const live = sourceSignature(String(data.state?.appSource ?? ""));
  if (!stamp) console.log(`~ ${s.path}  no source-hash stamp`);
  else if (live === stamp) console.log(`= ${s.path}`);
  else {
    drifted++;
    console.log(`! ${s.path}  Studio moved (${data.updated_at})`);
  }
}
console.log(drifted ? `${drifted} drifted` : "all current");
process.exit(drifted && !warn ? 1 : 0);
