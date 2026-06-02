/**
 * Supabase session refresh helper for the Next middleware.
 *
 * Supabase's auth tokens live in cookies. They expire silently and
 * the SDK refreshes them automatically — but only if it gets a
 * chance to write the new cookie back to the response. Server
 * components run after the response headers are committed, so they
 * can't refresh; the middleware is the one place that can.
 *
 * Call `updateSupabaseSession(req)` from the middleware on every
 * request. It:
 *   1. Builds a Supabase client bound to the request cookies.
 *   2. Touches `auth.getUser()` which transparently refreshes the
 *      session if the access token is near expiry.
 *   3. Writes any new cookies onto the response.
 *
 * Returns the user + the response carrying the refreshed cookies.
 * The middleware then decides whether to gate routes.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

export interface SessionRefreshResult {
  /** Pass-through response with refreshed cookies. The middleware
   *  must return THIS response (or a NextResponse.redirect/.rewrite
   *  derived from it, copying the cookies across). */
  response: NextResponse;
  /** The signed-in Supabase user, or null. Null means either not
   *  signed in OR Supabase isn't configured. */
  user: SupabaseUser | null;
  /** True when Supabase is configured. Lets the middleware skip the
   *  sign-in gate in local-only mode without re-checking env. */
  authConfigured: boolean;
}

/** Max time to wait on Supabase's getUser() inside the middleware before
 *  failing open. Kept well under Vercel's middleware wall-clock limit so a
 *  degraded Supabase never escalates to a MIDDLEWARE_INVOCATION_TIMEOUT. */
const GET_USER_TIMEOUT_MS = 2500;

export async function updateSupabaseSession(
  req: NextRequest,
): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request: req });

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    return { response, user: null, authConfigured: false };
  }

  // Cookie-gate: only call getUser() (a Supabase Auth round-trip) when the
  // request actually carries a Supabase auth cookie. Anonymous visitors —
  // most marketing / docs / embed traffic, plus the bulk of reload + test
  // traffic — have no session to refresh, so there's nothing for getUser()
  // to do. Skipping the network call for them keeps a flood of anonymous
  // requests from hammering Supabase Auth, and shrinks the failure surface
  // (pairs with the fail-open timeout below). The @supabase/ssr session
  // cookie is named `sb-<project-ref>-auth-token`, optionally chunked with
  // a `.0` / `.1` … suffix.
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => /^sb-.+-auth-token(\.\d+)?$/.test(c.name));
  if (!hasAuthCookie) {
    return { response, user: null, authConfigured: true };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          response = NextResponse.next({ request: req });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() forces a server-side verification of the token —
  // unlike getSession() which trusts the cookie blindly. RLS-bound
  // checks downstream rely on a verified user, so getUser() is what
  // we want here.
  //
  // CRITICAL: this is a network round-trip to Supabase, and it runs in
  // the middleware on (almost) every request. An un-timed `await` here
  // means a slow or down Supabase hangs the ENTIRE middleware until
  // Vercel kills it with MIDDLEWARE_INVOCATION_TIMEOUT (a 504) — taking
  // down public docs + marketing pages too, not just gated routes.
  //
  // So race it against a short timeout and FAIL OPEN: if Supabase doesn't
  // answer in time, serve the request with the user unresolved (null)
  // rather than 504. The cost of a degraded Supabase is then "sessions
  // aren't refreshed / gated routes bounce to sign-in for this request",
  // not "the whole site is down".
  let user: SupabaseUser | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), GET_USER_TIMEOUT_MS);
      }),
    ]);
    if (result !== "timeout" && !result.error) {
      user = result.data.user;
    }
  } catch {
    // Network error reaching Supabase — fail open, same as a timeout.
  } finally {
    if (timer) clearTimeout(timer);
  }

  return { response, user, authConfigured: true };
}
