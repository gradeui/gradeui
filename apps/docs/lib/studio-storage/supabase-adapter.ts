/**
 * Supabase adapter for StudioStorage.
 *
 * Implements the same `StudioStorage` interface as the LocalStorage
 * adapter, but persists to Postgres via Supabase JS. RLS handles
 * authorisation server-side — the adapter never has to filter rows
 * by current user.
 *
 * Storage shape (v2 — fully normalised):
 *
 *   projects (row per project) — metadata only: name, description,
 *     owner, the active-screen pointer (`active_design_id`) and the
 *     theme draft (`theme_draft_json`). The v1 `snapshot` JSONB blob
 *     is no longer read or written — screens/messages/notes are
 *     their own rows now (see migration 0002).
 *
 *   designs (row per screen) — `state` JSONB carries appSource +
 *     status; `position` is the 0-based order in the screen list.
 *     `id` is the client-minted screen id (text, not uuid).
 *
 *   messages (row per chat message) — `payload` JSONB is the AI SDK
 *     UIMessage; `position` orders the thread within a screen.
 *
 *   notes (row per screen) — PK (project_id, design_id), `body` text.
 *
 *   project_access — row per ResourceAccess grant on a project.
 *
 *   users / orgs / teams / memberships / org_memberships — what
 *     they say on the tin. Mirror the entity types directly.
 *
 *   comment_threads + comments — normalised per-thread, anchored to
 *     a screen so the comments panel queries just the active screen.
 *
 * loadProject reassembles the in-memory ProjectSnapshot by joining
 * designs + messages + notes for the project. saveProject reconciles
 * those rows against the snapshot (upsert present, delete removed);
 * the granular addScreen/deleteScreen/saveMessages/saveNote helpers
 * are the fast path for discrete user actions.
 *
 * Cross-session pointer (active project id) lives in localStorage,
 * the same as in local-only mode — it's a per-device UI preference
 * rather than account state. Saving it on the server would break
 * the "I left tab A on project A, tab B on project B" workflow.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import type {
  Design,
  DesignKind,
  DesignStatus,
} from "@/lib/studio-designs";
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

import type {
  Asset,
  AssetOrigin,
  AssetType,
  Project,
  ProjectSnapshot,
  ScreenRevision,
  ShareLink,
  ShareViewportSpec,
  StudioEvent,
  StudioStorage,
} from "./types";
import { SHARE_VIEWPORT_PRESETS, VersionConflictError } from "./types";

/** Public bucket holding user assets (migration 0014). Public so the
 *  permanent getPublicUrl works in screens + shares without signing. */
const ASSET_BUCKET = "user-assets";

interface AssetRow {
  id: string;
  owner_id: string;
  project_id: string | null;
  type: AssetType;
  path: string;
  name: string;
  content_type: string;
  width: number | null;
  height: number | null;
  bytes: number;
  origin: AssetOrigin;
  source_prompt: string | null;
  alt_text: string | null;
  enrichment: Record<string, unknown> | null;
  created_at: number;
}
const ASSET_COLS =
  "id, owner_id, project_id, type, path, name, content_type, width, height, bytes, origin, source_prompt, alt_text, enrichment, created_at";
function rowToAsset(r: AssetRow, url?: string): Asset {
  return {
    id: r.id,
    ownerId: r.owner_id,
    projectId: r.project_id ?? undefined,
    type: r.type,
    path: r.path,
    name: r.name,
    contentType: r.content_type,
    width: r.width ?? undefined,
    height: r.height ?? undefined,
    bytes: r.bytes,
    origin: r.origin,
    sourcePrompt: r.source_prompt ?? undefined,
    altText: r.alt_text ?? undefined,
    enrichment: r.enrichment ?? undefined,
    createdAt: r.created_at,
    url,
  };
}
/** Best-effort extension from a filename, else from the content type. */
function extFor(file: File): string {
  const dot = file.name.lastIndexOf(".");
  if (dot >= 0 && dot < file.name.length - 1) {
    return file.name.slice(dot + 1).toLowerCase();
  }
  const sub = file.type.split("/")[1];
  return sub ? sub.toLowerCase() : "bin";
}

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
  context: string | null;
  dos: string[] | null;
  donts: string[] | null;
  registry_id: string | null;
  owner_type: "user" | "team";
  owner_id: string;
  active_design_id: string | null;
  theme_draft_json: string | null;
  theme_variants_json: string | null;
  created_at: number;
  updated_at: number;
}

