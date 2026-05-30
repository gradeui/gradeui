/**
 * Public share route — /s/<token>.
 *
 * Server component. Validates the share token with the SERVICE-ROLE
 * client (no user session here), then returns ONLY the one screen the
 * token points at: its source (latest revision, or a pinned revision)
 * plus the project's theme. Anon never touches the tables directly —
 * tenant isolation holds because this route hands back exactly one
 * screen and nothing else.
 */

import { notFound } from "next/navigation";
import { getServiceSupabase } from "@/lib/supabase/service";
import { SharedScreen } from "@/components/studio/shared-screen";

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

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabase();
  if (!supabase) notFound();

  const { data: link } = await supabase
    .from("share_links")
    .select("token, project_id, design_id, revision_id, mode, color_mode, revoked, expires_at")
    .eq("token", token)
    .maybeSingle();

  const share = link as ShareLinkRow | null;
  if (!share || share.revoked) notFound();
  if (share.expires_at && share.expires_at < Date.now()) notFound();
  if (!share.design_id) notFound();

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

  // Screen name (for the share toolbar) + project theme.
  const { data: design } = await supabase
    .from("designs")
    .select("name")
    .eq("id", share.design_id)
    .maybeSingle();
  const screenName = (design as { name: string } | null)?.name ?? "Screen";

  const { data: project } = await supabase
    .from("projects")
    .select("theme_draft_json, name")
    .eq("id", share.project_id)
    .maybeSingle();
  const projectRow = project as {
    theme_draft_json: string | null;
    name: string;
  } | null;

  return (
    <SharedScreen
      appSource={appSource}
      themeDraftJson={projectRow?.theme_draft_json ?? null}
      mode={share.color_mode}
      screenName={screenName}
      projectName={projectRow?.name ?? "Untitled project"}
      canComment={share.mode === "comment"}
    />
  );
}
