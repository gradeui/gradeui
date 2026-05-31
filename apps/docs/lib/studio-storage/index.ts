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
import { supabaseUrl } from "@/lib/supabase/env";
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
  ScreenRevision,
  ShareLink,
  ShareViewport,
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

/** Authoritative current user id, pushed in by `SupabaseProvider`
 *  whenever auth state resolves or changes:
 *    - `undefined` → provider hasn't reported yet; fall back to
 *      reading the auth cookie synchronously (covers the very first
 *      render after a sign-in redirect, before React effects run).
 *    - `null`      → signed out.
 *    - string      → the signed-in user id.
 *  Using the SDK-parsed id (when available) avoids decoding the
 *  cookie ourselves. */
let reportedUserId: string | null | undefined = undefined;

/** Called by `SupabaseProvider` on every auth-state change. Pushing
 *  the id in (rather than having the factory poll) means a same-tab
 *  sign-in / sign-out flips the backend without a cookie re-parse. */
export function setStudioStorageUserId(id: string | null): void {
  if (reportedUserId === id) return;
  reportedUserId = id;
  // Identity changed — drop the cached adapter so the next call
  // builds the right one.
  cached = null;
}

/** Returns the storage adapter appropriate to the current auth
 *  state. Callsites should call this on every render path that
 *  needs storage — it's cheap (cache hit unless identity changed). */
export function getStudioStorage(): StudioStorage {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    return getCachedLocal();
  }

  // Prefer the provider-reported id; before the provider has spoken
  // (first render after a redirect), fall back to reading the auth
  // cookie. `@supabase/ssr` stores the session in COOKIES, not
  // localStorage — reading the cookie synchronously is what lets the
  // very first render pick the cloud adapter instead of flashing the
  // local one for the whole session.
  const userId =
    reportedUserId !== undefined ? reportedUserId : readUserIdSync();
  if (!userId) {
    return getCachedLocal();
  }

  if (cached?.key === userId) return cached.adapter;
  const adapter = new SupabaseStudioStorage(supabase);
  cached = { key: userId, adapter };
  return adapter;
}

function getCachedLocal(): StudioStorage {
  if (cached?.key === "local") return cached.adapter;
  const adapter = new LocalStorageStudioStorage();
  cached = { key: "local", adapter };
  return adapter;
}

/** Synchronously resolve the signed-in user id from the browser's
 *  auth state. Primary source is the `@supabase/ssr` auth COOKIE
 *  (`sb-<project-ref>-auth-token`, possibly chunked `.0`, `.1`, …);
 *  a legacy localStorage token is tried as a fallback. Returns null
 *  when no signed-in session is detectable. */
function readUserIdSync(): string | null {
  if (typeof document === "undefined") return null;
  return readUserIdFromCookie() ?? readUserIdFromLocalStorage();
}

function readUserIdFromCookie(): string | null {
  try {
    const ref = projectRefFromUrl();
    const base = ref ? `sb-${ref}-auth-token` : null;
    const cookies = document.cookie.split("; ").map((c) => {
      const eq = c.indexOf("=");
      return { name: c.slice(0, eq), value: c.slice(eq + 1) };
    });
    const matches = cookies.filter((c) =>
      base
        ? c.name === base || c.name.startsWith(`${base}.`)
        : /^sb-.+-auth-token(\.\d+)?$/.test(c.name),
    );
    if (matches.length === 0) return null;
    // Concatenate chunk values in numeric order (unchunked = -1 sorts
    // first), then decode.
    matches.sort((a, b) => chunkIndex(a.name) - chunkIndex(b.name));
    let raw = matches.map((c) => decodeURIComponent(c.value)).join("");
    if (raw.startsWith("base64-")) {
      raw = base64Decode(raw.slice("base64-".length));
    }
    return extractUserId(JSON.parse(raw));
  } catch {
    return null;
  }
}

function readUserIdFromLocalStorage(): string | null {
  try {
    if (typeof window === "undefined") return null;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const id = extractUserId(JSON.parse(raw));
      if (id) return id;
    }
    return null;
  } catch {
    return null;
  }
}

/** Pull `<ref>` out of `https://<ref>.supabase.co`. */
function projectRefFromUrl(): string | null {
  const url = supabaseUrl();
  if (!url) return null;
  return url.match(/^https?:\/\/([^.]+)\./)?.[1] ?? null;
}

function chunkIndex(name: string): number {
  const m = name.match(/\.(\d+)$/);
  return m ? Number(m[1]) : -1;
}

/** Tolerant base64 decode — handles the url-safe alphabet some
 *  versions emit. */
function base64Decode(b64: string): string {
  return atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
}

/** Dig the user id out of a parsed session payload, whichever shape
 *  the SDK persisted it in (bare Session, `{ currentSession }`, or an
 *  array wrapper). */
function extractUserId(parsed: unknown): string | null {
  const fromObj = (o: unknown): string | null => {
    const s = o as
      | { user?: { id?: string }; currentSession?: { user?: { id?: string } } }
      | null
      | undefined;
    return s?.user?.id ?? s?.currentSession?.user?.id ?? null;
  };
  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      const id = fromObj(item);
      if (id) return id;
    }
    return null;
  }
  return fromObj(parsed);
}

/** Clear the cached adapter — call this after sign-out so the next
 *  storage call returns the local adapter. The SupabaseProvider's
 *  onAuthStateChange handler dispatches this. */
export function resetStudioStorageCache(): void {
  cached = null;
}
