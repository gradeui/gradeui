/**
 * Studio storage — public entry point.
 *
 * Exports the `StudioStorage` interface for types, and a factory
 * `getStudioStorage()` that picks the right backend:
 *
 *   - Supabase configured AND user signed in → SupabaseStudioStorage
 *   - otherwise → LocalStorageStudioStorage
 *
 * The decision is made per-call rather than once-at-boot because the
 * sign-in state can flip during a session (user signs in, signs out,
 * or first-sign-in migration moves data from local → cloud). The
 * cached instance is keyed on "signed-in user id or null" so
 * switching identities never serves the wrong adapter.
 */

import { getBrowserSupabase } from "@/lib/supabase/client";
import { LocalStorageStudioStorage } from "./local-adapter";
import { SupabaseStudioStorage } from "./supabase-adapter";
import type { StudioStorage } from "./types";

export type {
  Comment,
  CommentThread,
  CommentThreadStatus,
  CommentThreadWithMessages,
  Membership,
  OrgMembership,
  Organisation,
  Project,
  ProjectSnapshot,
  StudioStorage,
  Subject,
  Team,
  User,
} from "./types";

interface CacheEntry {
  /** "local" or the signed-in user id. Lets us invalidate when the
   *  user changes without spinning up two clients per render. */
  key: string;
  adapter: StudioStorage;
}

let cached: CacheEntry | null = null;

/** Returns the storage adapter appropriate to the current auth
 *  state. Callsites should call this on every render path that
 *  needs storage — it's cheap (cache hit unless identity changed). */
export function getStudioStorage(): StudioStorage {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    return getCachedLocal();
  }

  // The browser Supabase client exposes the cached session
  // synchronously via getSession() — but that's an async API. For
  // the factory we read from getBrowserSupabase()'s internal
  // session storage cookie, which the browser already has after
  // SupabaseProvider's onAuthStateChange fired. Going through
  // `auth.getSession()` here would force an async call site for
  // every storage read, which the rest of the codebase isn't
  // shaped for.
  //
  // Trade-off: between sign-in and the next render where the
  // provider has dispatched, we may return the local adapter for
  // one tick. That's fine — the provider triggers router.refresh()
  // on auth state change so the next render uses the right adapter.
  const session = readCurrentSessionSync();
  if (!session) {
    return getCachedLocal();
  }

  if (cached?.key === session.userId) return cached.adapter;
  const adapter = new SupabaseStudioStorage(supabase);
  cached = { key: session.userId, adapter };
  return adapter;
}

function getCachedLocal(): StudioStorage {
  if (cached?.key === "local") return cached.adapter;
  const adapter = new LocalStorageStudioStorage();
  cached = { key: "local", adapter };
  return adapter;
}

/** Reads the Supabase session from the browser-side auth storage
 *  synchronously. The Supabase SDK stores its session JSON under
 *  a localStorage key the project ref derives — we read it directly
 *  to keep `getStudioStorage()` synchronous. Returns null if no
 *  signed-in session is detected. */
function readCurrentSessionSync(): { userId: string } | null {
  if (typeof window === "undefined") return null;
  try {
    // The @supabase/ssr browser client stores its token under a
    // key of the form `sb-<project-ref>-auth-token`. The project
    // ref varies, so we scan storage rather than computing it.
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as
        | { user?: { id?: string } }
        | { currentSession?: { user?: { id?: string } } }
        | null;
      const uid =
        (parsed as { user?: { id?: string } } | null)?.user?.id ??
        (parsed as { currentSession?: { user?: { id?: string } } } | null)
          ?.currentSession?.user?.id;
      if (uid) return { userId: uid };
    }
    return null;
  } catch {
    return null;
  }
}

/** Clear the cached adapter — call this after sign-out so the next
 *  storage call returns the local adapter. The SupabaseProvider's
 *  onAuthStateChange handler dispatches this. */
export function resetStudioStorageCache(): void {
  cached = null;
}
