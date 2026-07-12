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
import type { CommentThreadWithMessages } from "@/lib/studio-storage";
import { SHARE_VIEWPORT_PRESETS } from "@/lib/studio-storage";
import type { User } from "@/lib/studio-users";

export const dynamic = "force-dynamic";

/** Tab title: "Screen — Project · Grade". Light second query — the
 *  page itself re-validates the token; this only names the tab. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getServiceSupabase();
  if (!supabase) return { title: "Shared screen · Grade" };
  const { data: link } = await supabase
    .from("share_links")
    .select("project_id, design_id, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!link || link.revoked || !link.design_id)
    return { title: "Shared screen · Grade" };
  const [{ data: design }, { data: project }] = await Promise.all([
    supabase.from("designs").select("name").eq("id", link.design_id).maybeSingle(),
    supabase.from("projects").select("name").eq("id", link.project_id).maybeSingle(),
  ]);
  const screen = (design as { name: string } | null)?.name ?? "Screen";
  const proj = (project as { name: string } | null)?.name ?? "Grade";
  return { title: `${screen} — ${proj} · Grade` };
}

interface ThreadRow {
  id: string;
  project_id: string;
  design_id: string;
  anchor_id: string;
  anchor_kind: "source" | "instance";
  element_label: string;
  component_name: string | null;
  status: "open" | "resolved";
  created_by: string;
  resolved_by: string | null;
  resolved_at: number | null;
  created_at: number;
}
interface CommentRow {
  id: string;
  thread_id: string;
  parent_comment_id: string | null;
  author_id: string;
  body: string;
  edited_at: number | null;
  created_at: number;
}
interface UserRow {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  status: "unverified" | "active" | "suspended";
  super_admin: boolean;
}

interface ShareLinkRow {
  token: string;
  project_id: string;
  design_id: string | null;
  revision_id: string | null;
  mode: "view" | "comment";
  color_mode: "light" | "dark";
  /** Spec-model viewport doc — see migration 0017. */
  viewports: {
    initialId?: string;
    specs?: import("@/lib/studio-storage").ShareViewportSpec[];
  } | null;
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
    .select("token, project_id, design_id, revision_id, mode, color_mode, viewports, revoked, expires_at")
    .eq("token", token)
    .maybeSingle();

  const share = link as ShareLinkRow | null;
  if (!share || share.revoked) notFound();
  if (share.expires_at && share.expires_at < Date.now()) notFound();
  if (!share.design_id) notFound();

  // Trail entry — record that the share was opened. Anonymous viewers
  // have no user, so this is written with the service role (bypasses the
  // events insert policy) and a null actor. Best-effort: a failed log
  // must never break the render. Coarse "viewed" only — no interaction
  // telemetry. A signed-in member viewing their own share still lands
  // here with a null actor; dedup/attribution is a later refinement.
  try {
    await supabase.from("events").insert({
      actor_id: null,
      project_id: share.project_id,
      design_id: share.design_id,
      action: "share.view",
      target_kind: "share",
      target_id: share.token,
    });
  } catch {
    /* trail gaps are acceptable; broken shares are not */
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

  // Screen name (for the share toolbar) + project theme.
  const { data: design } = await supabase
    .from("designs")
    .select("name")
    .eq("id", share.design_id)
    .maybeSingle();
  const screenName = (design as { name: string } | null)?.name ?? "Screen";

  const { data: project } = await supabase
    .from("projects")
    .select("theme_draft_json, name, registry_id")
    .eq("id", share.project_id)
    .maybeSingle();
  const projectRow = project as {
    theme_draft_json: string | null;
    name: string;
    registry_id: string | null;
  } | null;

  // Open comment threads on this screen — rendered read-only as pins in
  // the share. (Adding a comment requires sign-in; that's handled in the
  // client.) Authors are resolved to users for the pin avatars.
  const commentThreads: CommentThreadWithMessages[] = [];
  const commentUsers: User[] = [];
  {
    const { data: threadData } = await supabase
      .from("comment_threads")
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
      )
      .eq("project_id", share.project_id)
      .eq("design_id", share.design_id)
      .eq("status", "open")
      .order("created_at", { ascending: true });
    const threadRows = (threadData ?? []) as ThreadRow[];
    if (threadRows.length) {
      const threadIds = threadRows.map((t) => t.id);
      const { data: commentData } = await supabase
        .from("comments")
        .select("id, thread_id, parent_comment_id, author_id, body, edited_at, created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });
      const commentRows = (commentData ?? []) as CommentRow[];

      const byThread = new Map<string, CommentRow[]>();
      for (const c of commentRows) {
        const arr = byThread.get(c.thread_id) ?? [];
        arr.push(c);
        byThread.set(c.thread_id, arr);
      }

      const userIds = [
        ...new Set(
          [
            ...threadRows.map((t) => t.created_by),
            ...commentRows.map((c) => c.author_id),
          ].filter(Boolean),
        ),
      ];
      if (userIds.length) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, name, email, avatar_url, status, super_admin")
          .in("id", userIds);
        for (const u of (userData ?? []) as UserRow[]) {
          commentUsers.push({
            id: u.id,
            name: u.name,
            email: u.email ?? undefined,
            avatarUrl: u.avatar_url ?? undefined,
            status: u.status,
            superAdmin: u.super_admin || undefined,
          });
        }
      }

      for (const t of threadRows) {
        commentThreads.push({
          thread: {
            id: t.id,
            projectId: t.project_id,
            designId: t.design_id,
            anchorId: t.anchor_id,
            anchorKind: t.anchor_kind,
            elementLabel: t.element_label,
            componentName: t.component_name ?? undefined,
            status: t.status,
            createdBy: t.created_by,
            resolvedBy: t.resolved_by ?? undefined,
            resolvedAt: t.resolved_at ?? undefined,
            createdAt: t.created_at,
          },
          comments: (byThread.get(t.id) ?? []).map((c) => ({
            id: c.id,
            threadId: c.thread_id,
            parentCommentId: c.parent_comment_id ?? undefined,
            authorId: c.author_id,
            body: c.body,
            editedAt: c.edited_at ?? undefined,
            createdAt: c.created_at,
          })),
        });
      }
    }
  }

  // Viewport set — the share's spec doc (migration 0017). The column
  // is NOT NULL with a preset default, so the fallbacks here only
  // catch hand-edited rows. The initial id is clamped into the set so
  // a stale doc can't open a viewport the creator locked out.
  const docSpecs = share.viewports?.specs;
  const viewportSpecs =
    docSpecs && docSpecs.length > 0 ? docSpecs : SHARE_VIEWPORT_PRESETS;
  const storedInitial = share.viewports?.initialId;
  const initialViewportId =
    storedInitial && viewportSpecs.some((s) => s.id === storedInitial)
      ? storedInitial
      : viewportSpecs[0].id;

  return (
    <SharedScreen
      appSource={appSource}
      themeDraftJson={projectRow?.theme_draft_json ?? null}
      mode={share.color_mode}
      viewportSpecs={viewportSpecs}
      initialViewportId={initialViewportId}
      screenName={screenName}
      projectName={projectRow?.name ?? "Untitled project"}
      canComment={share.mode === "comment"}
      commentThreads={commentThreads}
      commentUsers={commentUsers}
      // The PROJECT's registry — resolved server-side so the share
      // renders with the right DS regardless of the deployment default.
      registryId={projectRow?.registry_id ?? null}
    />
  );
}
