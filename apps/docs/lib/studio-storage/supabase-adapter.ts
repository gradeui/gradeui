/**
 * Supabase adapter for StudioStorage.
 *
 * Implements the same `StudioStorage` interface as the LocalStorage
 * adapter, but persists to Postgres via Supabase JS. RLS handles
 * authorisation server-side — the adapter never has to filter rows
 * by current user.
 *
 * Storage shape (v1):
 *
 *   projects (row per project) — carries the full ProjectSnapshot
 *     as a JSONB blob in `snapshot`. Mirrors the local adapter so
 *     the page sees identical shapes regardless of backend. v2
 *     will lift designs/messages/notes into the normalised tables
 *     that already exist in the schema; v1 keeps them empty for
 *     simplicity.
 *
 *   project_access — row per ResourceAccess grant on a project.
 *
 *   users / orgs / teams / memberships / org_memberships — what
 *     they say on the tin. Mirror the entity types directly.
 *
 *   comment_threads + comments — normalised per-thread. Comments
 *     aren't part of the project snapshot blob so the comments
 *     panel can query them without loading the whole project.
 *
 * Cross-session pointer (active project id) lives in localStorage,
 * the same as in local-only mode — it's a per-device UI preference
 * rather than account state. Saving it on the server would break
 * the "I left tab A on project A, tab B on project B" workflow.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import type { Design } from "@/lib/studio-designs";
import {
  type Comment,
  type CommentThread,
  type CommentThreadWithMessages,
} from "@/lib/studio-comments";
import {
  defaultLimitsForPlan,
  type Membership,
  type OrgMembership,
  type Organisation,
  type ResourceAccess,
  type Subject,
  type Team,
  type User,
} from "@/lib/studio-users";

import type { Project, ProjectSnapshot, StudioStorage } from "./types";

/** localStorage key for the active project id — same key the local
 *  adapter uses so a user toggling backends keeps their pointer. */
const ACTIVE_PROJECT_KEY = "grade:studio:active-project-id";

function nowMs(): number {
  return Date.now();
}

function ssrSafeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** ──────────────────────────────────────────────────────────────
 *  Row ↔ entity mappers. Postgres uses snake_case; the TS types
 *  use camelCase. Keep the mapping in one place per entity so the
 *  rest of the adapter reads in domain shapes.
 *  ───────────────────────────────────────────────────────────── */

interface UserRow {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  status: "unverified" | "active" | "suspended";
  super_admin: boolean;
}
function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? undefined,
    avatarUrl: r.avatar_url ?? undefined,
    status: r.status,
    superAdmin: r.super_admin || undefined,
  };
}

