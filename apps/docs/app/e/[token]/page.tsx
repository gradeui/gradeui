/**
 * Public embed route — /e/<token>.
 *
 * Server component, sibling to /s/<token>. Validates a share token with
 * the SERVICE-ROLE client (no user session), then returns ONLY the one
 * screen the token points at: its source (latest revision, or a pinned
 * revision) plus the project's theme. Renders chrome-free via EmbedScreen
 * so it can be dropped into any site inside a sandboxed iframe.
 *
 * Reuses the share-link record — an embed IS a share link with a leaner
 * presentation shell. Comments are NOT fetched: an embed is read-or-tweak,
 * never annotate. See STUDIO-CAPTURE.md (consumer 3) + STUDIO-EMBED.md.
 */

import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/service";
import { EmbedScreen } from "@/components/studio/embed-screen";

export const dynamic = "force-dynamic";

interface ShareLinkRow {
  token: string;
  project_id: string;
  design_id: string | null;
  revision_id: string | null;
  mode: "view" | "comment";
  color_mode: "light" | "dark";
  viewport: "responsive" | "mobile" | "tablet" | "desktop";
  revoked: boolean;
  expires_at: number | null;
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { token } = await params;

  // Optional fixed-resolution sizing. `?w=1280` renders the screen at that
  // virtual width (breakpoints fire at 1280) and scales it to fill the box;
  // adding `&h=800` switches to an exact contain-fit artboard. Width alone
  // is enough — no `w` means the embed renders responsive (reflows to the
  // iframe width). Values must be positive finite numbers.
  const sp = await searchParams;
  const toDim = (v: string | string[] | undefined): number | undefined => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const renderWidth = toDim(sp.w);
  const renderHeight = toDim(sp.h);

  // Optional motion toggle: ?motion=off suppresses animation (ThreeScene
  // pauses, CSS animation stills); ?motion=on removes the suppression
  // (still respects the viewer's OS reduced-motion). Absent = leave the
  // iframe to its own OS default. Reduce-only.
  const motionRaw = Array.isArray(sp.motion) ? sp.motion[0] : sp.motion;
  const motion =
    motionRaw === "off" ? false : motionRaw === "on" ? true : undefined;

  const supabase = getServiceSupabase();
  if (!supabase) notFound();

  const { data: link } = await supabase
    .from("share_links")
    .select(
      "token, project_id, design_id, revision_id, mode, color_mode, viewport, revoked, expires_at",
    )
    .eq("token", token)
    .maybeSingle();

  const share = link as ShareLinkRow | null;
  if (!share || share.revoked) notFound();
  if (share.expires_at && share.expires_at < Date.now()) notFound();
  if (!share.design_id) notFound();

  // Trail entry — coarse "embed viewed". Anonymous viewers have no user,
  // so this writes with the service role and a null actor. Best-effort:
  // a failed log must never break the render.
  try {
    await supabase.from("events").insert({
      actor_id: null,
      project_id: share.project_id,
      design_id: share.design_id,
      action: "embed.view",
      target_kind: "share",
      target_id: share.token,
    });
  } catch {
    /* trail gaps are acceptable; broken embeds are not */
  }

  // Source: a pinned revision if set, else the screen's current state.
  let appSource: string | null = null;
  if (share.revision_id) {
    const { data: rev } = await supabase
      .from("screen_revisions")
      .select("app_source")
      .eq("id", share.revision_id)
      .maybeSingle();
    appSource = (rev as { app_source: string | null } | null)?.app_source ?? null;
  } else {
    const { data: design } = await supabase
      .from("designs")
      .select("state")
      .eq("id", share.design_id)
      .maybeSingle();
    const state = (design as { state: { appSource?: string | null } | null } | null)
      ?.state;
    appSource = state?.appSource ?? null;
  }

  // Project theme — the treatment the embed renders in.
  const { data: project } = await supabase
    .from("projects")
    .select("theme_draft_json")
    .eq("id", share.project_id)
    .maybeSingle();
  const themeDraftJson =
    (project as { theme_draft_json: string | null } | null)?.theme_draft_json ??
    null;

  return (
    <EmbedScreen
      appSource={appSource}
      themeDraftJson={themeDraftJson}
      mode={share.color_mode}
      renderWidth={renderWidth}
      renderHeight={renderHeight}
      motion={motion}
    />
  );
}
