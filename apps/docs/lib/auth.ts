/**
 * Auth shim — kept for back-compat while callsites migrate.
 *
 * The real auth surface now lives at `@/lib/supabase/server` and
 * `@/lib/supabase/client`. NextAuth was removed in the Supabase
 * cutover (see SETUP-AUTH.md). This module re-exports a thin
 * `auth()` that returns a NextAuth-compat session shape so any
 * untouched importers keep typechecking.
 *
 * New code should import from `@/lib/supabase/server` instead.
 */

import { getServerUser } from "./supabase/server";

interface CompatSession {
  user: { id: string; email?: string; name: string };
  accessToken?: string;
}

/** Compatibility shim — returns the Supabase user shape under the
 *  NextAuth-style `session.user` envelope. Returns null when no
 *  session is present OR when Supabase isn't configured (local-only
 *  mode). New code should call `getServerUser()` directly. */
export async function auth(): Promise<CompatSession | null> {
  const user = await getServerUser();
  if (!user) return null;
  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";
  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      name,
    },
  };
}
