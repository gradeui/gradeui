/**
 * Studio Users — types.
 *
 * Collaboration model. Three first-class entities + the grants that
 * tie them together:
 *
 *   - User       — a person with auth identity (real later; local stub today).
 *   - Team       — a named container of users that can own projects and
 *                  receive access grants. Every user has at least a
 *                  "Personal" team (a team-of-one) — every project lives
 *                  inside SOME team, even individual scratch work.
 *   - Membership — User × Team with a team-scope role (admin or member).
 *                  Admins can invite, remove, change roles inside the team.
 *
 * Project ownership is polymorphic: a project is owned either by a user
 * directly (rare — true "personal scratch") or by a team. Access grants
 * on top of ownership are also polymorphic — a project can grant editor
 * role to a team OR to a specific user (e.g. guest invites).
 *
 * Two role hierarchies, kept separate:
 *
 *   PROJECT-SCOPE roles (`Role`):
 *     - owner  — full control: edit, manage access, delete
 *     - editor — read + write content
 *     - viewer — read only
 *
 *   TEAM-SCOPE roles (`TeamRole`):
 *     - admin  — manage team membership (invite, remove, change roles)
 *     - member — just in the team
 *
 *   Team-admin status is NOT inherited as project-owner role. A team
 *   admin can manage who's in the team but isn't automatically owner
 *   on every project the team holds. (For products that conflate
 *   these — Linear-style — the consumer can layer that policy on top.)
 *
 * Effective access for a user on a project resolves by walking ALL
 * paths and taking the highest role found:
 *
 *   1. Did the user directly own the project? → owner
 *   2. Is the user a member of the project's owning team? → owner
 *      (team-owned projects treat every team member as owner v1; this
 *      can tighten to member→editor + admin→owner later.)
 *   3. Direct user grant in `access` → that role
 *   4. Team grant for any team the user is a member of → that role
 *
 * Roles compare by hierarchy (owner > editor > viewer); the resolver
 * returns the highest matched. See canAccess in ./index.ts.
 *
 * "Guest" isn't a separate type — it's a derived state: a user with
 * an access grant on a project but no membership in the project's
 * owning team. UI labels them "Guest" when relevant.
 */

/** Project-scope role assignment. */
export type Role = "owner" | "editor" | "viewer";

/** Team-scope role assignment. Distinct from project Role because
 *  team responsibilities (manage membership) and project
 *  responsibilities (edit content) are independent concerns. */
export type TeamRole = "admin" | "member";

/** Org-scope role assignment.
 *  - `admin`  — can create/rename/delete teams within the org,
 *                manage org membership, change plan + billing.
 *  - `member` — can be added to teams within the org, otherwise
 *                no special powers at the org level.
 *
 *  Same logical level as TeamRole but scoped to the Organisation
 *  entity that sits above teams. */
export type OrgRole = "admin" | "member";

/** Plan identifier — coarse buckets a billing system can map to
 *  Stripe products. Limits attached to each are encoded in the
 *  `OrgLimits` object on the Organisation, not derived from this
 *  enum alone, so a custom-tier enterprise customer can carry the
 *  plan label "enterprise" + tuned limits without code changes. */
export type Plan = "free" | "pro" | "team" | "enterprise";

/** Quantitative limits attached to an Organisation. Reading these
 *  doesn't enforce them — that wires in later when billing lands.
 *  Today the values exist so the schema is shaped right.
 *
 *  `null` on any field means "no limit". */
export interface OrgLimits {
  /** Max projects across all teams in the org. null = unlimited. */
  projectLimit: number | null;
  /** Max screens per project. */
  screensPerProjectLimit: number | null;
  /** Max chat turns per screen. */
  turnsPerScreenLimit: number | null;
  /** Max teams in the org. */
  teamLimit: number | null;
  /** Max users in the org. */
  userLimit: number | null;
  /** Per-month aggregate turn budget across the org. null = unlimited. */
  monthlyTurnBudget: number | null;
}

/** Action being checked at the PROJECT level. Use the most specific
 *  that fits — write passes for editor + owner; admin only for
 *  owner. Bottom out through `canAccess` so the role hierarchy
 *  stays in one place. */
export type Action = "read" | "write" | "admin";

/** A user profile. Local stub today, populated by auth provider
 *  later. */
export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  /** Lifecycle status — `unverified` means the user has signed up
   *  but not clicked the email-verification link; mutating actions
   *  should be gated. `active` is the normal state. `suspended`
   *  blocks sign-in entirely. Defaults to `active` for the local
   *  user (no auth = no verification step yet). */
  status?: "unverified" | "active" | "suspended";
  /** When true the user can impersonate other users + orgs via
   *  the SuperAdminSheet. Real-product users NEVER have this —
   *  it's gated to internal staff via a back-channel toggle. The
   *  local seed user starts with this true so the developer can
   *  exercise impersonation while building. */
  superAdmin?: boolean;
}

/** An Organisation — the top of the entity hierarchy:
 *
 *    Organisation
 *      └─ Teams
 *           └─ Projects
 *                └─ Screens
 *
 *  Billing, plan, and aggregate usage limits attach here. A user
 *  can belong to multiple orgs via OrgMembership (think "my
 *  freelance org" + "my employer org"). Each org has independent
 *  billing.
 *
 *  `stripeCustomerId` is reserved for the day Stripe wires in;
 *  today it stays undefined. */
export interface Organisation {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** Coarse plan bucket; maps to Stripe products eventually. */
  plan: Plan;
  /** Limits enforced (or not, today) against this org. Driven off
   *  the plan in normal flows but stored as concrete values so an
   *  enterprise customer can have custom limits without a code
   *  change. */
  limits: OrgLimits;
  /** Stripe Customer id when billing wires in. Undefined today. */
  stripeCustomerId?: string;
}

/** User × Organisation relation. Mirrors Membership for teams.
 *  Distinct from Membership because org-scope roles (admin vs
 *  member) carry different powers than team-scope roles. */
export interface OrgMembership {
  userId: string;
  orgId: string;
  role: OrgRole;
}

/** A team. Names are user-chosen and not unique; the id is stable.
 *  Every project's `owner` typically references a team. Teams now
 *  belong to an Organisation — see `orgId`. Pre-v5 teams without an
 *  orgId get backfilled onto the Default org by the storage
 *  migration. */
export interface Team {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** The Organisation this team belongs to. Always present after
   *  v5 migration. */
  orgId: string;
}

/** User × Team relation. One row per (user, team) pair — a user can
 *  belong to many teams (work, side project, design community), a
 *  team can have many users. */
export interface Membership {
  userId: string;
  teamId: string;
  role: TeamRole;
}

/** Polymorphic grant subject — either a single user or an entire
 *  team. Used in `ResourceAccess.subject` and in
 *  `Project.owner`. Discriminated union on `type` so resolvers can
 *  branch cleanly. */
export type Subject =
  | { type: "user"; id: string }
  | { type: "team"; id: string };

/** A single grant on a resource. Either a user (direct invite, guest)
 *  or a team (every member inherits this role). The role here is the
 *  PROJECT-level role granted by the entry. */
export interface ResourceAccess {
  subject: Subject;
  role: Role;
}

/** Convenience predicate — narrows a subject to the user branch. */
export function isUserSubject(
  s: Subject,
): s is { type: "user"; id: string } {
  return s.type === "user";
}

/** Convenience predicate — narrows to the team branch. */
export function isTeamSubject(
  s: Subject,
): s is { type: "team"; id: string } {
  return s.type === "team";
}
