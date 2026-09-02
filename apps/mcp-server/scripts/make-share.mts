// Mint (or find) a /s/<token> share link for a screen.
//
//   cd apps/mcp-server
//   set -a && source ../docs/.env.local && set +a
//   npx tsx scripts/make-share.mts <projectId> <screenId>
//
// WHY THIS EXISTS. `scripts/capture-states.mjs` and the flow recorder both
// drive `/s/<token>?fullscreen=1` rather than the `/e/` embed, because the
// share route loads the project's custom CSS. A share token is per SCREEN,
// so every screen added to the suite needs one, and until now the only way
// to get one was to click Share in Studio and copy the URL out by hand —
// which is fine once and a nuisance the fourth time.
//
// Idempotent: an existing, unrevoked view share for the same screen is
// returned rather than a second one minted. Prints the token and the URL,
// which is what goes in the SCREENS map at the top of capture-states.mjs.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error(
    "missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (source apps/docs/.env.local)",
  );
}

const [projectId, designId] = process.argv.slice(2);
if (!projectId || !designId) {
  throw new Error("usage: make-share.mts <projectId> <screenId>");
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: findErr } = await db
  .from("share_links")
  .select("token, mode, revoked, created_at")
  .eq("project_id", projectId)
  .eq("design_id", designId)
  .eq("mode", "view")
  .eq("revoked", false)
  .order("created_at", { ascending: false })
  .limit(1);
if (findErr) throw findErr;

if (existing?.length) {
  const t = existing[0].token;
  console.log(`existing share  ${t}`);
  console.log(`http://localhost:3000/s/${t}?fullscreen=1`);
  process.exit(0);
}

// The same viewport document the adapter writes for a fresh share: the
// responsive spec, opened responsive. Anything narrower here would make
// the capture suite shoot a mobile layout in a desktop frame.
const { data, error } = await db
  .from("share_links")
  .insert({
    project_id: projectId,
    design_id: designId,
    mode: "view",
    color_mode: "light",
    viewports: { initialId: "responsive", specs: [{ id: "responsive", label: "Responsive" }] },
  })
  .select("token")
  .single();
if (error) throw error;

console.log(`new share       ${data.token}`);
console.log(`http://localhost:3000/s/${data.token}?fullscreen=1`);
