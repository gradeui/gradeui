/**
 * Sign-out route — POST only.
 *
 * Invoked from the topbar's user menu via a form submission so the
 * cookies get cleared by the SDK on the server side (a client-only
 * signOut() still works but won't kill the HttpOnly refresh-token
 * cookie reliably across browsers). The form posts here and the
 * handler clears the session then redirects home.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