/** Columns selected for the metadata view (no active/theme — those
 *  are only needed by loadProject). Kept as a const so listProjects
 *  and the mutation methods select an identical shape. */
const PROJECT_META_COLS =
  "id, name, description, context, dos, donts, registry_id, owner_type, owner_id, created_at, updated_at";
const PROJECT_FULL_COLS =
  "id, name, description, context, dos, donts, registry_id, owner_type, owner_id, active_design_id, theme_draft_json, theme_variants_json, created_at, updated_at";

// ─── Screen / message / note rows ─────────────────────────────────

/** JSONB `state` column on a design row — everything about a screen
 *  that isn't its name / position / timestamps. JSONB means new fields
 *  (like `kind`, added for Grade Motion) need no SQL migration — but
 *  they DO need mapping in rowToDesign / designToRow below, or they
 *  silently drop on a cloud round-trip. */
interface DesignState {
  appSource?: string | null;
  status?: DesignStatus | null;
  /** "screen" (default when absent — every pre-Motion row) | "motion".
   *  See DesignKind in lib/studio-designs.ts. */
  kind?: DesignKind | null;
}

interface DesignRow {
  id: string;
  project_id: string;
  name: string;
  state: DesignState | null;
  position: number;
  created_at: number;
  updated_at: number;
}

