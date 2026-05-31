/**
 * POST /api/invitations
 *
 * Server route that creates a project invitation:
 *   1. Verifies the requester is signed in AND is the project's
 *      owner (RLS would block them otherwise — we do an explicit
 *      check here to return a clear error before going to the DB).
 *   2. Inserts a row into `invitations` via the service-role
 *      client. Service-role bypasses RLS so we can stamp the
 *      `invited_by` to the requester's auth.uid().
 *   3. Sends the invite email via Resend.
 *
 * Body shape: { projectId: string, email: string, role: 'editor' | 'viewer' }
 *
 * The actual access grant isn't created until the invitee accepts
 * (see /accept-invite/[token]/page.tsx) — that keeps "pending
 * invite" cleanly distinct from "active member" in the UI.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  getServerSupabase,
  getServerUser,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { projectInvitationEmail } from "@/lib/email/templates";

const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Shared guard for the list/revoke paths: confirm the signed-in user
 * owns `projectId`. Returns the user on success, or a NextResponse to
 * short-circuit with the right status. Mirrors the inline check in POST
 * (owner-only for v1 — team-admin reach lands with that UI).
 */
async function requireProjectOwner(projectId: string) {
  const user = await getServerUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Not signed in" }, { status: 401 }),
    };
  }
  const userSupabase = await getServerSupabase();
  if (!userSupabase) {
    return {
      error: NextResponse.json(
        { error: "Auth is not configured on this deploy" },
        { status: 500 },
      ),
    };
  }
  const { data: project } = await userSupabase
    .from("projects")
    .select("id, owner_type, owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return {
      error: NextResponse.json(
        { error: "Project not found or you can't access it" },
        { status: 404 },
      ),
    };
  }
  const isOwner =
    project.owner_type === "user" && project.owner_id === user.id;
  if (!isOwner) {
    return {
      error: NextResponse.json(
        { error: "Only the project owner can manage invites" },
        { status: 403 },
      ),
    };
  }
  return { user };
}

/**
 * GET /api/invitations?projectId=<id>
 *
 * Lists the project's invitations (pending + accepted) so the owner can
 * see who's been invited and whether they've responded. Owner-only.
 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }
  const guard = await requireProjectOwner(projectId);
  if ("error" in guard) return guard.error;

  const service = getServiceRoleSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "Service-role key not configured" },
      { status: 500 },
    );
  }
  const { data, error } = await service
    .from("invitations")
    .select("token, email, role, accepted_at, accepted_by, expires_at, created_at")
    .eq("resource_kind", "project")
    .eq("resource_id", projectId)
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, invitations: data ?? [] });
}

/**
 * DELETE /api/invitations  body: { token }
 *
 * Revokes a PENDING invitation. Owner-only. Accepted invites can't be
 * revoked here (the grant already exists — removing a member is a
 * separate action), so we 409 those.
 */
export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { token?: string }
    | null;
  if (!body?.token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const service = getServiceRoleSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "Service-role key not configured" },
      { status: 500 },
    );
  }

  // Look up the invite (service-role) to find which project it's for,
  // then gate on ownership of THAT project.
  const { data: inv } = await service
    .from("invitations")
    .select("token, resource_kind, resource_id, accepted_at")
    .eq("token", body.token)
    .maybeSingle();
  if (!inv) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  const invitation = inv as {
    token: string;
    resource_kind: string;
    resource_id: string;
    accepted_at: number | null;
  };
  if (invitation.resource_kind !== "project") {
    return NextResponse.json(
      { error: "Only project invites can be revoked here" },
      { status: 400 },
    );
  }
  if (invitation.accepted_at) {
    return NextResponse.json(
      { error: "This invite was already accepted" },
      { status: 409 },
    );
  }

  const guard = await requireProjectOwner(invitation.resource_id);
  if ("error" in guard) return guard.error;

  const { error } = await service
    .from("invitations")
    .delete()
    .eq("token", body.token);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { projectId?: string; email?: string; role?: "editor" | "viewer" }
    | null;
  if (!body?.projectId || !body.email) {
    return NextResponse.json(
      { error: "projectId and email are required" },
      { status: 400 },
    );
  }
  const role = body.role === "viewer" ? "viewer" : "editor";

  const userSupabase = await getServerSupabase();
  if (!userSupabase) {
    return NextResponse.json(
      { error: "Auth is not configured on this deploy" },
      { status: 500 },
    );
  }

  // RLS-bound read confirms the requester can see the project — and
  // gives us the name to drop into the email body.
  const { data: project, error: projectErr } = await userSupabase
    .from("projects")
    .select("id, name, owner_type, owner_id")
    .eq("id", body.projectId)
    .maybeSingle();
  if (projectErr || !project) {
    return NextResponse.json(
      { error: "Project not found or you can't access it" },
      { status: 404 },
    );
  }

  // Only the owner can invite. Team-owned projects: any team admin
  // can invite — we just check ownership equality for v1, team-admin
  // path lands when the team admin UI does.
  const isOwner =
    project.owner_type === "user" && project.owner_id === user.id;
  if (!isOwner) {
    return NextResponse.json(
      { error: "Only the project owner can invite" },
      { status: 403 },
    );
  }

  const service = getServiceRoleSupabase();
  if (!service) {
    return NextResponse.json(
      { error: "Service-role key not configured" },
      { status: 500 },
    );
  }

  const expiresAt = Date.now() + INVITATION_TTL_MS;
  const { data: invitation, error: insertErr } = await service
    .from("invitations")
    .insert({
      email: body.email,
      invited_by: user.id,
      resource_kind: "project",
      resource_id: project.id,
      role,
      expires_at: expiresAt,
    })
    .select("token")
    .single();

  if (insertErr || !invitation) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create invitation" },
      { status: 500 },
    );
  }

  const acceptUrl = new URL(
    `/accept-invite/${(invitation as { token: string }).token}`,
    req.url,
  ).toString();
  const inviterName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "Someone";

  const email = projectInvitationEmail({
    inviterName,
    projectName: (project as { name: string }).name,
    acceptUrl,
  });

  const sendResult = await sendEmail({
    to: body.email,
    subject: email.subject,
    text: email.text,
  });

  return NextResponse.json({
    ok: true,
    token: (invitation as { token: string }).token,
    emailStatus: sendResult.status,
    emailError: sendResult.error,
  });
}
