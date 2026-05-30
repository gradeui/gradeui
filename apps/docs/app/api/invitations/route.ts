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
