/**
 * Invitation acceptance page.
 *
 * Three states this can render:
 *   - Token invalid / expired / already consumed → friendly error
 *   - Signed in + valid token                    → confirm + accept button
 *   - Signed out + valid token                   → "sign in to accept" CTA
 *                                                  (the middleware also
 *                                                   redirects unsigned-in
 *                                                   visitors to /sign-in
 *                                                   with this URL as next)
 *
 * Accepting the invite happens via a small server action that uses
 * the service-role client to insert the access grant + mark the
 * invitation accepted.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getServerSupabase,
  getServerUser,
  getServiceRoleSupabase,
} from "@/lib/supabase/server";
import { acceptInvitation } from "./actions";

interface AcceptInvitePageProps {
  params: Promise<{ token: string }>;
}

interface InvitationRow {
  token: string;
  email: string;
  resource_kind: "project" | "team" | "org";
  resource_id: string;
  role: string;
  expires_at: number;
  accepted_at: number | null;
}

interface ProjectRow {
  id: string;
  name: string;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token } = await params;

  const supabase = await getServerSupabase();
  if (!supabase) {
    return <ErrorShell>This deploy doesn’t have auth configured.</ErrorShell>;
  }

  // We deliberately use the service-role client to LOOK UP the
  // invitation — the invitee is, by definition, not yet a member
  // of anything, so RLS would hide the row. Reading by token is
  // safe because the token is itself a hard-to-guess secret.
  const service = getServiceRoleSupabase();
  if (!service) {
    return <ErrorShell>The invitation system isn’t configured on this deploy.</ErrorShell>;
  }

  const { data: invitation } = await service
    .from("invitations")
    .select("token, email, resource_kind, resource_id, role, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return <ErrorShell>This invitation link isn’t valid.</ErrorShell>;
  }
  const inv = invitation as InvitationRow;

  if (inv.accepted_at) {
    return <ErrorShell>This invitation has already been used.</ErrorShell>;
  }
  if (inv.expires_at < Date.now()) {
    return <ErrorShell>This invitation has expired.</ErrorShell>;
  }

  let resourceName = "this project";
  if (inv.resource_kind === "project") {
    const { data: project } = await service
      .from("projects")
      .select("id, name")
      .eq("id", inv.resource_id)
      .maybeSingle();
    if (project) resourceName = (project as ProjectRow).name;
  }

  const user = await getServerUser();
  if (!user) {
    // Send them through sign-in, then back here.
    redirect(`/sign-in?next=${encodeURIComponent(`/accept-invite/${token}`)}`);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[420px]">
        <h1 className="mb-2 text-xl font-semibold">You’re invited</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          You’ve been invited to{" "}
          <span style={{ color: "var(--foreground)" }}>{resourceName}</span> as{" "}
          {inv.role}.
        </p>
        <form action={acceptInvitation}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Accept and open
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link
            href="/studio"
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Decline
          </Link>
        </p>
      </div>
    </main>
  );
}

function ErrorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[420px] text-center">
        <h1 className="mb-2 text-xl font-semibold">Invitation</h1>
        <p className="mb-6 text-sm text-muted-foreground">{children}</p>
        <Link
          href="/studio"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Open Studio
        </Link>
      </div>
    </main>
  );
}
