import "server-only";

/**
 * Service-role Supabase client — SERVER ONLY.
 *
 * Bypasses RLS. Used by the public share route (/s/<token>), which has
 * no user session: it validates a share token and returns ONLY the one
 * screen that token points at. Never import this from client code, and
 * never use it to return more than the token authorises.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
