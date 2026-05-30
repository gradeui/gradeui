"use server";

/**
 * Server action invoked from the Accept-invite page's form.
 *
 * Uses the service-role client to:
 *   1. Re-read the invitation (fresh validation — guards against
 *      a race where the invite was revoked between page render
 *      and form submit).
 *   2. Insert the corresponding access grant.
 *   3. Mark the invitation accepted (carrying the accepted-by id
 *      so the inviter sees the audit trail).
 *
 * Then redirects the user into the resource they just joined.
 */

import { redirect } from "next/navigation";
import {
  getServerUser,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";

interface InvitationRow {
  token: string;
  email: string;
  resource_kind: "project" | "team" | "org";
  resource_id: string;
  role: string;
  expires_at: number;
  accepted_at: number | null;
}

export async function acceptInvitation(formData: FormData): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    redirect("/studio?invite=invalid");
  }

  const user = await getServerUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/accept-invite/${token}`)}`);
  }

  const service = getServiceRoleSupabase();
  if (!service) {
    redirect("/studio?invite=unconfigured");
  }

  const { data: invitation } = await service!
    .from("invitations")
    .select("token, email, resource_kind, resource_id, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  const inv = invitation as InvitationRow | null;
  if (!inv || inv.accepted_at || inv.expires_at < Date.now()) {
    redirect("/studio?invite=invalid");
  }

  if (inv!.resource_kind === "project") {
    await service!.from("project_access").upsert(
      {
        project_id: inv!.resource_id,
        subject_type: "user",
        subject_id: user!.id,
        role: inv!.role,
      },
      { onConflict: "project_id,subject_type,subject_id" },
    );
  } else if (inv!.resource_kind === "team") {
    await service!.from("memberships").upsert(
      { user_id: user!.id, team_id: inv!.resource_id, role: inv!.role },
      { onConflict: "user_id,team_id" },
    );
  } else if (inv!.resource_kind === "org") {
    await service!.from("org_memberships").upsert(
      { user_id: user!.id, org_id: inv!.resource_id, role: inv!.role },
      { onConflict: "user_id,org_id" },
    );
  }

  await service!
    .from("invitations")
    .update({ accepted_at: Date.now(), accepted_by: user!.id })
    .eq("token", token);

  if (inv!.resource_kind === "project") {
    redirect(`/studio?project=${inv!.resource_id}`);
  } else {
    redirect("/studio");
  }
}
