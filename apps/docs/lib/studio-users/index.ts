/**
 * Studio Users — public entry point.
 *
 * Exports types, the canonical local-user / local-team ids,
 * current-user accessors (function + hook), and permission helpers.
 * Today everything resolves against local stubs; tomorrow the
 * factory swaps in real auth without changing any call site.
 */

import * as React from "react";

import type {
  Action,
  Membership,
  OrgLimits,
  OrgMembership,
  OrgRole,
  Organisation,
  Plan,
  ResourceAccess,
  Role,
  Subject,
  Team,
  TeamRole,
  User,
} from "./types";

export type {
  Action,
  Membership,
  OrgLimits,
  OrgMembership,
  OrgRole,
  Organisation,
  Plan,
  ResourceAccess,
  Role,
  Subject,
  Team,
  TeamRole,
  User,
} from "./types";
export { isUserSubject, isTeamSubject } from "./types";
export { toneForUserId } from "./tone";

// Re-export the stable id constants from their dedicated file so
// `@/lib/studio-users` remains the canonical import path. Splitting
// the constants out lets session.tsx (which provides the React
// hooks below) import them without forming a cycle.
export {
  LOCAL_ORG_ID,
  LOCAL_TEAM_ID,
  LOCAL_USER_ID,
} from "./index-constants";
import {
  LOCAL_ORG_ID,
  LOCAL_TEAM_ID,
  LOCAL_USER_ID,
} from "./index-constants";

const LOCAL_USER: User = {
  id: LOCAL_USER_ID,
  name: "You",
  status: "active",
  // The local seed user starts as a super admin so the developer
  // can exercise the impersonation UI immediately. Production
  // users will NEVER get this flag — it's gated to internal staff
  // via a back-channel toggle when real auth lands.
  superAdmin: true,
};

/** Plan → default limits table. Read once when seeding a new org;
 *  the values are then stored on the org so per-customer custom
 *  limits override cleanly. Numbers are intentionally small for
 *  `free` so the limit-prompt UX gets exercised early; tune later. */
const PLAN_DEFAULTS: Record<Plan, OrgLimits> = {
  free: {
    projectLimit: 1,
    screensPerProjectLimit: 3,
    turnsPerScreenLimit: 5,
    teamLimit: 1,
    userLimit: 1,
    monthlyTurnBudget: 50,
  },
  pro: {
    projectLimit: 10,
    screensPerProjectLimit: 25,
    turnsPerScreenLimit: 50,
    teamLimit: 3,
    userLimit: 5,
    monthlyTurnBudget: 1000,
  },
  team: {
    projectLimit: 50,
    screensPerProjectLimit: 100,
    turnsPerScreenLimit: 200,
    teamLimit: 10,
    userLimit: 25,
    monthlyTurnBudget: 10000,
  },
  enterprise: {
    projectLimit: null,
    screensPerProjectLimit: null,
    turnsPerScreenLimit: null,
    teamLimit: null,
    userLimit: null,
    monthlyTurnBudget: null,
  },
};

/** Public reader for the plan defaults — used by storage seeds + UI
 *  that wants to show "free includes N projects". */
export function defaultLimitsForPlan(plan: Plan): OrgLimits {
  return { ...PLAN_DEFAULTS[plan] };
}

/** Build the canonical Default organisation. The seed user owns
 *  it; on real auth this gets re-keyed to the auth-provider's
 *  user id. */
export function buildDefaultOrg(now: number = Date.now()): Organisation {
  return {
    id: LOCAL_ORG_ID,
    name: "Default",
    createdAt: now,
    updatedAt: now,
    plan: "free",
    limits: defaultLimitsForPlan("free"),
  };
}

/** Membership row tying the local user to the Default org as admin. */
export function buildDefaultOrgMembership(): OrgMembership {
  return {
    userId: LOCAL_USER_ID,
    orgId: LOCAL_ORG_ID,
    role: "admin",
  };
}

/** Sync accessor for non-React contexts (storage adapters, page
 *  bootstrap, anywhere a hook would be awkward). Always returns
 *  the REAL local user — impersonation only affects React-tree
 *  reads via useCurrentUser. */
export function getCurrentUser(): User {
  return LOCAL_USER;
}

// useCurrentUser / useCurrentOrg / useImpersonation now live in
// ./session.tsx so they can resolve impersonation overrides via
// the React context. Re-exported here so the canonical import
// path stays `@/lib/studio-users`. The local `import` brings
// useCurrentUser into scope for the permission hooks defined
// later in this file.
export {
  UserSessionProvider,
  useCurrentOrg,
  useCurrentUser,
  useImpersonation,
} from "./session";
import { useCurrentUser } from "./session";

/** Numeric rank for project-scope roles, so the permission resolver
 *  can take the "highest" of several paths cleanly. */
const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

function higherRole(a: Role | null, b: Role | null): Role | null {
  if (!a) return b;
  if (!b) return a;
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}

/** Whether a project-scope role satisfies a requested action.
 *  Single source of truth for the role→action mapping — every
 *  callsite goes through here. */
function roleSatisfies(role: Role, action: Action): boolean {
  switch (action) {
    case "read":
      return true; // any role can read
    case "write":
      return role === "owner" || role === "editor";
    case "admin":
      return role === "owner";
  }
}

