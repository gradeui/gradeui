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

export async function updateSupabaseSession(
  req: NextRequest,
): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request: req });

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) {
    return { response, user: null, authConfigured: false };
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
  const { data, error } = await supabase.auth.getUser();

  return {
    response,
    user: error ? null : data.user,
    authConfigured: true,
  };
}
