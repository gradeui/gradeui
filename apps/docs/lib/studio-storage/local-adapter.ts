/**
 * Browser localStorage adapter for StudioStorage.
 *
 * Key layout:
 *   grade:studio:storage-version    — int (current = CURRENT_VERSION).
 *   grade:studio:active-project-id  — string. Cross-session pointer.
 *   grade:studio:projects           — JSON: { projects: Project[] }.
 *                                      Metadata-only index — keeps
 *                                      `listProjects` cheap.
 *   grade:studio:project:<id>       — JSON: PersistedProject. One per
 *                                      project; loaded only when needed.
 *   grade:studio:teams              — JSON: { teams: Team[] }.
 *   grade:studio:memberships        — JSON: { rows: Membership[] }.
 *
 * Migration chain (incremental, idempotent):
 *   v0 → v1 (implicit) — single-session blob at `grade:studio:session`.
 *   v1 → v2 — split into projects + per-project snapshot keys.
 *   v2 → v3 — backfill `ownerId` + `access` (legacy flat shape).
 *   v3 → v4 — introduce Teams: add Personal team + membership,
 *             rewrite legacy `ownerId`/`access` to polymorphic
 *             `owner`/`access` shape, re-home every project's owner
 *             onto the Personal team.
 */

import type { UIMessage } from "ai";
import { initialDesigns, type Design } from "@/lib/studio-designs";
import {
  nextCommentId,
  nextThreadId,
  type Comment,
  type CommentThread,
  type CommentThreadWithMessages,
} from "@/lib/studio-comments";
import {
  LOCAL_ORG_ID,
  LOCAL_TEAM_ID,
  LOCAL_USER_ID,
  buildDefaultOrg,
  buildDefaultOrgMembership,
  buildPersonalTeam,
  buildPersonalTeamMembership,
  defaultAccessForNewProject,
  defaultLimitsForPlan,
  defaultOwnerForLocalUser,
  type Membership,
  type OrgMembership,
  type Organisation,
  type ResourceAccess,
  type Subject,
  type Team,
  type User,
} from "@/lib/studio-users";

import type { Project, ProjectSnapshot, StudioStorage } from "./types";

const VERSION_KEY = "grade:studio:storage-version";
const ACTIVE_KEY = "grade:studio:active-project-id";
const PROJECTS_KEY = "grade:studio:projects";
const PROJECT_KEY_PREFIX = "grade:studio:project:";
const TEAMS_KEY = "grade:studio:teams";
const MEMBERSHIPS_KEY = "grade:studio:memberships";
const USERS_KEY = "grade:studio:users";
const ORGS_KEY = "grade:studio:orgs";
const ORG_MEMBERSHIPS_KEY = "grade:studio:org-memberships";
const COMMENTS_KEY_PREFIX = "grade:studio:comments:";
const LEGACY_SESSION_KEY = "grade:studio:session";

/** Comment storage key for a (project, design) pair. One blob per
 *  screen — the panel only needs the active screen's threads at a
 *  time, and grouping per-screen keeps each write small. */
function commentsKey(projectId: string, designId: string): string {
  return `${COMMENTS_KEY_PREFIX}${projectId}:${designId}`;
}

interface PersistedCommentBundle {
  threads: CommentThread[];
  comments: Comment[];
}

function loadCommentBundle(
  storage: Storage,
  projectId: string,
  designId: string,
): PersistedCommentBundle {
  const raw = storage.getItem(commentsKey(projectId, designId));
  const parsed = safeJsonParse<PersistedCommentBundle>(raw);
  return parsed ?? { threads: [], comments: [] };
}

function saveCommentBundle(
  storage: Storage,
  projectId: string,
  designId: string,
  bundle: PersistedCommentBundle,
): void {
  storage.setItem(commentsKey(projectId, designId), JSON.stringify(bundle));
}

const CURRENT_VERSION = 5;
const DEFAULT_PROJECT_ID = "p-default";
const DEFAULT_PROJECT_NAME = "Default project";

