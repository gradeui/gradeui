"use client";

/**
 * UserSessionProvider — the single source of truth for "who is the
 * current user" and "which org are we in" inside Studio.
 *
 * Today the real user is `LOCAL_USER` and the real org is the
 * Default org. When the developer is super-admin and toggles
 * impersonation via the SuperAdminSheet, this provider swaps the
 * exposed user + org over to the impersonated identity. Every
 * downstream hook (`useCurrentUser`, `useCurrentOrg`,
 * `useImpersonation`) reads from this context.
 *
 * The impersonation override is held in sessionStorage rather than
 * localStorage so that:
 *   - Closing the tab clears it (you can't "forget" you're
 *     impersonating between sessions).
 *   - It survives a refresh, which you'll do constantly while
 *     reproducing whatever you're impersonating to debug.
 *
 * When real auth lands, the only change here is `realUser` reads
 * from the auth provider instead of `LOCAL_USER`. Every consumer
 * stays put.
 */

import * as React from "react";

import { useSupabaseAuth } from "@/components/supabase-provider";
import { LOCAL_USER_ID } from "./index-constants";
import type { Organisation, User } from "./types";

interface SessionState {
  /** The actually-authenticated user. Today: a single local user
   *  loaded from storage. Tomorrow: comes from the auth provider's
   *  session. */
  realUser: User;
  /** The org the real user is currently active in. Distinct from
   *  the org list — a user can belong to many orgs but is "in" one
   *  at a time. Persisted to sessionStorage so a refresh restores
   *  context. */
  realOrg: Organisation | null;
  /** Impersonated user id, when active. */
  impersonatedUserId: string | null;
  /** Impersonated org id, when active. Can differ from the
   *  impersonated user's normal org — admin debugging an "Alice in
   *  Acme Corp" scenario picks both. */
  impersonatedOrgId: string | null;
  /** Resolved effective user — equals realUser when not
   *  impersonating, otherwise the matched user from the all-users
   *  list (or realUser if no match). */
  user: User;
  /** Resolved effective org — same resolution as `user`. */
  org: Organisation | null;
}

interface SessionContextValue {
  session: SessionState;
  /** Start (or change) impersonation. Pass null to clear that
   *  dimension while keeping the other. */
  startImpersonation: (input: {
    userId?: string | null;
    orgId?: string | null;
  }) => void;
  /** Clear both impersonation dimensions in one shot. */
  stopImpersonation: () => void;
}

const UserSessionContext = React.createContext<SessionContextValue | null>(
  null,
);

const IMPERSONATION_KEY = "grade:studio:impersonation";

interface PersistedImpersonation {
  userId: string | null;
  orgId: string | null;
}

interface UserSessionProviderProps {
  /** Every user the storage knows about. Used to resolve the
   *  impersonated user id back to a profile. */
  users: User[];
  /** Every org. Same role for impersonatedOrgId. */
  orgs: Organisation[];
  /** Which org is the real user "in" right now. Typically the
   *  Default org for the local user; later, the last org they
   *  switched into. */
  realOrgId: string | null;
  children: React.ReactNode;
}