interface OrgRow {
  id: string;
  name: string;
  plan: Organisation["plan"];
  limits: Organisation["limits"] | null;
  stripe_customer_id: string | null;
  created_at: number;
  updated_at: number;
}
function rowToOrg(r: OrgRow): Organisation {
  return {
    id: r.id,
    name: r.name,
    plan: r.plan,
    limits: r.limits ?? defaultLimitsForPlan(r.plan),
    stripeCustomerId: r.stripe_customer_id ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

interface TeamRow {
  id: string;
  name: string;
  org_id: string;
  created_at: number;
  updated_at: number;
}
function rowToTeam(r: TeamRow): Team {
  return {
    id: r.id,
    name: r.name,
    orgId: r.org_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

interface MembershipRow {
  user_id: string;
  team_id: string;
  role: Membership["role"];
}
function rowToMembership(r: MembershipRow): Membership {
  return { userId: r.user_id, teamId: r.team_id, role: r.role };
}

interface OrgMembershipRow {
  user_id: string;
  org_id: string;
  role: OrgMembership["role"];
}
function rowToOrgMembership(r: OrgMembershipRow): OrgMembership {
  return { userId: r.user_id, orgId: r.org_id, role: r.role };
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  owner_type: "user" | "team";
  owner_id: string;
  snapshot: ProjectSnapshotBlob | null;
  created_at: number;
  updated_at: number;
}

/** Shape of the JSONB `snapshot` column. Identical to
 *  ProjectSnapshot minus the embedded Project metadata (which is
 *  on the row's own columns). Pulled into its own type so the
 *  pack/unpack helpers stay tidy. */
interface ProjectSnapshotBlob {
  designs: Design[];
  activeDesignId: string;
  messagesByDesign: Record<string, UIMessage[]>;
  notesByDesign: Record<string, string>;
  themeDraftJson?: string;
}

interface ProjectAccessRow {
  project_id: string;
  subject_type: "user" | "team";
  subject_id: string;
  role: ResourceAccess["role"];
}
function rowToAccess(r: ProjectAccessRow): ResourceAccess {
  return {
    subject: { type: r.subject_type, id: r.subject_id },
    role: r.role,
  };
}

function rowToProject(r: ProjectRow, access: ResourceAccess[]): Project {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    owner: { type: r.owner_type, id: r.owner_id } as Subject,
    access,
  };
}

interface ThreadRow {
  id: string;
  project_id: string;
  design_id: string;
  anchor_id: string;
  anchor_kind: "source" | "instance";
  element_label: string;
  component_name: string | null;
  status: "open" | "resolved";
  resolved_by: string | null;
  resolved_at: number | null;
  created_at: number;
  updated_at: number;
}
function rowToThread(r: ThreadRow): CommentThread {
  return {
    id: r.id,
    projectId: r.project_id,
    designId: r.design_id,
    anchorId: r.anchor_id,
    anchorKind: r.anchor_kind,
    elementLabel: r.element_label,
    componentName: r.component_name ?? undefined,
    status: r.status,
    resolvedBy: r.resolved_by ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

interface CommentRow {
  id: string;
  thread_id: string;
  parent_comment_id: string | null;
  author_id: string;
  body: string;
  edited_at: number | null;
  created_at: number;
}
function rowToComment(r: CommentRow): Comment {
  return {
    id: r.id,
    threadId: r.thread_id,
    parentCommentId: r.parent_comment_id ?? undefined,
    authorId: r.author_id,
    body: r.body,
    editedAt: r.edited_at ?? undefined,
    createdAt: r.created_at,
  };
}

/** ──────────────────────────────────────────────────────────────
 *  Adapter
 *  ───────────────────────────────────────────────────────────── */

export class SupabaseStudioStorage implements StudioStorage {
  constructor(private readonly supabase: SupabaseClient) {}

  // ── Projects ────────────────────────────────────────────────

  async listProjects(): Promise<Project[]> {
    const { data: projectRows, error: pErr } = await this.supabase
      .from("projects")
      .select("id, name, description, owner_type, owner_id, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (pErr) throw pErr;
    if (!projectRows || projectRows.length === 0) return [];

    // Pull every access grant for these projects in one round trip.
    const ids = projectRows.map((p) => p.id);
    const { data: accessRows } = await this.supabase
      .from("project_access")
      .select("project_id, subject_type, subject_id, role")
      .in("project_id", ids);

    const accessByProject = new Map<string, ResourceAccess[]>();
    for (const a of (accessRows ?? []) as ProjectAccessRow[]) {
      const list = accessByProject.get(a.project_id) ?? [];
      list.push(rowToAccess(a));
      accessByProject.set(a.project_id, list);
    }

    return projectRows.map((r) =>
      rowToProject(
        { ...(r as ProjectRow), snapshot: null },
        accessByProject.get(r.id) ?? [],
      ),
    );
  }

  async loadProject(id: string): Promise<ProjectSnapshot | null> {
    const { data: row, error } = await this.supabase
      .from("projects")
      .select("id, name, description, owner_type, owner_id, snapshot, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;

    const { data: accessRows } = await this.supabase
      .from("project_access")
      .select("project_id, subject_type, subject_id, role")
      .eq("project_id", id);
    const access = ((accessRows ?? []) as ProjectAccessRow[]).map(rowToAccess);

    const project = rowToProject(row as ProjectRow, access);
    const snapshot = (row as ProjectRow).snapshot;
    if (!snapshot) {
      // Project exists but has no snapshot yet — return a minimal
      // ProjectSnapshot so the page can render an empty workspace
      // and the next save fills it in.
      return {
        project,
        designs: [],
        activeDesignId: "",
        messagesByDesign: {},
        notesByDesign: {},
      };
    }
    return {
      project,
      designs: snapshot.designs ?? [],
      activeDesignId: snapshot.activeDesignId ?? "",
      messagesByDesign: snapshot.messagesByDesign ?? {},
      notesByDesign: snapshot.notesByDesign ?? {},
      themeDraftJson: snapshot.themeDraftJson,
    };
  }

  async createProject(input: {
    name: string;
    description?: string;
  }): Promise<Project> {
    const { data: userData } = await this.supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Cannot create project: not signed in");

    // Default owner: the signed-in user (user-subject). The settings
    // sheet lets users move ownership to a team after the fact.
    const { data, error } = await this.supabase
      .from("projects")
      .insert({
        name: input.name,
        description: input.description ?? null,
        owner_type: "user",
        owner_id: uid,
      })
      .select("id, name, description, owner_type, owner_id, created_at, updated_at")
      .single();
    if (error) throw error;
    return rowToProject({ ...(data as ProjectRow), snapshot: null }, []);
  }

  async renameProject(id: string, name: string): Promise<Project> {
    return this.updateProject(id, { name });
  }

  async updateProject(
    id: string,
    patch: Partial<Pick<Project, "name" | "description">>,
  ): Promise<Project> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.description !== undefined) {
      update.description = patch.description?.trim() ? patch.description : null;
    }

    const { data, error } = await this.supabase
      .from("projects")
      .update(update)
      .eq("id", id)
      .select("id, name, description, owner_type, owner_id, created_at, updated_at")
      .single();
    if (error) throw error;

    const { data: accessRows } = await this.supabase
      .from("project_access")
      .select("project_id, subject_type, subject_id, role")
      .eq("project_id", id);
    const access = ((accessRows ?? []) as ProjectAccessRow[]).map(rowToAccess);
    return rowToProject({ ...(data as ProjectRow), snapshot: null }, access);
  }

  async deleteProject(id: string): Promise<void> {
    // Cascade on FK takes care of access, designs, messages, notes,
    // comments — see the SQL migration.
    const { error } = await this.supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  }

  async saveProject(snapshot: ProjectSnapshot): Promise<void> {
    const { project, designs, activeDesignId, messagesByDesign, notesByDesign, themeDraftJson } =
      snapshot;
    const blob: ProjectSnapshotBlob = {
      designs,
      activeDesignId,
      messagesByDesign,
      notesByDesign,
      themeDraftJson,
    };

    const { error } = await this.supabase
      .from("projects")
      .update({
        name: project.name,
        description: project.description ?? null,
        owner_type: project.owner.type,
        owner_id: project.owner.id,
        snapshot: blob,
      })
      .eq("id", project.id);
    if (error) throw error;

    // Sync access grants — wipe + rewrite. Cheap (low row count per
    // project), keeps the code path simple. RLS only allows the
    // owner to do this so safe to do as a single transaction.
    await this.supabase.from("project_access").delete().eq("project_id", project.id);
    if (project.access.length > 0) {
      const rows = project.access.map((a) => ({
        project_id: project.id,
        subject_type: a.subject.type,
        subject_id: a.subject.id,
        role: a.role,
      }));
      await this.supabase.from("project_access").insert(rows);
    }
  }

  async getActiveProjectId(): Promise<string | null> {
    const storage = ssrSafeStorage();
    return storage?.getItem(ACTIVE_PROJECT_KEY) ?? null;
  }

  async setActiveProjectId(id: string | null): Promise<void> {
    const storage = ssrSafeStorage();
    if (!storage) return;
    if (id === null) storage.removeItem(ACTIVE_PROJECT_KEY);
    else storage.setItem(ACTIVE_PROJECT_KEY, id);
  }

  // ── Teams ───────────────────────────────────────────────────

  async listTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from("teams")
      .select("id, name, org_id, created_at, updated_at");
    if (error) throw error;
    return (data ?? []).map((r) => rowToTeam(r as TeamRow));
  }

  async getTeam(id: string): Promise<Team | null> {
    const { data, error } = await this.supabase
      .from("teams")
      .select("id, name, org_id, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTeam(data as TeamRow) : null;
  }

  async createTeam(input: { name: string; orgId?: string }): Promise<Team> {
    if (!input.orgId) {
      throw new Error(
        "createTeam requires an orgId — Supabase-backed teams must belong to an org",
      );
    }
    const { data, error } = await this.supabase
      .from("teams")
      .insert({ name: input.name, org_id: input.orgId })
      .select("id, name, org_id, created_at, updated_at")
      .single();
    if (error) throw error;
    return rowToTeam(data as TeamRow);
  }

  async renameTeam(id: string, name: string): Promise<Team> {
    const { data, error } = await this.supabase
      .from("teams")
      .update({ name })
      .eq("id", id)
      .select("id, name, org_id, created_at, updated_at")
      .single();
    if (error) throw error;
    return rowToTeam(data as TeamRow);
  }

  async deleteTeam(id: string): Promise<void> {
    const { error } = await this.supabase.from("teams").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Memberships ─────────────────────────────────────────────

  async listMemberships(): Promise<Membership[]> {
    const { data, error } = await this.supabase
      .from("memberships")
      .select("user_id, team_id, role");
    if (error) throw error;
    return (data ?? []).map((r) => rowToMembership(r as MembershipRow));
  }

  async addMembership(m: Membership): Promise<Membership> {
    const { data, error } = await this.supabase
      .from("memberships")
      .upsert(
        { user_id: m.userId, team_id: m.teamId, role: m.role },
        { onConflict: "user_id,team_id" },
      )
      .select("user_id, team_id, role")
      .single();
    if (error) throw error;
    return rowToMembership(data as MembershipRow);
  }

  async removeMembership(input: { userId: string; teamId: string }): Promise<void> {
    const { error } = await this.supabase
      .from("memberships")
      .delete()
      .eq("user_id", input.userId)
      .eq("team_id", input.teamId);
    if (error) throw error;
  }

  async updateMembershipRole(input: {
    userId: string;
    teamId: string;
    role: Membership["role"];
  }): Promise<Membership> {
    const { data, error } = await this.supabase
      .from("memberships")
      .update({ role: input.role })
      .eq("user_id", input.userId)
      .eq("team_id", input.teamId)
      .select("user_id, team_id, role")
      .single();
    if (error) throw error;
    return rowToMembership(data as MembershipRow);
  }

  // ── Users ───────────────────────────────────────────────────

  async listUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, name, email, avatar_url, status, super_admin");
    if (error) throw error;
    return (data ?? []).map((r) => rowToUser(r as UserRow));
  }

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select("id, name, email, avatar_url, status, super_admin")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToUser(data as UserRow) : null;
  }

  async createUser(user: User): Promise<User> {
    // Direct insert — only used for the migration path and for
    // tests; production users are created by the auth trigger
    // (see handle_new_user in 0001_studio_schema.sql).
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        id: user.id,
        name: user.name,
        email: user.email ?? null,
        avatar_url: user.avatarUrl ?? null,
        status: user.status ?? "active",
        super_admin: user.superAdmin ?? false,
      })
      .select("id, name, email, avatar_url, status, super_admin")
      .single();
    if (error) throw error;
    return rowToUser(data as UserRow);
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.email !== undefined) update.email = patch.email ?? null;
    if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl ?? null;
    if (patch.status !== undefined) update.status = patch.status;
    if (patch.superAdmin !== undefined) update.super_admin = patch.superAdmin;

    const { data, error } = await this.supabase
      .from("users")
      .update(update)
      .eq("id", id)
      .select("id, name, email, avatar_url, status, super_admin")
      .single();
    if (error) throw error;
    return rowToUser(data as UserRow);
  }

  // ── Orgs ────────────────────────────────────────────────────

  async listOrgs(): Promise<Organisation[]> {
    const { data, error } = await this.supabase
      .from("orgs")
      .select("id, name, plan, limits, stripe_customer_id, created_at, updated_at");
    if (error) throw error;
    return (data ?? []).map((r) => rowToOrg(r as OrgRow));
  }

  async getOrg(id: string): Promise<Organisation | null> {
    const { data, error } = await this.supabase
      .from("orgs")
      .select("id, name, plan, limits, stripe_customer_id, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToOrg(data as OrgRow) : null;
  }

  async createOrg(input: { name: string }): Promise<Organisation> {
    const limits = defaultLimitsForPlan("free");
    const { data, error } = await this.supabase
      .from("orgs")
      .insert({ name: input.name, plan: "free", limits })
      .select("id, name, plan, limits, stripe_customer_id, created_at, updated_at")
      .single();
    if (error) throw error;
    return rowToOrg(data as OrgRow);
  }

  async renameOrg(id: string, name: string): Promise<Organisation> {
    const { data, error } = await this.supabase
      .from("orgs")
      .update({ name })
      .eq("id", id)
      .select("id, name, plan, limits, stripe_customer_id, created_at, updated_at")
      .single();
    if (error) throw error;
    return rowToOrg(data as OrgRow);
  }

  async deleteOrg(id: string): Promise<void> {
    const { error } = await this.supabase.from("orgs").delete().eq("id", id);
    if (error) throw error;
  }

  // ── Org memberships ─────────────────────────────────────────

  async listOrgMemberships(): Promise<OrgMembership[]> {
    const { data, error } = await this.supabase
      .from("org_memberships")
      .select("user_id, org_id, role");
    if (error) throw error;
    return (data ?? []).map((r) => rowToOrgMembership(r as OrgMembershipRow));
  }

  async addOrgMembership(m: OrgMembership): Promise<OrgMembership> {
    const { data, error } = await this.supabase
      .from("org_memberships")
      .upsert(
        { user_id: m.userId, org_id: m.orgId, role: m.role },
        { onConflict: "user_id,org_id" },
      )
      .select("user_id, org_id, role")
      .single();
    if (error) throw error;
    return rowToOrgMembership(data as OrgMembershipRow);
  }

  async removeOrgMembership(input: { userId: string; orgId: string }): Promise<void> {
    const { error } = await this.supabase
      .from("org_memberships")
      .delete()
      .eq("user_id", input.userId)
      .eq("org_id", input.orgId);
    if (error) throw error;
  }

  async updateOrgMembershipRole(input: {
    userId: string;
    orgId: string;
    role: OrgMembership["role"];
  }): Promise<OrgMembership> {
    const { data, error } = await this.supabase
      .from("org_memberships")
      .update({ role: input.role })
      .eq("user_id", input.userId)
      .eq("org_id", input.orgId)
      .select("user_id, org_id, role")
      .single();
    if (error) throw error;
    return rowToOrgMembership(data as OrgMembershipRow);
  }

  // ── Comments ────────────────────────────────────────────────

  async listThreads(
    projectId: string,
    designId: string,
  ): Promise<CommentThreadWithMessages[]> {
    const { data: threadRows, error: tErr } = await this.supabase
      .from("comment_threads")
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, resolved_by, resolved_at, created_at, updated_at",
      )
      .eq("project_id", projectId)
      .eq("design_id", designId)
      .order("created_at", { ascending: true });
    if (tErr) throw tErr;
    if (!threadRows || threadRows.length === 0) return [];

    const threadIds = threadRows.map((t) => t.id);
    const { data: commentRows, error: cErr } = await this.supabase
      .from("comments")
      .select("id, thread_id, parent_comment_id, author_id, body, edited_at, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: true });
    if (cErr) throw cErr;

    const commentsByThread = new Map<string, Comment[]>();
    for (const c of (commentRows ?? []) as CommentRow[]) {
      const list = commentsByThread.get(c.thread_id) ?? [];
      list.push(rowToComment(c));
      commentsByThread.set(c.thread_id, list);
    }

    return threadRows.map((t) => ({
      thread: rowToThread(t as ThreadRow),
      comments: commentsByThread.get(t.id) ?? [],
    }));
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
    const { data: threadData, error: tErr } = await this.supabase
      .from("comment_threads")
      .insert({
        project_id: input.projectId,
        design_id: input.designId,
        anchor_id: input.anchorId,
        anchor_kind: input.anchorKind,
        element_label: input.elementLabel,
        component_name: input.componentName ?? null,
      })
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, resolved_by, resolved_at, created_at, updated_at",
      )
      .single();
    if (tErr) throw tErr;

    const { data: commentData, error: cErr } = await this.supabase
      .from("comments")
      .insert({
        thread_id: (threadData as ThreadRow).id,
        author_id: input.authorId,
        body: input.body,
      })
      .select("id, thread_id, parent_comment_id, author_id, body, edited_at, created_at")
      .single();
    if (cErr) throw cErr;

    return {
      thread: rowToThread(threadData as ThreadRow),
      comments: [rowToComment(commentData as CommentRow)],
    };
  }

  async resolveThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
    userId: string;
  }): Promise<CommentThread> {
    const { data, error } = await this.supabase
      .from("comment_threads")
      .update({
        status: "resolved",
        resolved_by: input.userId,
        resolved_at: nowMs(),
      })
      .eq("id", input.threadId)
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, resolved_by, resolved_at, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return rowToThread(data as ThreadRow);
  }

  async reopenThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<CommentThread> {
    const { data, error } = await this.supabase
      .from("comment_threads")
      .update({ status: "open", resolved_by: null, resolved_at: null })
      .eq("id", input.threadId)
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, resolved_by, resolved_at, created_at, updated_at",
      )
      .single();
    if (error) throw error;
    return rowToThread(data as ThreadRow);
  }

  async deleteThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("comment_threads")
      .delete()
      .eq("id", input.threadId);
    if (error) throw error;
  }

  async addComment(input: {
    projectId: string;
    designId: string;
    threadId: string;
    parentCommentId?: string;
    authorId: string;
    body: string;
  }): Promise<Comment> {
    const { data, error } = await this.supabase
      .from("comments")
      .insert({
        thread_id: input.threadId,
        parent_comment_id: input.parentCommentId ?? null,
        author_id: input.authorId,
        body: input.body,
      })
      .select("id, thread_id, parent_comment_id, author_id, body, edited_at, created_at")
      .single();
    if (error) throw error;
    return rowToComment(data as CommentRow);
  }

  async editComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
    body: string;
  }): Promise<Comment> {
    const { data, error } = await this.supabase
      .from("comments")
      .update({ body: input.body, edited_at: nowMs() })
      .eq("id", input.commentId)
      .select("id, thread_id, parent_comment_id, author_id, body, edited_at, created_at")
      .single();
    if (error) throw error;
    return rowToComment(data as CommentRow);
  }

  async deleteComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
  }): Promise<void> {
    // Read the comment first so we can decide whether to also drop
    // the thread (orphan-thread rule from the interface contract).
    const { data: comment } = await this.supabase
      .from("comments")
      .select("id, thread_id")
      .eq("id", input.commentId)
      .maybeSingle();
    if (!comment) return;

    const { error } = await this.supabase
      .from("comments")
      .delete()
      .eq("id", input.commentId);
    if (error) throw error;

    // If the thread has no comments left, delete the thread too.
    const { count } = await this.supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", (comment as { thread_id: string }).thread_id);
    if (count === 0) {
      await this.supabase
        .from("comment_threads")
        .delete()
        .eq("id", (comment as { thread_id: string }).thread_id);
    }
  }
}
