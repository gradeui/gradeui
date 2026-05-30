import "server-only";

/**
 * Server-side Supabase clients.
 *
 * Two clients exposed here, deliberately separate:
 *
 *  - `getServerSupabase()` — anon-key client that piggybacks on the
 *    request's auth cookie. Use this for everything that should
 *    respect RLS (reading the signed-in user's own data). It's the
 *    workhorse for server components, route handlers, and server
 *    actions.
 *
 *  - `getServiceRoleSupabase()` — service-role client that BYPASSES
 *    RLS entirely. Use ONLY for trusted server operations that need
 *    to touch another user's rows: inserting a pending-invite user
 *    row, applying a signup-time migration that backfills membership
 *    rows the invited user can't create themselves. Never expose
 *    its results to the client without filtering — RLS is your
 *    safety net everywhere else, this client removes it.
 *
 * Both return null when Supabase isn't configured. Callers must
 * handle the local-only fallback.
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createClient,
  type SupabaseClient,
  type User as SupabaseUser,
} from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Anon-key client scoped to the current request's cookies. RLS
 *  applies — queries return only what the signed-in user can see. */
export async function getServerSupabase(): Promise<SupabaseClient | null> {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key) return null;
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* called from a server component (not a route/action) —
           * cookies are read-only here, the middleware handles the
           * refresh. Safe to ignore. */
        }
      },
    },
  });
}

/** Service-role client. RLS-bypassing. Server-only. Use sparingly. */
export function getServiceRoleSupabase(): SupabaseClient | null {
  const url = supabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Convenience: the signed-in Supabase user, or null. */
export async function getServerUser(): Promise<SupabaseUser | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