/** Resolve a user's effective role on a project by walking all
 *  permission paths — ownership, direct user grants, team grants
 *  via membership — and returning the highest match. `null` means
 *  no access at all.
 *
 *  v1 policy choices baked in here:
 *
 *   - Team-owned project → every team member resolves as `owner`.
 *     Mirrors Figma's "everyone in the team can do anything in the
 *     team's files." Tighten to member→editor / admin→owner later
 *     if you need granular team-internal permissions.
 *   - User-owned project (rare — true scratch) → only that user
 *     gets owner, regardless of any teams they're in.
 *   - Explicit access grants stack on top of ownership: a guest
 *     viewer grant on a team's project gets viewer access even if
 *     they're not in the team.
 */
export function resolveEffectiveRole(
  user: User,
  memberships: Membership[],
  owner: Subject,
  access: ResourceAccess[],
): Role | null {
  let best: Role | null = null;

  // Path 1 — ownership.
  if (owner.type === "user" && owner.id === user.id) {
    best = higherRole(best, "owner");
  } else if (owner.type === "team") {
    const inOwnerTeam = memberships.some(
      (m) => m.userId === user.id && m.teamId === owner.id,
    );
    if (inOwnerTeam) best = higherRole(best, "owner");
  }

  // Path 2 — direct user grants.
  for (const grant of access) {
    if (grant.subject.type === "user" && grant.subject.id === user.id) {
      best = higherRole(best, grant.role);
    }
  }

  // Path 3 — team grants via membership.
  const myTeamIds = new Set(
    memberships
      .filter((m) => m.userId === user.id)
      .map((m) => m.teamId),
  );
  for (const grant of access) {
    if (grant.subject.type === "team" && myTeamIds.has(grant.subject.id)) {
      best = higherRole(best, grant.role);
    }
  }

  return best;
}

/** Whether `user` can perform `action` on a project. */
export function canAccess(
  user: User,
  memberships: Membership[],
  owner: Subject,
  access: ResourceAccess[],
  action: Action,
): boolean {
  const role = resolveEffectiveRole(user, memberships, owner, access);
  return role !== null && roleSatisfies(role, action);
}

/** Hook form — pass the project's owner + access list and the
 *  action you're gating. Returns false during loading (no
 *  memberships yet) so UI naturally hides write affordances until
 *  data is in. */
export function useCanAccess(
  memberships: Membership[] | undefined | null,
  owner: Subject | undefined | null,
  access: ResourceAccess[] | undefined | null,
  action: Action,
): boolean {
  const user = useCurrentUser();
  return React.useMemo(() => {
    if (!memberships || !owner || !access) return false;
    return canAccess(user, memberships, owner, access, action);
  }, [user, memberships, owner, access, action]);
}

/** Team-scope: is this user an admin of this team? Admins can
 *  invite/remove members and change member roles. NOT
 *  automatically equivalent to project-owner; the project-scope
 *  resolver above runs independently. */
export function isTeamAdmin(
  user: User,
  teamId: string,
  memberships: Membership[],
): boolean {
  return memberships.some(
    (m) =>
      m.userId === user.id && m.teamId === teamId && m.role === "admin",
  );
}

/** Hook form — used to gate the "Invite / Remove / Change role" UI
 *  in team settings. */
export function useIsTeamAdmin(
  teamId: string | null | undefined,
  memberships: Membership[] | undefined | null,
): boolean {
  const user = useCurrentUser();
  return React.useMemo(() => {
    if (!teamId || !memberships) return false;
    return isTeamAdmin(user, teamId, memberships);
  }, [user, teamId, memberships]);
}

/** Default ownership for a project created locally — points at the
 *  local Personal team. Used by createProject + the storage
 *  migration that backfills onto pre-Teams projects. */
export function defaultOwnerForLocalUser(): Subject {
  return { type: "team", id: LOCAL_TEAM_ID };
}

/** Default access list for a fresh project. Empty by default —
 *  ownership alone is enough to grant the creator full access; we
 *  only add explicit access entries when someone is invited as
 *  guest or another team is shared in. */
export function defaultAccessForNewProject(): ResourceAccess[] {
  return [];
}

/** Build the canonical "Personal" team for a brand-new local user.
 *  Belongs to the Default org. Used by the storage migration when
 *  no team data exists yet. */
export function buildPersonalTeam(now: number = Date.now()): Team {
  return {
    id: LOCAL_TEAM_ID,
    name: "Personal",
    createdAt: now,
    updatedAt: now,
    orgId: LOCAL_ORG_ID,
  };
}

/** Membership row tying the local user to their Personal team as
 *  admin — they're the sole member, so by definition the admin. */
export function buildPersonalTeamMembership(): Membership {
  return {
    userId: LOCAL_USER_ID,
    teamId: LOCAL_TEAM_ID,
    role: "admin",
  };
}

/** Display label for a project role. */
export function roleLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
  }
}

/** Display label for a team role. */
export function teamRoleLabel(role: TeamRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "member":
      return "Member";
  }
}

/** Whether a user is in a team at all (any role). Useful for the
 *  "guest" UI derivation — a user with access to a team-owned
 *  project but NO membership in that team renders as Guest. */
export function isInTeam(
  user: User,
  teamId: string,
  memberships: Membership[],
): boolean {
  return memberships.some(
    (m) => m.userId === user.id && m.teamId === teamId,
  );
}
