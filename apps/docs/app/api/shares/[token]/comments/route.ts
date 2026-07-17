/**
 * POST /api/shares/[token]/comments — viewer-side PIN CREATION on a
 * share (Ali, 18 Jul: "we will want viewer side pins mate").
 *
 * Why a server route: comment_threads RLS only admits users who can
 * SELECT the project — correct for Studio, wrong for a share viewer,
 * whose whole relationship with the project is the capability token.
 * This route IS that capability check made explicit: signed-in viewer
 * + live token + target screen inside the share's scope → the thread
 * is written with the service role. Comment ability, nothing else —
 * no project access is granted or implied.
 */
import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * DELETE — a viewer removes their OWN comment (Ali, 18 Jul: "I need to
 * be able to delete my comments in the share flow"). Same capability
 * shape as POST: signed-in + live token + the comment's thread belongs
 * to this share's project, and STRICTLY author-only. The thread
 * auto-deletes when its last comment goes (the pin disappears).
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "sign-in required" }, { status: 401 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const commentId = new URL(req.url).searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const { data: link } = await supabase
    .from("share_links")
    .select("project_id, revoked, expires_at")
    .eq("token", token)
    .maybeSingle();
  const share = link as {
    project_id: string;
    revoked: boolean;
    expires_at: number | null;
  } | null;
  if (
    !share ||
    share.revoked ||
    (share.expires_at && share.expires_at < Date.now())
  ) {
    return NextResponse.json({ error: "share not found" }, { status: 404 });
  }

  const { data: commentRow } = await supabase
    .from("comments")
    .select("id, thread_id, author_id")
    .eq("id", commentId)
    .maybeSingle();
  const comment = commentRow as {
    id: string;
    thread_id: string;
    author_id: string;
  } | null;
  if (!comment) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (comment.author_id !== user.id) {
    return NextResponse.json({ error: "not your comment" }, { status: 403 });
  }
  const { data: threadRow } = await supabase
    .from("comment_threads")
    .select("id, project_id")
    .eq("id", comment.thread_id)
    .maybeSingle();
  const thread = threadRow as { id: string; project_id: string } | null;
  if (!thread || thread.project_id !== share.project_id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { error: dErr } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment.id);
  if (dErr) {
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", thread.id);
  let threadDeleted = false;
  if (!count) {
    await supabase.from("comment_threads").delete().eq("id", thread.id);
    threadDeleted = true;
  }
  return NextResponse.json({ deleted: true, threadDeleted });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "sign-in required" }, { status: 401 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as {
    designId?: string;
    anchorId?: string;
    anchorKind?: "source" | "instance";
    elementLabel?: string;
    componentName?: string;
    body?: string;
  } | null;
  if (
    !body?.designId ||
    !body.anchorId ||
    (body.anchorKind !== "source" && body.anchorKind !== "instance") ||
    !body.body?.trim()
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // ── Capability check: live token + design inside the share's scope.
  const { data: link } = await supabase
    .from("share_links")
    .select("project_id, design_id, scope, revoked, expires_at")
    .eq("token", token)
    .maybeSingle();
  const share = link as {
    project_id: string;
    design_id: string | null;
    scope: {
      tag?: { type: string; value: string };
      screens?: string[];
    } | null;
    revoked: boolean;
    expires_at: number | null;
  } | null;
  if (!share || share.revoked) {
    return NextResponse.json({ error: "share not found" }, { status: 404 });
  }
  if (share.expires_at && share.expires_at < Date.now()) {
    return NextResponse.json({ error: "share expired" }, { status: 404 });
  }

  const { data: designRow } = await supabase
    .from("designs")
    .select("id, project_id, state")
    .eq("id", body.designId)
    .maybeSingle();
  const design = designRow as {
    id: string;
    project_id: string;
    state: { tags?: { type: string; value: string }[] | null } | null;
  } | null;
  if (!design || design.project_id !== share.project_id) {
    return NextResponse.json({ error: "screen not in share" }, { status: 403 });
  }
  const scope = share.scope;
  const inScope =
    !scope || // unscoped share exposes the project's flow map
    design.id === share.design_id ||
    scope.screens?.includes(design.id) ||
    (scope.tag
      ? (design.state?.tags ?? []).some(
          (t) => t.type === scope.tag!.type && t.value === scope.tag!.value,
        )
      : false);
  if (!inScope) {
    return NextResponse.json({ error: "screen not in share" }, { status: 403 });
  }

  // ── Write. Same shape as the Studio adapter's createThread: bind to
  // the screen's latest revision so the pin survives regeneration.
  const { data: rev } = await supabase
    .from("screen_revisions")
    .select("id")
    .eq("design_id", design.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: threadData, error: tErr } = await supabase
    .from("comment_threads")
    .insert({
      project_id: share.project_id,
      design_id: design.id,
      anchor_id: body.anchorId,
      anchor_kind: body.anchorKind,
      element_label: body.elementLabel ?? "element",
      component_name: body.componentName ?? null,
      created_by: user.id,
      revision_id: (rev as { id: string } | null)?.id ?? null,
      // Provenance: this thread was collected THROUGH this link (and
      // therefore in whatever visual context the link presents).
      share_token: token,
    })
    .select(
      "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
    )
    .single();
  if (tErr) {
    return NextResponse.json({ error: tErr.message }, { status: 500 });
  }
  const thread = threadData as Record<string, unknown>;

  const { data: commentData, error: cErr } = await supabase
    .from("comments")
    .insert({
      thread_id: thread.id,
      author_id: user.id,
      body: body.body.trim(),
    })
    .select(
      "id, thread_id, parent_comment_id, author_id, body, edited_at, created_at",
    )
    .single();
  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500 });
  }
  const comment = commentData as Record<string, unknown>;

  // Trail entry — best-effort, never blocks the pin.
  try {
    await supabase.from("events").insert({
      actor_id: user.id,
      project_id: share.project_id,
      design_id: design.id,
      action: "share.comment",
      target_kind: "comment_thread",
      target_id: thread.id,
    });
  } catch {
    /* trail gaps acceptable */
  }

  return NextResponse.json({
    thread: {
      id: thread.id,
      projectId: thread.project_id,
      designId: thread.design_id,
      anchorId: thread.anchor_id,
      anchorKind: thread.anchor_kind,
      elementLabel: thread.element_label,
      componentName: thread.component_name ?? undefined,
      status: thread.status,
      createdBy: thread.created_by,
      createdAt: thread.created_at,
    },
    comments: [
      {
        id: comment.id,
        threadId: comment.thread_id,
        authorId: comment.author_id,
        body: comment.body,
        createdAt: comment.created_at,
      },
    ],
    author: {
      id: user.id,
      name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "Viewer",
      email: user.email ?? undefined,
      avatarUrl:
        (user.user_metadata?.avatar_url as string | undefined) ?? undefined,
      status: "active",
    },
  });
}
