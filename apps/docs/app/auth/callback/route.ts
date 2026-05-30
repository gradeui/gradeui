/**
 * Supabase OAuth + magic-link callback.
 *
 * Both the Google OAuth flow and the email magic-link flow finish
 * by redirecting the user to:
 *
 *   /auth/callback?code=<one-time-pkce-code>&next=<where-to-go>
 *
 * This handler exchanges the code for a session (sets the
 * supabase-auth cookies) then redirects to `next` — typically
 * /studio. The `next` param is path-validated to prevent
 * open-redirect via crafted query strings.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  // Only allow same-origin paths beginning with /. Anything else
  // could be an attacker phishing via /auth/callback?next=https://evil
  if (!raw) return "/studio";
  if (!raw.startsWith("/")) return "/studio";
  if (raw.startsWith("//")) return "/studio";
  return raw;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    // No code = something went wrong upstream. Send the user back
    // to sign-in with a flag so the page can surface the error.
    return NextResponse.redirect(
      new URL("/sign-in?error=missing_code", req.url),
    );
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    // Auth not configured — shouldn't really happen if the user got
    // here via a sign-in button, but bail safely.
    return NextResponse.redirect(new URL("/", req.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, req.url),
    );
  }

  return NextResponse.redirect(new URL(next, req.url));
}