export function UserSessionProvider({
  users,
  orgs,
  realOrgId,
  children,
}: UserSessionProviderProps) {
  // Prefer the signed-in Supabase user when present. Falls back to
  // the seeded local user — same shape as before — so the local-only
  // and signed-in code paths run through the same provider without
  // a hard branch.
  //
  // The resolution order is:
  //   1. Supabase user (`auth.user.id` matched against the users
  //      list — typically a row added by the on_auth_user_created
  //      trigger in 0001_studio_schema.sql).
  //   2. Synthesised user from Supabase claims (when the matching
  //      users row hasn't propagated yet — covers the few ms
  //      between sign-up and the public.users insert landing).
  //   3. The seeded local stub (LOCAL_USER_ID) — the original
  //      pre-auth behaviour for local-only deploys.
  const supabaseAuth = useSupabaseAuth();
  const supabaseUserId = supabaseAuth.user?.id ?? null;

  const realUser = React.useMemo<User>(() => {
    if (supabaseUserId) {
      const matched = users.find((u) => u.id === supabaseUserId);
      if (matched) return matched;
      const meta = supabaseAuth.user?.user_metadata ?? {};
      return {
        id: supabaseUserId,
        name:
          (meta.full_name as string | undefined) ??
          (meta.name as string | undefined) ??
          supabaseAuth.user?.email?.split("@")[0] ??
          "You",
        email: supabaseAuth.user?.email ?? undefined,
        avatarUrl: (meta.avatar_url as string | undefined) ?? undefined,
        status: "active",
      };
    }
    return (
      users.find((u) => u.id === LOCAL_USER_ID) ?? users[0] ?? {
        id: LOCAL_USER_ID,
        name: "You",
        status: "active" as const,
      }
    );
  }, [supabaseUserId, supabaseAuth.user, users]);
  const realOrg = realOrgId
    ? orgs.find((o) => o.id === realOrgId) ?? null
    : null;

  const [impersonatedUserId, setImpersonatedUserId] = React.useState<
    string | null
  >(null);
  const [impersonatedOrgId, setImpersonatedOrgId] = React.useState<
    string | null
  >(null);

  // Hydrate from sessionStorage once on mount. SSR-safe: ref-gated
  // so React 18's StrictMode double-invoke doesn't double-apply.
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(IMPERSONATION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedImpersonation;
      if (parsed?.userId) setImpersonatedUserId(parsed.userId);
      if (parsed?.orgId) setImpersonatedOrgId(parsed.orgId);
    } catch {
      /* corrupt — ignore */
    }
  }, []);

  // Persist on change (after hydration). sessionStorage = clears on
  // tab close, survives refresh.
  React.useEffect(() => {
    if (!hydratedRef.current) return;
    if (typeof window === "undefined") return;
    try {
      if (impersonatedUserId === null && impersonatedOrgId === null) {
        window.sessionStorage.removeItem(IMPERSONATION_KEY);
      } else {
        window.sessionStorage.setItem(
          IMPERSONATION_KEY,
          JSON.stringify({
            userId: impersonatedUserId,
            orgId: impersonatedOrgId,
          } as PersistedImpersonation),
        );
      }
    } catch {
      /* storage disabled — accept the loss; safer to lose
         impersonation state than to error in dev */
    }
  }, [impersonatedUserId, impersonatedOrgId]);

  const effectiveUser = React.useMemo(() => {
    if (!impersonatedUserId) return realUser;
    return users.find((u) => u.id === impersonatedUserId) ?? realUser;
  }, [impersonatedUserId, users, realUser]);

  const effectiveOrg = React.useMemo(() => {
    if (!impersonatedOrgId) return realOrg;
    return orgs.find((o) => o.id === impersonatedOrgId) ?? realOrg;
  }, [impersonatedOrgId, orgs, realOrg]);

  const startImpersonation = React.useCallback(
    (input: { userId?: string | null; orgId?: string | null }) => {
      if (input.userId !== undefined) setImpersonatedUserId(input.userId);
      if (input.orgId !== undefined) setImpersonatedOrgId(input.orgId);
    },
    [],
  );

  const stopImpersonation = React.useCallback(() => {
    setImpersonatedUserId(null);
    setImpersonatedOrgId(null);
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      session: {
        realUser,
        realOrg,
        impersonatedUserId,
        impersonatedOrgId,
        user: effectiveUser,
        org: effectiveOrg,
      },
      startImpersonation,
      stopImpersonation,
    }),
    [
      realUser,
      realOrg,
      impersonatedUserId,
      impersonatedOrgId,
      effectiveUser,
      effectiveOrg,
      startImpersonation,
      stopImpersonation,
    ],
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

/** Internal hook — components consume the three exported hooks
 *  below rather than this one. */
function useSessionInternal(): SessionContextValue | null {
  return React.useContext(UserSessionContext);
}

/** The effective current user — impersonated identity when active,
 *  otherwise the real auth user. Falls back to a local stub when
 *  no provider is mounted (e.g. an embed surface without the
 *  Studio shell). */
export function useCurrentUser(): User {
  const ctx = useSessionInternal();
  if (ctx) return ctx.session.user;
  return {
    id: LOCAL_USER_ID,
    name: "You",
    status: "active",
  };
}

/** The effective current org. Null when no provider is mounted or
 *  when the user belongs to no org. */
export function useCurrentOrg(): Organisation | null {
  const ctx = useSessionInternal();
  return ctx?.session.org ?? null;
}

/** Impersonation control surface — used by the SuperAdminSheet and
 *  by the "Stop impersonating" pill in the topbar. */
export function useImpersonation() {
  const ctx = useSessionInternal();
  if (!ctx) {
    throw new Error(
      "useImpersonation must be used inside a <UserSessionProvider>",
    );
  }
  const isImpersonating =
    ctx.session.impersonatedUserId !== null ||
    ctx.session.impersonatedOrgId !== null;
  return {
    isImpersonating,
    realUser: ctx.session.realUser,
    realOrg: ctx.session.realOrg,
    currentUser: ctx.session.user,
    currentOrg: ctx.session.org,
    impersonatedUserId: ctx.session.impersonatedUserId,
    impersonatedOrgId: ctx.session.impersonatedOrgId,
    startImpersonation: ctx.startImpersonation,
    stopImpersonation: ctx.stopImpersonation,
  };
}
