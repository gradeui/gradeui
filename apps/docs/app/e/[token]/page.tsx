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
import { EmbedScreen, type CameraShot } from "@/components/studio/embed-screen";

/**
 * Parse the human-readable `camera` param into a shot list. Shots are
 * separated by `;`; each is `zoom,cx,cy,hold,trans` where hold/trans are in
 * SECONDS and cx/cy/hold/trans are optional. Whitespace is tolerated.
 *
 *   camera=1 ; 2,0.3,0.2,2.5 ; 1,0.5,0.5,1.5
 *   → full view (hold 2s default), glide to 2× on (0.3,0.2) hold 2.5s,
 *     glide back to full, loop.
 */
function parseCameraParam(raw: string | undefined): CameraShot[] | undefined {
  if (!raw) return undefined;
  const n = (v: string | undefined, d: number): number => {
    const x = Number((v ?? "").trim());
    return Number.isFinite(x) ? x : d;
  };
  const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
  const shots = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const p = s.split(",");
      return {
        zoom: Math.max(0.01, n(p[0], 1)),
        cx: clamp01(n(p[1], 0.5)),
        cy: clamp01(n(p[2], 0.5)),
        holdMs: Math.max(0, n(p[3], 2)) * 1000,
        transMs: Math.max(0, n(p[4], 0.8)) * 1000,
      };
    });
  return shots.length > 0 ? shots : undefined;
}

export const dynamic = "force-dynamic";

interface ShareLinkRow {
  token: string;
  project_id: string;
  design_id: string | null;
  revision_id: string | null;
  mode: "view" | "comment";
  color_mode: "light" | "dark";
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

  // Optional zoom + focal point: ?zoom=2&cx=0.5&cy=0.3 magnifies the screen
  // and centres that point (fractions of the screen) in the box — so you can
  // spotlight a detail and let the host box crop to it. Defaults: no zoom,
  // centred.
  const num = (
    v: string | string[] | undefined,
    fallback: number,
  ): number => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) ? n : fallback;
  };
  const zoom = num(sp.zoom, 1);
  const focusX = num(sp.cx, 0.5);
  const focusY = num(sp.cy, 0.5);
  const camera = parseCameraParam(
    Array.isArray(sp.camera) ? sp.camera[0] : sp.camera,
  );

  const supabase = getServiceSupabase();
  if (!supabase) notFound();

  // NOTE: select stays in lockstep with the live schema — migration 0017
  // dropped the singular `viewport` column (the embed sizes via ?w/?h
  // instead, and the spec-model `viewports` doc is a share-view concern).
  // Selecting a dropped column errors, and a swallowed error here reads
  // as "no such share" → 404 for every embed. That exact bug shipped
  // June 2026 (caught by the MCP preview_screen loop); surface the error
  // so the next schema drift is a log line, not a silent global 404.
  const { data: link, error: linkError } = await supabase
    .from("share_links")
    .select(
      "token, project_id, design_id, revision_id, mode, color_mode, revoked, expires_at",
    )
    .eq("token", token)
    .maybeSingle();
  if (linkError) {
    // eslint-disable-next-line no-console
    console.error("[embed] share_links lookup failed:", linkError.message);
  }

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
      zoom={zoom}
      focusX={focusX}
      focusY={focusY}
      camera={camera}
    />
  );
}