function rowToDesign(r: DesignRow): Design {
  return {
    id: r.id,
    name: r.name,
    appSource: r.state?.appSource ?? null,
    status: r.state?.status ?? undefined,
    kind: r.state?.kind ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function designToRow(
  projectId: string,
  d: Design,
  position: number,
): DesignRow {
  const now = nowMs();
  return {
    id: d.id,
    project_id: projectId,
    name: d.name,
    state: {
      appSource: d.appSource ?? null,
      status: d.status ?? null,
      kind: d.kind ?? null,
    },
    position,
    created_at: d.createdAt ?? now,
    updated_at: d.updatedAt ?? now,
  };
}

interface MessageRow {
  id: string;
  project_id: string;
  design_id: string;
  payload: UIMessage;
  position: number;
  created_at: number;
}

interface RevisionRow {
  id: string;
  project_id: string;
  design_id: string;
  app_source: string | null;
  label: string | null;
  created_by: string | null;
  created_at: number;
}
function rowToRevision(r: RevisionRow): ScreenRevision {
  return {
    id: r.id,
    projectId: r.project_id,
    designId: r.design_id,
    appSource: r.app_source,
    label: r.label ?? undefined,
    authorId: r.created_by ?? undefined,
    createdAt: r.created_at,
  };
}

interface ShareLinkRow {
  token: string;
  project_id: string;
  design_id: string | null;
  revision_id: string | null;
  mode: "view" | "comment";
  color_mode: "light" | "dark";
  /** Spec-model viewport doc — see migration 0017 + ShareViewportSpec. */
  viewports: { initialId?: string; specs?: ShareViewportSpec[] } | null;
  created_by: string | null;
  revoked: boolean;
  expires_at: number | null;
  created_at: number;
}
function rowToShareLink(r: ShareLinkRow): ShareLink {
  // The column is NOT NULL with a preset default, so a missing/empty
  // doc only happens on hand-edited rows — fall back to the presets.
  const docSpecs = r.viewports?.specs;
  const viewports =
    docSpecs && docSpecs.length > 0 ? docSpecs : SHARE_VIEWPORT_PRESETS;
  const initialViewportId =
    r.viewports?.initialId &&
    viewports.some((s) => s.id === r.viewports?.initialId)
      ? r.viewports.initialId
      : viewports[0].id;
  return {
    token: r.token,
    projectId: r.project_id,
    designId: r.design_id,
    revisionId: r.revision_id ?? undefined,
    mode: r.mode,
    colorMode: r.color_mode,
    viewports,
    initialViewportId,
    createdBy: r.created_by ?? undefined,
    revoked: r.revoked,
    expiresAt: r.expires_at ?? undefined,
    createdAt: r.created_at,
  };
}

const SHARE_LINK_COLS =
  "token, project_id, design_id, revision_id, mode, color_mode, viewports, created_by, revoked, expires_at, created_at";

interface NoteRow {
  project_id: string;
  design_id: string;
  body: string;
  updated_at: number;
}

/** Mint a client-style screen id — mirrors studio-designs `nextId`
 *  so a cloud-seeded screen is indistinguishable from one the page
 *  adds. NOT a uuid: the `designs.id` column is text (migration
 *  0002) precisely so client ids round-trip unchanged. */
function mintDesignId(): string {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
    context: r.context ?? undefined,
    dos: r.dos ?? [],
    donts: r.donts ?? [],
    registryId: r.registry_id ?? undefined,
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
  created_by: string;
  resolved_by: string | null;
  resolved_at: number | null;
  created_at: number;
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
    createdBy: r.created_by,
    resolvedBy: r.resolved_by ?? undefined,
    resolvedAt: r.resolved_at ?? undefined,
    createdAt: r.created_at,
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
      .select(PROJECT_META_COLS)
      .is("deleted_at", null)
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
      rowToProject(r as unknown as ProjectRow, accessByProject.get(r.id) ?? []),
    );
  }

  async loadProject(id: string): Promise<ProjectSnapshot | null> {
    const { data: row, error } = await this.supabase
      .from("projects")
      .select(PROJECT_FULL_COLS)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!row) return null;
    const projectRow = row as unknown as ProjectRow;

    // Fan out the three child reads + access in parallel — they're
    // independent and RLS already scopes each to this project.
    const [accessRes, designRes, messageRes, noteRes] = await Promise.all([
      this.supabase
        .from("project_access")
        .select("project_id, subject_type, subject_id, role")
        .eq("project_id", id),
      this.supabase
        .from("designs")
        .select("id, project_id, name, state, position, created_at, updated_at")
        .eq("project_id", id)
        .is("deleted_at", null)
        .order("position", { ascending: true }),
      this.supabase
        .from("messages")
        .select("id, project_id, design_id, payload, position, created_at")
        .eq("project_id", id)
        .order("position", { ascending: true }),
      this.supabase
        .from("notes")
        .select("project_id, design_id, body, updated_at")
        .eq("project_id", id),
    ]);

    const access = ((accessRes.data ?? []) as ProjectAccessRow[]).map(
      rowToAccess,
    );
    const project = rowToProject(projectRow, access);

    const designs = ((designRes.data ?? []) as DesignRow[]).map(rowToDesign);

    // Group messages by screen, preserving the position order the
    // query already applied.
    const messagesByDesign: Record<string, UIMessage[]> = {};
    for (const m of (messageRes.data ?? []) as MessageRow[]) {
      (messagesByDesign[m.design_id] ??= []).push(m.payload);
    }

    const notesByDesign: Record<string, string> = {};
    for (const n of (noteRes.data ?? []) as NoteRow[]) {
      if (n.body) notesByDesign[n.design_id] = n.body;
    }

    // active_design_id is a soft pointer — fall back to the first
    // screen if it's null or points at a since-deleted screen.
    const activeDesignId =
      projectRow.active_design_id &&
      designs.some((d) => d.id === projectRow.active_design_id)
        ? projectRow.active_design_id
        : designs[0]?.id ?? "";

    return {
      project,
      designs,
      activeDesignId,
      messagesByDesign,
      notesByDesign,
      themeDraftJson: projectRow.theme_draft_json ?? undefined,
      themeVariantsJson: projectRow.theme_variants_json ?? undefined,
    };
  }

  async createProject(input: {
    name: string;
    description?: string;
    registryId?: string;
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
        registry_id: input.registryId ?? null,
        owner_type: "user",
        owner_id: uid,
      })
      .select(PROJECT_META_COLS)
      .single();
    if (error) throw error;
    const project = rowToProject(data as unknown as ProjectRow, []);

    // Seed the project with one blank screen so the workspace is
    // never empty — mirrors the local adapter + the pre-projects
    // bootstrap. The id is client-style (text column) and unique per
    // project, so no PK collision with other projects' seed screens.
    const now = nowMs();
    const seed: Design = {
      id: mintDesignId(),
      name: "Screen 1",
      appSource: null,
      createdAt: now,
      updatedAt: now,
      status: "draft",
    };
    const { error: dErr } = await this.supabase
      .from("designs")
      .insert(designToRow(project.id, seed, 0));
    if (dErr) throw dErr;

    // Point the project at its seed screen.
    await this.supabase
      .from("projects")
      .update({ active_design_id: seed.id })
      .eq("id", project.id);

    return project;
  }

  async renameProject(id: string, name: string): Promise<Project> {
    return this.updateProject(id, { name });
  }

  async updateProject(
    id: string,
    patch: Partial<
      Pick<
        Project,
        "name" | "description" | "context" | "dos" | "donts" | "registryId"
      >
    >,
  ): Promise<Project> {
    const update: Record<string, unknown> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.description !== undefined) {
      update.description = patch.description?.trim() ? patch.description : null;
    }
    if (patch.context !== undefined) {
      update.context = patch.context?.trim() ? patch.context : null;
    }
    // dos/donts are NOT NULL text[] columns: persist a cleaned array (drop
    // blank lines), defaulting to [] so the harness reads a stable shape.
    if (patch.dos !== undefined) {
      update.dos = (patch.dos ?? []).map((s) => s.trim()).filter(Boolean);
    }
    if (patch.donts !== undefined) {
      update.donts = (patch.donts ?? []).map((s) => s.trim()).filter(Boolean);
    }
    if (patch.registryId !== undefined) {
      // Empty string = "clear back to the deployment default".
      update.registry_id = patch.registryId?.trim() ? patch.registryId : null;
    }

    const { data, error } = await this.supabase
      .from("projects")
      .update(update)
      .eq("id", id)
      .select(PROJECT_META_COLS)
      .single();
    if (error) throw error;

    const { data: accessRows } = await this.supabase
      .from("project_access")
      .select("project_id, subject_type, subject_id, role")
      .eq("project_id", id);
    const access = ((accessRows ?? []) as ProjectAccessRow[]).map(rowToAccess);
    return rowToProject(data as unknown as ProjectRow, access);
  }

  async deleteProject(id: string): Promise<void> {
    // Soft-delete — mark deleted_at so it drops out of listProjects but
    // stays recoverable. A true purge (hard delete + cascade) is a
    // separate, explicit action not wired here.
    const { error } = await this.supabase
      .from("projects")
      .update({ deleted_at: Date.now() })
      .eq("id", id);
    if (error) throw error;
    await this.logEvent({
      projectId: id,
      action: "project.delete",
      targetKind: "project",
      targetId: id,
    });
  }

  async restoreProject(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("projects")
      .update({ deleted_at: null })
      .eq("id", id);
    if (error) throw error;
    await this.logEvent({
      projectId: id,
      action: "project.restore",
      targetKind: "project",
      targetId: id,
    });
  }


  async saveProject(snapshot: ProjectSnapshot): Promise<void> {
    const {
      project,
      designs,
      activeDesignId,
      messagesByDesign,
      notesByDesign,
      themeDraftJson,
      themeVariantsJson,
    } = snapshot;

    // 1. Project metadata + the soft pointers (active screen, theme
    //    draft). No snapshot blob — the children below are the
    //    source of truth now.
    const { error } = await this.supabase
      .from("projects")
      .update({
        name: project.name,
        description: project.description ?? null,
        owner_type: project.owner.type,
        owner_id: project.owner.id,
        active_design_id: activeDesignId || null,
        theme_draft_json: themeDraftJson ?? null,
        theme_variants_json: themeVariantsJson ?? null,
      })
      .eq("id", project.id);
    if (error) throw error;

    // 2. Access grants — wipe + rewrite. Cheap (low row count) and
    //    RLS scopes it to the owner.
    await this.supabase
      .from("project_access")
      .delete()
      .eq("project_id", project.id);
    if (project.access.length > 0) {
      await this.supabase.from("project_access").insert(
        project.access.map((a) => ({
          project_id: project.id,
          subject_type: a.subject.type,
          subject_id: a.subject.id,
          role: a.role,
        })),
      );
    }

    // 3. Screens — upsert the snapshot's screens with fresh positions.
    //    We deliberately DON'T delete screens that are absent from the
    //    snapshot any more: screen removal is now an explicit (soft)
    //    deleteDesign() that sets deleted_at, and soft-deleted screens
    //    are already filtered out of loadProject — so "absent here" just
    //    means "not currently loaded", never "erase it". (Pre-0016 this
    //    block hard-deleted absent screens, which is the implicit
    //    erasure soft-delete removes.)
    if (designs.length > 0) {
      // Screen rows carry appSource in `state`. This upsert previously
      // dropped its error silently — a failed screen write (most likely an
      // RLS denial when the browser client writes the row; the chat API
      // route persists via the service role and so was unaffected) looked
      // like a successful save, and the user's manual edits vanished on
      // reload while agent edits persisted. Throw like the project update
      // above so failures surface instead of eating the user's work.
      const { error: designsError } = await this.supabase
        .from("designs")
        .upsert(
          designs.map((d, i) => designToRow(project.id, d, i)),
          { onConflict: "id" },
        );
      if (designsError) throw designsError;
    }

    // 4. Messages + notes — replace per surviving screen. Cheap for a
    //    single-user workspace; a future optimisation could diff
    //    instead of wholesale-replacing. Runs in parallel per screen.
    await Promise.all(
      designs.map((d) =>
        this.replaceMessages(project.id, d.id, messagesByDesign[d.id] ?? []),
      ),
    );
    await Promise.all(
      designs.map((d) =>
        this.upsertNote(project.id, d.id, notesByDesign[d.id] ?? ""),
      ),
    );
  }

  // ─── Screens (designs) — granular row-level writes ─────────────

  async addScreen(
    projectId: string,
    design: Design,
    position: number,
    duplicatedFrom?: { id: string; name: string },
  ): Promise<void> {
    const { error } = await this.supabase
      .from("designs")
      .upsert(designToRow(projectId, design, position), { onConflict: "id" });
    if (error) throw error;
    // A duplicate gets its own verb + remembers the source screen; a
    // plain add is a create. Name is stamped either way so the trail
    // reads "created Pricing v2" / "duplicated Screen 1 → Screen 1 copy".
    await this.logEvent({
      projectId,
      designId: design.id,
      action: duplicatedFrom ? "screen.duplicate" : "screen.create",
      targetKind: "screen",
      targetId: design.id,
      metadata: duplicatedFrom
        ? {
            name: design.name,
            fromId: duplicatedFrom.id,
            fromName: duplicatedFrom.name,
          }
        : { name: design.name },
    });
  }

  async deleteScreen(projectId: string, designId: string): Promise<void> {
    // Grab the name BEFORE marking it deleted so the trail can say WHICH
    // screen — a soft-deleted screen drops out of loadProject, so the
    // feed couldn't resolve its name afterwards.
    const { data: row } = await this.supabase
      .from("designs")
      .select("name")
      .eq("id", designId)
      .maybeSingle();
    const name = (row as { name: string } | null)?.name;
    // Soft-delete — mark deleted_at so the screen drops out of
    // loadProject but stays recoverable (its revisions + messages +
    // threads are untouched, so restore brings the whole history back).
    // Scope by project_id too as belt-and-braces.
    const { error } = await this.supabase
      .from("designs")
      .update({ deleted_at: Date.now() })
      .eq("project_id", projectId)
      .eq("id", designId);
    if (error) throw error;
    await this.logEvent({
      projectId,
      designId,
      action: "screen.delete",
      targetKind: "screen",
      targetId: designId,
      metadata: name ? { name } : undefined,
    });
  }

  async restoreScreen(projectId: string, designId: string): Promise<void> {
    const { error } = await this.supabase
      .from("designs")
      .update({ deleted_at: null })
      .eq("project_id", projectId)
      .eq("id", designId);
    if (error) throw error;
    await this.logEvent({
      projectId,
      designId,
      action: "screen.restore",
      targetKind: "screen",
      targetId: designId,
    });
  }

  async saveScreen(
    projectId: string,
    design: Design,
    position?: number,
    expectedUpdatedAt?: number,
  ): Promise<void> {
    let pos = position;
    if (pos === undefined) {
      const { data } = await this.supabase
        .from("designs")
        .select("position")
        .eq("id", design.id)
        .maybeSingle();
      pos = (data as { position: number } | null)?.position ?? 0;
    }
    const row = designToRow(projectId, design, pos);
    if (expectedUpdatedAt != null) {
      // Guarded write: only lands if the row is still at expectedUpdatedAt.
      // 0 rows back ⇒ a concurrent edit moved it ⇒ refuse + signal conflict.
      const { data, error } = await this.supabase
        .from("designs")
        .update(row)
        .eq("id", design.id)
        .eq("updated_at", expectedUpdatedAt)
        .select("updated_at");
      if (error) throw error;
      if (!data || data.length === 0) {
        const { data: cur } = await this.supabase
          .from("designs")
          .select("updated_at")
          .eq("id", design.id)
          .maybeSingle();
        throw new VersionConflictError(
          (cur as { updated_at: number } | null)?.updated_at,
        );
      }
      return;
    }
    const { error } = await this.supabase
      .from("designs")
      .upsert(row, { onConflict: "id" });
    if (error) throw error;
  }

  async saveMessages(
    projectId: string,
    designId: string,
    messages: UIMessage[],
  ): Promise<void> {
    await this.replaceMessages(projectId, designId, messages);
  }

  async saveNote(
    projectId: string,
    designId: string,
    body: string,
  ): Promise<void> {
    await this.upsertNote(projectId, designId, body);
  }

  // ── Revisions ────────────────────────────────────────────────

  async addRevision(input: {
    projectId: string;
    designId: string;
    appSource: string | null;
    label?: string;
    authorId: string;
  }): Promise<ScreenRevision> {
    const { data, error } = await this.supabase
      .from("screen_revisions")
      .insert({
        project_id: input.projectId,
        design_id: input.designId,
        app_source: input.appSource,
        label: input.label ?? null,
        created_by: input.authorId,
      })
      .select("id, project_id, design_id, app_source, label, created_by, created_at")
      .single();
    if (error) throw error;
    return rowToRevision(data as RevisionRow);
  }

  async listRevisions(
    projectId: string,
    designId: string,
  ): Promise<ScreenRevision[]> {
    const { data, error } = await this.supabase
      .from("screen_revisions")
      .select("id, project_id, design_id, app_source, label, created_by, created_at")
      .eq("project_id", projectId)
      .eq("design_id", designId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as RevisionRow[]).map(rowToRevision);
  }

  // ── Share links ──────────────────────────────────────────────

  async createShareLink(input: {
    projectId: string;
    designId: string;
    mode?: "view" | "comment";
    colorMode?: "light" | "dark";
    viewports?: { initialId: string; specs: ShareViewportSpec[] };
    revisionId?: string;
  }): Promise<ShareLink> {
    const { data: userData } = await this.supabase.auth.getUser();

    // Invariants: never empty (default = the four presets), initial
    // always a member (clamp to the first spec — the caller's set is
    // the truth, the initial is just where the share opens).
    let doc =
      input.viewports && input.viewports.specs.length > 0
        ? input.viewports
        : { initialId: "responsive", specs: SHARE_VIEWPORT_PRESETS };
    if (!doc.specs.some((s) => s.id === doc.initialId)) {
      doc = { ...doc, initialId: doc.specs[0].id };
    }

    const { data, error } = await this.supabase
      .from("share_links")
      .insert({
        project_id: input.projectId,
        design_id: input.designId,
        mode: input.mode ?? "view",
        color_mode: input.colorMode ?? "light",
        viewports: doc,
        revision_id: input.revisionId ?? null,
        created_by: userData.user?.id ?? null,
      })
      .select(SHARE_LINK_COLS)
      .single();
    if (error) throw error;
    return rowToShareLink(data as ShareLinkRow);
  }

  async listShareLinks(projectId: string): Promise<ShareLink[]> {
    const { data, error } = await this.supabase
      .from("share_links")
      .select(SHARE_LINK_COLS)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as ShareLinkRow[]).map(rowToShareLink);
  }

  async revokeShareLink(token: string): Promise<void> {
    const { error } = await this.supabase
      .from("share_links")
      .update({ revoked: true })
      .eq("token", token);
    if (error) throw error;
  }

  // ─── Assets ──────────────────────────────────────────────────────

  async listAssets(opts?: {
    type?: AssetType;
    projectId?: string;
  }): Promise<Asset[]> {
    let q = this.supabase
      .from("assets")
      .select(ASSET_COLS)
      .order("created_at", { ascending: false });
    if (opts?.type) q = q.eq("type", opts.type);
    if (opts?.projectId) q = q.eq("project_id", opts.projectId);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as AssetRow[];
    if (rows.length === 0) return [];
    // Public bucket → permanent URLs, no signing round-trip.
    return rows.map((r) => rowToAsset(r, this.assetPublicUrl(r.path)));
  }

  /** Permanent public URL for a bucket object. The bucket is public
   *  (0014), so this never expires and is safe to store in a screen. */
  private assetPublicUrl(path: string): string {
    return this.supabase.storage.from(ASSET_BUCKET).getPublicUrl(path).data
      .publicUrl;
  }

  async uploadAsset(input: {
    file: File;
    type?: AssetType;
    projectId?: string;
    width?: number;
    height?: number;
    origin?: AssetOrigin;
    sourcePrompt?: string;
    altText?: string;
    enrichment?: Record<string, unknown>;
  }): Promise<Asset> {
    const { data: userData } = await this.supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) throw new Error("Cannot upload: not signed in");

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const path = `${uid}/${id}.${extFor(input.file)}`;

    const { error: upErr } = await this.supabase.storage
      .from(ASSET_BUCKET)
      .upload(path, input.file, {
        contentType: input.file.type || "application/octet-stream",
        upsert: false,
      });
    if (upErr) throw upErr;

    const { data, error } = await this.supabase
      .from("assets")
      .insert({
        id,
        owner_id: uid,
        project_id: input.projectId ?? null,
        type: input.type ?? "media",
        path,
        name: input.file.name,
        content_type: input.file.type || "application/octet-stream",
        width: input.width ?? null,
        height: input.height ?? null,
        bytes: input.file.size,
        origin: input.origin ?? "upload",
        source_prompt: input.sourcePrompt ?? null,
        alt_text: input.altText ?? null,
        enrichment: input.enrichment ?? null,
      })
      .select(ASSET_COLS)
      .single();
    if (error) {
      // Roll back the orphaned object so a failed row-insert doesn't
      // leave bytes stranded in the bucket.
      await this.supabase.storage.from(ASSET_BUCKET).remove([path]);
      throw error;
    }

    const asset = rowToAsset(data as AssetRow, this.assetPublicUrl(path));

    // Trail entry — only project-scoped uploads land on a feed (a
    // general-library upload has no project to scope to). The verb
    // reflects how it was made.
    if (asset.projectId) {
      const action =
        asset.origin === "generated"
          ? "asset.generate"
          : asset.origin === "filled"
            ? "asset.fill"
            : "asset.upload";
      await this.logEvent({
        projectId: asset.projectId,
        action,
        targetKind: "asset",
        targetId: asset.id,
        metadata: {
          name: asset.name,
          ...(asset.sourcePrompt ? { prompt: asset.sourcePrompt } : {}),
        },
      });
    }
    return asset;
  }

  async updateAsset(
    id: string,
    patch: {
      projectId?: string | null;
      altText?: string;
      enrichment?: Record<string, unknown>;
    },
  ): Promise<Asset> {
    const row: Record<string, unknown> = {};
    if ("projectId" in patch) row.project_id = patch.projectId ?? null;
    if (patch.altText !== undefined) row.alt_text = patch.altText;
    if (patch.enrichment !== undefined) row.enrichment = patch.enrichment;
    const { data, error } = await this.supabase
      .from("assets")
      .update(row)
      .eq("id", id)
      .select(ASSET_COLS)
      .single();
    if (error) throw error;
    const asset = data as AssetRow;
    return rowToAsset(asset, this.assetPublicUrl(asset.path));
  }

  async deleteAsset(id: string): Promise<void> {
    const { data: row } = await this.supabase
      .from("assets")
      .select("path, project_id, name")
      .eq("id", id)
      .maybeSingle();
    const meta = row as
      | { path: string; project_id: string | null; name: string }
      | null;
    if (meta?.path) {
      await this.supabase.storage.from(ASSET_BUCKET).remove([meta.path]);
    }
    const { error } = await this.supabase.from("assets").delete().eq("id", id);
    if (error) throw error;
    if (meta?.project_id) {
      await this.logEvent({
        projectId: meta.project_id,
        action: "asset.delete",
        targetKind: "asset",
        targetId: id,
        metadata: { name: meta.name },
      });
    }
  }

  // ─── Activity trail ──────────────────────────────────────────────

  async logEvent(input: {
    projectId: string;
    designId?: string;
    action: string;
    targetKind?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // Best-effort: a failed trail write must never break the action that
    // triggered it. Swallow everything.
    try {
      const { data: u } = await this.supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return;
      await this.supabase.from("events").insert({
        actor_id: uid,
        project_id: input.projectId,
        design_id: input.designId ?? null,
        action: input.action,
        target_kind: input.targetKind ?? null,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? null,
      });
      // Nudge any live activity feed to refetch — decoupled from who
      // triggered the action (screen add/delete, asset, comment, …).
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("grade:event-logged", {
            detail: { projectId: input.projectId },
          }),
        );
      }
    } catch {
      /* trail gaps are acceptable; broken actions are not */
    }
  }

  async listEvents(opts: {
    projectId: string;
    designId?: string;
    limit?: number;
  }): Promise<StudioEvent[]> {
    let q = this.supabase
      .from("events")
      .select(
        "id, actor_id, project_id, design_id, action, target_kind, target_id, metadata, created_at",
      )
      .eq("project_id", opts.projectId)
      .order("created_at", { ascending: false })
      .limit(opts.limit ?? 100);
    if (opts.designId) q = q.eq("design_id", opts.designId);
    const { data, error } = await q;
    if (error) throw error;
    return (
      (data ?? []) as Array<{
        id: string;
        actor_id: string | null;
        project_id: string;
        design_id: string | null;
        action: string;
        target_kind: string | null;
        target_id: string | null;
        metadata: Record<string, unknown> | null;
        created_at: number;
      }>
    ).map((r) => ({
      id: r.id,
      actorId: r.actor_id ?? undefined,
      projectId: r.project_id,
      designId: r.design_id ?? undefined,
      action: r.action,
      targetKind: r.target_kind ?? undefined,
      targetId: r.target_id ?? undefined,
      metadata: r.metadata ?? undefined,
      createdAt: r.created_at,
    }));
  }

  /** The id of the most recent revision for a screen, or null. Used to
   *  bind a new comment thread to the revision it was made on. */
  private async latestRevisionId(designId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from("screen_revisions")
      .select("id")
      .eq("design_id", designId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  }

  /** Wholesale-replace a screen's chat history: drop existing rows,
   *  insert one row per message keyed by array index. */
  private async replaceMessages(
    projectId: string,
    designId: string,
    messages: UIMessage[],
  ): Promise<void> {
    await this.supabase.from("messages").delete().eq("design_id", designId);
    if (messages.length === 0) return;
    const rows = messages.map((m, i) => ({
      project_id: projectId,
      design_id: designId,
      payload: m,
      position: i,
    }));
    const { error } = await this.supabase.from("messages").insert(rows);
    if (error) throw error;
  }

  /** Upsert (or clear) a screen's note. Empty / whitespace-only body
   *  deletes the row so an empty note never lingers. */
  private async upsertNote(
    projectId: string,
    designId: string,
    body: string,
  ): Promise<void> {
    if (!body.trim()) {
      await this.supabase
        .from("notes")
        .delete()
        .eq("project_id", projectId)
        .eq("design_id", designId);
      return;
    }
    const { error } = await this.supabase
      .from("notes")
      .upsert(
        { project_id: projectId, design_id: designId, body },
        { onConflict: "project_id,design_id" },
      );
    if (error) throw error;
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
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
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
    // Bind the thread to the screen's current revision so it stays
    // valid even after the screen is regenerated (the revision is an
    // immutable snapshot with frozen source ids).
    const revisionId = await this.latestRevisionId(input.designId);
    const { data: threadData, error: tErr } = await this.supabase
      .from("comment_threads")
      .insert({
        project_id: input.projectId,
        design_id: input.designId,
        anchor_id: input.anchorId,
        anchor_kind: input.anchorKind,
        element_label: input.elementLabel,
        component_name: input.componentName ?? null,
        created_by: input.authorId,
        revision_id: revisionId,
      })
      .select(
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
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
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
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
        "id, project_id, design_id, anchor_id, anchor_kind, element_label, component_name, status, created_by, resolved_by, resolved_at, created_at",
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