function projectKey(id: string): string {
  return `${PROJECT_KEY_PREFIX}${id}`;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Returns the global localStorage if available, or null on the server
 *  (SSR) and in browsers where the storage API is disabled (private
 *  mode + quota-blocked Safari). Every method falls back gracefully
 *  when this is null — Studio is a client-only experience so SSR pages
 *  just render their default state without persistence. */
function ssrSafeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    // Touch the API to catch the "SecurityError" some browsers raise
    // before any read/write actually happens.
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Mint a short project id. Mirrors `studio-designs.nextId` so client
 *  ids look consistent across the codebase. Not used for the seed
 *  project (`p-default`) — that one is deterministic so the migration
 *  can write to a known key on every install. */
function nextProjectId(): string {
  return (
    "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

function nextTeamId(): string {
  return (
    "t-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  );
}

interface PersistedProjectIndex {
  projects: Project[];
}

interface PersistedTeamIndex {
  teams: Team[];
}

interface PersistedMembershipIndex {
  rows: Membership[];
}

interface PersistedUserIndex {
  users: User[];
}

interface PersistedOrgIndex {
  orgs: Organisation[];
}

interface PersistedOrgMembershipIndex {
  rows: OrgMembership[];
}

/** Pre-v5 team shape — no orgId. Used by the migration to read
 *  legacy data. */
interface PreV5Team {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  orgId?: string;
}

interface PreV5TeamIndex {
  teams: PreV5Team[];
}

interface PersistedProject {
  project: Project;
  designs: Design[];
  activeDesignId: string;
  messagesByDesign: Record<string, UIMessage[]>;
  notesByDesign: Record<string, string>;
  themeDraftJson?: string;
}

/** Pre-v4 project shape carrying the flat ownerId + access. Kept
 *  here (not imported) so the migration can parse old data without
 *  the current Project type complaining. */
interface PreV4Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  ownerId?: string;
  access?: Array<{ userId: string; role: ResourceAccess["role"] }>;
}

interface PreV4ProjectIndex {
  projects: PreV4Project[];
}

interface PreV4PersistedProject {
  project: PreV4Project;
  designs: Design[];
  activeDesignId: string;
  messagesByDesign: Record<string, UIMessage[]>;
  notesByDesign: Record<string, string>;
  themeDraftJson?: string;
}

/** Old v1 session blob shape. Kept here (not imported) so deleting
 *  the legacy code paths in the future doesn't depend on schema we
 *  no longer ship. */
interface LegacyV1Session {
  designs?: Design[];
  activeId?: string;
  messagesByDesign?: Record<string, UIMessage[]>;
  notesByDesign?: Record<string, string>;
}

export class LocalStorageStudioStorage implements StudioStorage {
  /** True after `ensureHydrated` has run the migration check. Local
   *  to the instance so a hot-reloaded module reruns hydration once
   *  per session. */
  private hydrated = false;

  /** Idempotent migration gate. Called from every public method
   *  before any read — guarantees a user on any older version
   *  lands on `CURRENT_VERSION` layout before the page sees data.
   *  Migrations run incrementally (v1→v2, then v2→v3, …) so a user
   *  upgrading from a much older release still walks every step. */
  private ensureHydrated(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    const storage = ssrSafeStorage();
    if (!storage) return;
    const versionRaw = storage.getItem(VERSION_KEY);
    const version = safeJsonParse<number>(versionRaw) ?? 0;
    if (version === CURRENT_VERSION) return;
    try {
      // Chain of incremental upgrades.
      if (version < 2) this.migrateV1toV2(storage);
      if (version < 3) this.migrateV2toV3(storage);
      if (version < 4) this.migrateV3toV4(storage);
      if (version < 5) this.migrateV4toV5(storage);
      storage.setItem(VERSION_KEY, JSON.stringify(CURRENT_VERSION));
    } catch (err) {
      // Migration is best-effort. If it fails (corrupt JSON, quota,
      // etc.), leave the version unset so the next session retries
      // — but mark as hydrated for THIS session so we don't loop.
      // eslint-disable-next-line no-console
      console.warn("[studio-storage] migration failed:", err);
    }
  }

  /** v1 → v2: lift the single-session blob into a "Default project".
   *  Writes the intermediate v2 shape (no ownerId / access yet);
   *  subsequent migrations fill those in. */
  private migrateV1toV2(storage: Storage): void {
    const legacy = safeJsonParse<LegacyV1Session>(
      storage.getItem(LEGACY_SESSION_KEY),
    );

    // If the user already has a v2 index (mid-rollout scenarios),
    // respect it.
    const existingIndex = safeJsonParse<PreV4ProjectIndex>(
      storage.getItem(PROJECTS_KEY),
    );
    if (existingIndex?.projects?.length) return;

    const now = Date.now();
    const defaultProject: PreV4Project = {
      id: DEFAULT_PROJECT_ID,
      name: DEFAULT_PROJECT_NAME,
      createdAt: now,
      updatedAt: now,
    };

    const designs =
      legacy?.designs && legacy.designs.length > 0
        ? legacy.designs
        : initialDesigns();
    const activeDesignId =
      legacy?.activeId && designs.some((d) => d.id === legacy.activeId)
        ? legacy.activeId
        : designs[0].id;

    const snapshot: PreV4PersistedProject = {
      project: defaultProject,
      designs,
      activeDesignId,
      messagesByDesign: legacy?.messagesByDesign ?? {},
      notesByDesign: legacy?.notesByDesign ?? {},
    };

    storage.setItem(projectKey(defaultProject.id), JSON.stringify(snapshot));
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: [defaultProject] } as PreV4ProjectIndex),
    );
    storage.setItem(ACTIVE_KEY, defaultProject.id);
    // Intentionally NOT removing LEGACY_SESSION_KEY — safety net.
  }

  /** v2 → v3: add `ownerId` + `access` (flat shape) to every
   *  project + persisted snapshot. Idempotent. */
  private migrateV2toV3(storage: Storage): void {
    const index = safeJsonParse<PreV4ProjectIndex>(
      storage.getItem(PROJECTS_KEY),
    );
    if (!index?.projects) return;

    const backfilled: PreV4Project[] = index.projects.map((p) => ({
      ...p,
      ownerId: p.ownerId ?? LOCAL_USER_ID,
      access: p.access ?? [
        { userId: LOCAL_USER_ID, role: "owner" as const },
      ],
    }));
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: backfilled } as PreV4ProjectIndex),
    );

    for (const p of backfilled) {
      const snap = safeJsonParse<PreV4PersistedProject>(
        storage.getItem(projectKey(p.id)),
      );
      if (!snap) continue;
      const nextSnap: PreV4PersistedProject = {
        ...snap,
        project: p,
      };
      storage.setItem(projectKey(p.id), JSON.stringify(nextSnap));
    }
  }

  /** v3 → v4: introduce Teams. Three things happen:
   *
   *   1. Create the Personal team + a Membership row for the local
   *      user (admin role).
   *   2. Polymorph every project's owner: legacy `ownerId: "u-local"`
   *      becomes `owner: { type: "team", id: LOCAL_TEAM_ID }` — every
   *      pre-v4 project re-homes onto the Personal team so the user
   *      sees them under their team rather than as orphans.
   *   3. Polymorph every project's access list: legacy
   *      `{ userId, role }` becomes `{ subject: { type: "user", id },
   *      role }`.
   *
   *  Idempotent — runs cleanly if any of the v4 keys already exist
   *  (mid-rollout safety). */
  private migrateV3toV4(storage: Storage): void {
    // 1. Seed teams + memberships if missing.
    const existingTeams = safeJsonParse<PersistedTeamIndex>(
      storage.getItem(TEAMS_KEY),
    );
    if (!existingTeams?.teams?.length) {
      storage.setItem(
        TEAMS_KEY,
        JSON.stringify({ teams: [buildPersonalTeam()] } as PersistedTeamIndex),
      );
    }
    const existingMemberships = safeJsonParse<PersistedMembershipIndex>(
      storage.getItem(MEMBERSHIPS_KEY),
    );
    if (!existingMemberships?.rows?.length) {
      storage.setItem(
        MEMBERSHIPS_KEY,
        JSON.stringify({
          rows: [buildPersonalTeamMembership()],
        } as PersistedMembershipIndex),
      );
    }

    // 2 + 3. Walk projects and polymorph owner + access. Pre-v4
    // projects re-home onto the Personal team so the user sees
    // them where they expect (under "Personal" in any future team-
    // grouped UI).
    const index = safeJsonParse<PreV4ProjectIndex>(
      storage.getItem(PROJECTS_KEY),
    );
    if (!index?.projects) return;

    const polymorphed: Project[] = index.projects.map((p) =>
      this.polymorphProject(p),
    );
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: polymorphed } as PersistedProjectIndex),
    );

    for (const p of polymorphed) {
      const snap = safeJsonParse<PreV4PersistedProject>(
        storage.getItem(projectKey(p.id)),
      );
      if (!snap) continue;
      const nextSnap: PersistedProject = {
        ...snap,
        project: p,
      };
      storage.setItem(projectKey(p.id), JSON.stringify(nextSnap));
    }
  }

  /** Convert a pre-v4 project to the v4 polymorphic shape. Pulled
   *  out as a separate helper so it's testable in isolation and so
   *  we can re-use it if a future migration ever needs the same
   *  one-shot translation again. */
  private polymorphProject(p: PreV4Project): Project {
    // Default owner becomes the Personal team — every pre-Teams
    // project re-homes into the team-of-one rather than staying as
    // a user-owned orphan. Users moving to Supabase-auth later
    // will be able to transfer ownership explicitly.
    const owner: Subject = defaultOwnerForLocalUser();

    // Translate the flat access list to subject-tagged entries.
    // Owner-role grant for the local user is now redundant (the
    // user is an admin of the owning team, which makes them
    // project owner via the resolver), but we keep the grant
    // anyway for resolver belt-and-braces during migration. The
    // resolver de-dupes via highestRole.
    const access: ResourceAccess[] = (p.access ?? []).map((entry) => ({
      subject: { type: "user", id: entry.userId },
      role: entry.role,
    }));

    return {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner,
      access,
    };
  }

  /** v4 → v5: introduce Organisations + Users as first-class
   *  persisted entities. Five things happen:
   *
   *    1. Seed the users index: write the local user (as super
   *       admin), plus 2–3 fake test users so the SuperAdminSheet
   *       has something to switch between out of the box. The
   *       fake rows are obviously dev-only and can be deleted
   *       once we have real auth.
   *    2. Seed the orgs index: write the Default org + a couple
   *       of fake orgs (Acme Corp, Studio Demo) so impersonation
   *       has variety.
   *    3. Seed org memberships: the local user is admin of every
   *       seeded org (so they can switch context as themselves),
   *       and the fake users get realistic role mixes.
   *    4. Backfill `orgId` onto every pre-v5 team — they all
   *       attach to the Default org.
   *    5. (No projects change — projects don't reference orgs
   *       directly, they reference teams which now reference
   *       orgs. The graph still resolves cleanly.)
   *
   *  Idempotent — existing v5 keys are respected. */
  private migrateV4toV5(storage: Storage): void {
    const now = Date.now();

    // 1. Users — local user + a couple of test seeds.
    const existingUsers = safeJsonParse<PersistedUserIndex>(
      storage.getItem(USERS_KEY),
    );
    if (!existingUsers?.users?.length) {
      const users: User[] = [
        {
          id: LOCAL_USER_ID,
          name: "You",
          status: "active",
          superAdmin: true,
        },
        {
          id: "u-alice",
          name: "Alice Carter",
          email: "alice@example.com",
          status: "active",
        },
        {
          id: "u-bob",
          name: "Bob Lin",
          email: "bob@example.com",
          status: "active",
        },
        {
          id: "u-charlie",
          name: "Charlie Reyes",
          email: "charlie@example.com",
          // Unverified — exists so the chrome's "unverified" gate
          // has something to demo against once that wires in.
          status: "unverified",
        },
      ];
      storage.setItem(
        USERS_KEY,
        JSON.stringify({ users } as PersistedUserIndex),
      );
    }

    // 2. Orgs — default + a couple of fakes.
    const existingOrgs = safeJsonParse<PersistedOrgIndex>(
      storage.getItem(ORGS_KEY),
    );
    if (!existingOrgs?.orgs?.length) {
      const orgs: Organisation[] = [
        buildDefaultOrg(now),
        {
          id: "o-acme",
          name: "Acme Corp",
          createdAt: now,
          updatedAt: now,
          plan: "team",
          limits: defaultLimitsForPlan("team"),
        },
        {
          id: "o-studio-demo",
          name: "Studio Demo",
          createdAt: now,
          updatedAt: now,
          plan: "pro",
          limits: defaultLimitsForPlan("pro"),
        },
      ];
      storage.setItem(
        ORGS_KEY,
        JSON.stringify({ orgs } as PersistedOrgIndex),
      );
    }

    // 3. Org memberships — the local user is admin everywhere
    //    (so impersonation lands on a usable role), the fakes
    //    get a mix.
    const existingOrgMemberships = safeJsonParse<PersistedOrgMembershipIndex>(
      storage.getItem(ORG_MEMBERSHIPS_KEY),
    );
    if (!existingOrgMemberships?.rows?.length) {
      const rows: OrgMembership[] = [
        buildDefaultOrgMembership(),
        // Local user shadow-membership across the fake orgs so
        // they show up in the org switcher as orgs the user can
        // already access (useful when impersonating).
        { userId: LOCAL_USER_ID, orgId: "o-acme", role: "admin" },
        { userId: LOCAL_USER_ID, orgId: "o-studio-demo", role: "member" },
        // Fake users in fake orgs — variety so the SuperAdminSheet
        // has interesting state to surface.
        { userId: "u-alice", orgId: "o-acme", role: "admin" },
        { userId: "u-bob", orgId: "o-acme", role: "member" },
        { userId: "u-charlie", orgId: "o-studio-demo", role: "member" },
      ];
      storage.setItem(
        ORG_MEMBERSHIPS_KEY,
        JSON.stringify({ rows } as PersistedOrgMembershipIndex),
      );
    }

    // 4. Backfill orgId onto teams.
    const teamIndex = safeJsonParse<PreV5TeamIndex>(
      storage.getItem(TEAMS_KEY),
    );
    if (teamIndex?.teams) {
      const upgraded: Team[] = teamIndex.teams.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        orgId: t.orgId ?? LOCAL_ORG_ID,
      }));
      storage.setItem(
        TEAMS_KEY,
        JSON.stringify({ teams: upgraded } as PersistedTeamIndex),
      );
    }
  }

  async listProjects(): Promise<Project[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedProjectIndex>(
      storage.getItem(PROJECTS_KEY),
    );
    return index?.projects ?? [];
  }

  async loadProject(id: string): Promise<ProjectSnapshot | null> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return null;
    const parsed = safeJsonParse<PersistedProject>(
      storage.getItem(projectKey(id)),
    );
    if (!parsed) return null;
    return {
      project: parsed.project,
      designs: parsed.designs,
      activeDesignId: parsed.activeDesignId,
      messagesByDesign: parsed.messagesByDesign,
      notesByDesign: parsed.notesByDesign,
      themeDraftJson: parsed.themeDraftJson,
    };
  }

  async createProject(input: {
    name: string;
    description?: string;
  }): Promise<Project> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) {
      throw new Error("LocalStorage unavailable — cannot create project");
    }
    const now = Date.now();
    // Normalise the description: empty / whitespace-only strings
    // become undefined so the UI's "fall back to N screens" logic
    // works consistently between "user never set one" and "user
    // cleared what they set".
    const description = input.description?.trim() || undefined;
    const project: Project = {
      id: nextProjectId(),
      name: input.name,
      description,
      createdAt: now,
      updatedAt: now,
      // New projects belong to the current user's Personal team —
      // matches the "Drafts" / "Personal" pattern. UI can let the
      // user re-home into a different team later.
      owner: defaultOwnerForLocalUser(),
      access: defaultAccessForNewProject(),
    };
    // Seed every new project with a single blank screen — matches
    // the pre-projects bootstrap behaviour. Users land in a state
    // where they can immediately start prompting.
    const designs = initialDesigns();
    const snapshot: PersistedProject = {
      project,
      designs,
      activeDesignId: designs[0].id,
      messagesByDesign: {},
      notesByDesign: {},
    };
    storage.setItem(projectKey(project.id), JSON.stringify(snapshot));

    const existing = await this.listProjects();
    const nextIndex: PersistedProjectIndex = {
      projects: [...existing, project],
    };
    storage.setItem(PROJECTS_KEY, JSON.stringify(nextIndex));
    return project;
  }

  async renameProject(id: string, name: string): Promise<Project> {
    // Thin wrapper around updateProject for back-compat. New
    // callers prefer updateProject directly so they can patch
    // multiple fields at once.
    return this.updateProject(id, { name });
  }

  async updateProject(
    id: string,
    patch: Partial<Pick<Project, "name" | "description">>,
  ): Promise<Project> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const list = await this.listProjects();
    const idx = list.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error(`Project ${id} not found`);

    // Normalise the patch:
    //   - name is required-when-present (empty rejected to avoid
    //     orphaning the row visually). Callers should guard at
    //     the form layer; this is belt-and-braces.
    //   - description empty/whitespace → undefined so the UI's
    //     fallback to "N screens" is consistent.
    const next: Project = { ...list[idx], updatedAt: Date.now() };
    if (patch.name !== undefined) {
      const trimmed = patch.name.trim();
      if (trimmed) next.name = trimmed;
    }
    if (patch.description !== undefined) {
      next.description = patch.description.trim() || undefined;
    }

    const nextList = [...list];
    nextList[idx] = next;
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: nextList } as PersistedProjectIndex),
    );
    // Keep the per-project snapshot's embedded `project` field in
    // sync so a subsequent loadProject() returns the patched data.
    const snap = safeJsonParse<PersistedProject>(
      storage.getItem(projectKey(id)),
    );
    if (snap) {
      storage.setItem(
        projectKey(id),
        JSON.stringify({ ...snap, project: next } as PersistedProject),
      );
    }
    return next;
  }

  async deleteProject(id: string): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    storage.removeItem(projectKey(id));
    const list = await this.listProjects();
    const next = list.filter((p) => p.id !== id);
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: next } as PersistedProjectIndex),
    );
    if (storage.getItem(ACTIVE_KEY) === id) storage.removeItem(ACTIVE_KEY);
  }

  async saveProject(snapshot: ProjectSnapshot): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const updated: Project = {
      ...snapshot.project,
      updatedAt: Date.now(),
    };
    const toPersist: PersistedProject = {
      project: updated,
      designs: snapshot.designs,
      activeDesignId: snapshot.activeDesignId,
      messagesByDesign: snapshot.messagesByDesign,
      notesByDesign: snapshot.notesByDesign,
      themeDraftJson: snapshot.themeDraftJson,
    };
    storage.setItem(projectKey(updated.id), JSON.stringify(toPersist));
    // Bubble the new updatedAt into the index too.
    const list = await this.listProjects();
    const next = list.map((p) => (p.id === updated.id ? updated : p));
    storage.setItem(
      PROJECTS_KEY,
      JSON.stringify({ projects: next } as PersistedProjectIndex),
    );
  }

  async getActiveProjectId(): Promise<string | null> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return null;
    return storage.getItem(ACTIVE_KEY);
  }

  async setActiveProjectId(id: string | null): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    if (id === null) {
      storage.removeItem(ACTIVE_KEY);
    } else {
      storage.setItem(ACTIVE_KEY, id);
    }
  }

  // ─── Teams ─────────────────────────────────────────────────────

  async listTeams(): Promise<Team[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedTeamIndex>(
      storage.getItem(TEAMS_KEY),
    );
    return index?.teams ?? [];
  }

  async getTeam(id: string): Promise<Team | null> {
    const all = await this.listTeams();
    return all.find((t) => t.id === id) ?? null;
  }

  async createTeam(input: {
    name: string;
    orgId?: string;
  }): Promise<Team> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const now = Date.now();
    const team: Team = {
      id: nextTeamId(),
      name: input.name,
      createdAt: now,
      updatedAt: now,
      // New teams land in the Default org unless the caller picks
      // a specific one. Real auth + multi-org UI will let the
      // caller pass orgId explicitly.
      orgId: input.orgId ?? LOCAL_ORG_ID,
    };
    const existing = await this.listTeams();
    const next: PersistedTeamIndex = { teams: [...existing, team] };
    storage.setItem(TEAMS_KEY, JSON.stringify(next));
    return team;
  }

  async renameTeam(id: string, name: string): Promise<Team> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const list = await this.listTeams();
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error(`Team ${id} not found`);
    const updated: Team = { ...list[idx], name, updatedAt: Date.now() };
    const nextList = [...list];
    nextList[idx] = updated;
    storage.setItem(
      TEAMS_KEY,
      JSON.stringify({ teams: nextList } as PersistedTeamIndex),
    );
    return updated;
  }

  async deleteTeam(id: string): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const list = await this.listTeams();
    const next = list.filter((t) => t.id !== id);
    storage.setItem(
      TEAMS_KEY,
      JSON.stringify({ teams: next } as PersistedTeamIndex),
    );
    // Cascade: drop every membership row referencing this team so
    // the page never sees orphaned (user, deleted-team) edges.
    // Projects owned by the team are NOT cascade-deleted — that's a
    // policy call the caller makes (could re-home them).
    const memberships = await this.listMemberships();
    const remaining = memberships.filter((m) => m.teamId !== id);
    storage.setItem(
      MEMBERSHIPS_KEY,
      JSON.stringify({ rows: remaining } as PersistedMembershipIndex),
    );
  }

  // ─── Memberships ───────────────────────────────────────────────

  async listMemberships(): Promise<Membership[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedMembershipIndex>(
      storage.getItem(MEMBERSHIPS_KEY),
    );
    return index?.rows ?? [];
  }

  async addMembership(membership: Membership): Promise<Membership> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const rows = await this.listMemberships();
    // Idempotent on (userId, teamId) — if a row exists we REPLACE
    // its role rather than duplicating. Mirrors a PostgreSQL upsert
    // on (user_id, team_id) PRIMARY KEY.
    const idx = rows.findIndex(
      (m) =>
        m.userId === membership.userId && m.teamId === membership.teamId,
    );
    const next = [...rows];
    if (idx >= 0) {
      next[idx] = membership;
    } else {
      next.push(membership);
    }
    storage.setItem(
      MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedMembershipIndex),
    );
    return membership;
  }

  async removeMembership(input: {
    userId: string;
    teamId: string;
  }): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const rows = await this.listMemberships();
    const next = rows.filter(
      (m) => !(m.userId === input.userId && m.teamId === input.teamId),
    );
    storage.setItem(
      MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedMembershipIndex),
    );
  }

  async updateMembershipRole(input: {
    userId: string;
    teamId: string;
    role: Membership["role"];
  }): Promise<Membership> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const rows = await this.listMemberships();
    const idx = rows.findIndex(
      (m) => m.userId === input.userId && m.teamId === input.teamId,
    );
    if (idx < 0) {
      throw new Error(
        `Membership (${input.userId}, ${input.teamId}) not found`,
      );
    }
    const updated: Membership = { ...rows[idx], role: input.role };
    const next = [...rows];
    next[idx] = updated;
    storage.setItem(
      MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedMembershipIndex),
    );
    return updated;
  }

  // ─── Users ─────────────────────────────────────────────────────

  async listUsers(): Promise<User[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedUserIndex>(
      storage.getItem(USERS_KEY),
    );
    return index?.users ?? [];
  }

  async getUser(id: string): Promise<User | null> {
    const all = await this.listUsers();
    return all.find((u) => u.id === id) ?? null;
  }

  async createUser(user: User): Promise<User> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const existing = await this.listUsers();
    if (existing.some((u) => u.id === user.id)) {
      throw new Error(`User ${user.id} already exists`);
    }
    const next: PersistedUserIndex = { users: [...existing, user] };
    storage.setItem(USERS_KEY, JSON.stringify(next));
    return user;
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const existing = await this.listUsers();
    const idx = existing.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error(`User ${id} not found`);
    // `id` is structurally locked — patches that try to rename
    // the primary key are silently ignored so a stale UI can't
    // corrupt the index.
    const updated: User = { ...existing[idx], ...patch, id };
    const next = [...existing];
    next[idx] = updated;
    storage.setItem(
      USERS_KEY,
      JSON.stringify({ users: next } as PersistedUserIndex),
    );
    return updated;
  }

  // ─── Organisations ─────────────────────────────────────────────

  async listOrgs(): Promise<Organisation[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedOrgIndex>(
      storage.getItem(ORGS_KEY),
    );
    return index?.orgs ?? [];
  }

  async getOrg(id: string): Promise<Organisation | null> {
    const all = await this.listOrgs();
    return all.find((o) => o.id === id) ?? null;
  }

  async createOrg(input: { name: string }): Promise<Organisation> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const now = Date.now();
    const org: Organisation = {
      // Same id pattern as projects/teams/etc. — short prefix +
      // base36 timestamp + short random.
      id:
        "o-" +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 6),
      name: input.name,
      createdAt: now,
      updatedAt: now,
      // New orgs default to the free plan with default limits.
      // Real signup later might pick a different starting plan
      // (e.g. trial); the adapter just hands you free unless told
      // otherwise.
      plan: "free",
      limits: defaultLimitsForPlan("free"),
    };
    const existing = await this.listOrgs();
    storage.setItem(
      ORGS_KEY,
      JSON.stringify({ orgs: [...existing, org] } as PersistedOrgIndex),
    );
    return org;
  }

  async renameOrg(id: string, name: string): Promise<Organisation> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const list = await this.listOrgs();
    const idx = list.findIndex((o) => o.id === id);
    if (idx < 0) throw new Error(`Org ${id} not found`);
    const updated: Organisation = {
      ...list[idx],
      name,
      updatedAt: Date.now(),
    };
    const next = [...list];
    next[idx] = updated;
    storage.setItem(
      ORGS_KEY,
      JSON.stringify({ orgs: next } as PersistedOrgIndex),
    );
    return updated;
  }

  async deleteOrg(id: string): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const list = await this.listOrgs();
    const next = list.filter((o) => o.id !== id);
    storage.setItem(
      ORGS_KEY,
      JSON.stringify({ orgs: next } as PersistedOrgIndex),
    );
    // Cascade memberships only — teams within the org stay (the
    // caller chooses re-home vs delete). Same policy as
    // deleteTeam → memberships.
    const memberships = await this.listOrgMemberships();
    const remaining = memberships.filter((m) => m.orgId !== id);
    storage.setItem(
      ORG_MEMBERSHIPS_KEY,
      JSON.stringify({ rows: remaining } as PersistedOrgMembershipIndex),
    );
  }

  // ─── Org memberships ───────────────────────────────────────────

  async listOrgMemberships(): Promise<OrgMembership[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const index = safeJsonParse<PersistedOrgMembershipIndex>(
      storage.getItem(ORG_MEMBERSHIPS_KEY),
    );
    return index?.rows ?? [];
  }

  async addOrgMembership(
    membership: OrgMembership,
  ): Promise<OrgMembership> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const rows = await this.listOrgMemberships();
    const idx = rows.findIndex(
      (m) =>
        m.userId === membership.userId && m.orgId === membership.orgId,
    );
    const next = [...rows];
    if (idx >= 0) next[idx] = membership;
    else next.push(membership);
    storage.setItem(
      ORG_MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedOrgMembershipIndex),
    );
    return membership;
  }

  async removeOrgMembership(input: {
    userId: string;
    orgId: string;
  }): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const rows = await this.listOrgMemberships();
    const next = rows.filter(
      (m) => !(m.userId === input.userId && m.orgId === input.orgId),
    );
    storage.setItem(
      ORG_MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedOrgMembershipIndex),
    );
  }

  async updateOrgMembershipRole(input: {
    userId: string;
    orgId: string;
    role: OrgMembership["role"];
  }): Promise<OrgMembership> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const rows = await this.listOrgMemberships();
    const idx = rows.findIndex(
      (m) => m.userId === input.userId && m.orgId === input.orgId,
    );
    if (idx < 0) {
      throw new Error(
        `OrgMembership (${input.userId}, ${input.orgId}) not found`,
      );
    }
    const updated: OrgMembership = { ...rows[idx], role: input.role };
    const next = [...rows];
    next[idx] = updated;
    storage.setItem(
      ORG_MEMBERSHIPS_KEY,
      JSON.stringify({ rows: next } as PersistedOrgMembershipIndex),
    );
    return updated;
  }

  // ─── Comments ──────────────────────────────────────────────────

  async listThreads(
    projectId: string,
    designId: string,
  ): Promise<CommentThreadWithMessages[]> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return [];
    const bundle = loadCommentBundle(storage, projectId, designId);
    return bundle.threads
      .map((thread) => ({
        thread,
        // Comments inside each thread sorted oldest-first so the
        // conversation reads top-to-bottom. Stable id ties resolve
        // the rare collision (two comments minted in the same ms).
        comments: bundle.comments
          .filter((c) => c.threadId === thread.id)
          .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)),
      }))
      // Threads themselves render newest-first — the most recent
      // conversation is what the user just had, so it floats top.
      .sort((a, b) => b.thread.createdAt - a.thread.createdAt);
  }

  async createThread(input: {
    projectId: string;
    designId: string;
    anchorId: string;
    anchorKind: "source" | "instance";
    elementLabel: string;
    componentName?: string;
    body: string;
    authorId: string;
  }): Promise<CommentThreadWithMessages> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) {
      throw new Error("LocalStorage unavailable — cannot create thread");
    }
    const now = Date.now();
    const thread: CommentThread = {
      id: nextThreadId(),
      projectId: input.projectId,
      designId: input.designId,
      anchorId: input.anchorId,
      anchorKind: input.anchorKind,
      elementLabel: input.elementLabel,
      componentName: input.componentName,
      status: "open",
      createdBy: input.authorId,
      createdAt: now,
    };
    const opener: Comment = {
      id: nextCommentId(),
      threadId: thread.id,
      authorId: input.authorId,
      body: input.body,
      createdAt: now,
    };
    const bundle = loadCommentBundle(storage, input.projectId, input.designId);
    saveCommentBundle(storage, input.projectId, input.designId, {
      threads: [...bundle.threads, thread],
      comments: [...bundle.comments, opener],
    });
    return { thread, comments: [opener] };
  }

  async resolveThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
    userId: string;
  }): Promise<CommentThread> {
    return this.flipThreadStatus(
      input.projectId,
      input.designId,
      input.threadId,
      "resolved",
      input.userId,
    );
  }

  async reopenThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<CommentThread> {
    return this.flipThreadStatus(
      input.projectId,
      input.designId,
      input.threadId,
      "open",
    );
  }

  /** Shared body for resolve + reopen — only the status diff + the
   *  resolvedBy/resolvedAt stamping changes between the two. */
  private async flipThreadStatus(
    projectId: string,
    designId: string,
    threadId: string,
    status: CommentThread["status"],
    userId?: string,
  ): Promise<CommentThread> {
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const bundle = loadCommentBundle(storage, projectId, designId);
    const idx = bundle.threads.findIndex((t) => t.id === threadId);
    if (idx < 0) throw new Error(`Thread ${threadId} not found`);
    const now = Date.now();
    const updated: CommentThread = {
      ...bundle.threads[idx],
      status,
      // resolvedBy/resolvedAt only meaningful in the "resolved"
      // direction. Re-opening clears them so the audit trail
      // reflects the most recent resolution attempt.
      resolvedBy: status === "resolved" ? userId : undefined,
      resolvedAt: status === "resolved" ? now : undefined,
    };
    const nextThreads = [...bundle.threads];
    nextThreads[idx] = updated;
    saveCommentBundle(storage, projectId, designId, {
      threads: nextThreads,
      comments: bundle.comments,
    });
    return updated;
  }

  async deleteThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const bundle = loadCommentBundle(storage, input.projectId, input.designId);
    saveCommentBundle(storage, input.projectId, input.designId, {
      threads: bundle.threads.filter((t) => t.id !== input.threadId),
      comments: bundle.comments.filter((c) => c.threadId !== input.threadId),
    });
  }

  async addComment(input: {
    projectId: string;
    designId: string;
    threadId: string;
    parentCommentId?: string;
    authorId: string;
    body: string;
  }): Promise<Comment> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const bundle = loadCommentBundle(storage, input.projectId, input.designId);
    // Guard: rejecting a comment on a non-existent thread keeps the
    // bundle internally consistent (no orphans). The UI shouldn't
    // be able to trigger this — composers are tied to threads they
    // can see — but a stale optimistic update could.
    if (!bundle.threads.some((t) => t.id === input.threadId)) {
      throw new Error(`Thread ${input.threadId} not found`);
    }
    const comment: Comment = {
      id: nextCommentId(),
      threadId: input.threadId,
      parentCommentId: input.parentCommentId,
      authorId: input.authorId,
      body: input.body,
      createdAt: Date.now(),
    };
    saveCommentBundle(storage, input.projectId, input.designId, {
      threads: bundle.threads,
      comments: [...bundle.comments, comment],
    });
    return comment;
  }

  async editComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
    body: string;
  }): Promise<Comment> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) throw new Error("LocalStorage unavailable");
    const bundle = loadCommentBundle(storage, input.projectId, input.designId);
    const idx = bundle.comments.findIndex((c) => c.id === input.commentId);
    if (idx < 0) throw new Error(`Comment ${input.commentId} not found`);
    const updated: Comment = {
      ...bundle.comments[idx],
      body: input.body,
      editedAt: Date.now(),
    };
    const next = [...bundle.comments];
    next[idx] = updated;
    saveCommentBundle(storage, input.projectId, input.designId, {
      threads: bundle.threads,
      comments: next,
    });
    return updated;
  }

  async deleteComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
  }): Promise<void> {
    this.ensureHydrated();
    const storage = ssrSafeStorage();
    if (!storage) return;
    const bundle = loadCommentBundle(storage, input.projectId, input.designId);
    const target = bundle.comments.find((c) => c.id === input.commentId);
    if (!target) return;
    // Drop the comment + any replies that were nested under it
    // (parentCommentId match). Empty threads (no remaining
    // top-level comments) get pruned too — an orphan thread row
    // with nothing in it is dead weight.
    const remaining = bundle.comments.filter(
      (c) => c.id !== input.commentId && c.parentCommentId !== input.commentId,
    );
    const stillHasOpeners = remaining.some(
      (c) =>
        c.threadId === target.threadId &&
        c.parentCommentId === undefined,
    );
    const nextThreads = stillHasOpeners
      ? bundle.threads
      : bundle.threads.filter((t) => t.id !== target.threadId);
    saveCommentBundle(storage, input.projectId, input.designId, {
      threads: nextThreads,
      comments: remaining,
    });
  }
}
