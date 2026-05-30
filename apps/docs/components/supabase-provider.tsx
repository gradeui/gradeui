"use client";

/**
 * SupabaseProvider — surfaces the browser Supabase client + the
 * current session to the React tree, and refreshes the server
 * (via router.refresh()) whenever auth state changes so server
 * components re-fetch their data with the new identity.
 *
 * Replaces the previous next-auth SessionProvider. Studio's
 * UserSessionProvider reads from this via `useSupabaseAuth()` to
 * resolve `realUser` from the Supabase session when present, with
 * a fall-through to the local seed user otherwise.
 *
 * Local-only mode: when `getBrowserSupabase()` returns null, the
 * provider mounts but never sets a user. Studio sees `user: null`
 * and falls back to the local seed user — same behaviour as before
 * the Supabase cutover.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import type {
  Session,
  SupabaseClient,
  User as SupabaseUser,
} from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { maybeRunFirstSignInMigration } from "@/lib/studio-storage/migration";
import { resetStudioStorageCache } from "@/lib/studio-storage";

interface SupabaseAuthContextValue {
  /** The browser Supabase client. Null in local-only mode. */
  supabase: SupabaseClient | null;
  /** The signed-in user. Null when signed-out or local-only. */
  user: SupabaseUser | null;
  /** Has the initial getSession() resolved yet? Distinguishes
   *  "loading" from "definitely not signed in" so consumers don't
   *  flash a sign-in CTA before hydration completes. */
  loaded: boolean;
}

const SupabaseAuthContext =
  React.createContext<SupabaseAuthContextValue | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [supabase] = React.useState(() => getBrowserSupabase());
  const [session, setSession] = React.useState<Session | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!supabase) {
      // Local-only mode — nothing to subscribe to, just flip loaded.
      setLoaded(true);
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoaded(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        // Invalidate the storage adapter cache — the next
        // getStudioStorage() call must pick up the new identity
        // (or fall back to local on sign-out).
        resetStudioStorageCache();
        // Run the first-sign-in local→cloud migration once per
        // account. The function is idempotent (gated by a flag in
        // user_metadata) so re-firing for SIGNED_IN events is
        // safe; the second run no-ops.
        if (event === "SIGNED_IN" && nextSession?.user) {
          void maybeRunFirstSignInMigration(supabase, nextSession.user);
        }
        // Tell Next to re-render server components — they may have
        // gated on auth, and the cookie just changed.
        router.refresh();
      },
    );
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase, router]);

  const value = React.useMemo<SupabaseAuthContextValue>(
    () => ({ supabase, user: session?.user ?? null, loaded }),
    [supabase, session, loaded],
  );

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

/** Read the Supabase auth context. Returns a no-auth value if no
 *  provider is mounted (e.g. the fast-sandbox iframe) so consumers
 *  can call this unconditionally. */
export function useSupabaseAuth(): SupabaseAuthContextValue {
  return (
    React.useContext(SupabaseAuthContext) ?? {
      supabase: null,
      user: null,
      loaded: true,
    }
  );
}
