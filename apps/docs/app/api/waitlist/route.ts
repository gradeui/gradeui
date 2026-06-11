import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * POST /api/waitlist — public early-access signup.
 *
 * Body: { firstName, lastName, email, company?, teamSize?, role?, notes? }
 *
 * Storage: `waitlist_signups` (migration 0018). RLS is enabled with NO
 * public policies — rows are written via the service-role client only,
 * matching the invitations pattern. In local-only mode (no Supabase env)
 * the submission is accepted and logged so the form still works in dev.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clip = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
};

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const firstName = clip(body.firstName, 80);
  const lastName = clip(body.lastName, 80);
  const email = clip(body.email, 320)?.toLowerCase() ?? null;

  if (!firstName || !lastName || !email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "firstName, lastName and a valid email are required" },
      { status: 400 },
    );
  }

  const row = {
    email,
    first_name: firstName,
    last_name: lastName,
    company: clip(body.company, 160),
    team_size: clip(body.teamSize, 40),
    role: clip(body.role, 80),
    notes: clip(body.notes, 2000),
  };

  const supabase = getServiceSupabase();
  if (!supabase) {
    // Local-only mode — accept so the flow is testable without keys.
    console.warn("[waitlist] Supabase not configured; signup not persisted:", row.email);
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Upsert on email — re-submitting updates the answers instead of erroring.
  const { error } = await supabase
    .from("waitlist_signups")
    .upsert(row, { onConflict: "email" });

  if (error) {
    console.error("[waitlist] insert failed:", error.message);
    return NextResponse.json({ error: "Could not save signup" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
