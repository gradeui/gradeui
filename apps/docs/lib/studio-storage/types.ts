/**
 * Studio storage — interface + types.
 *
 * The contract every storage adapter implements. The page only depends
 * on these types, never on an adapter directly, so swapping the
 * LocalStorage implementation for a Supabase one is a single line in
 * `index.ts` (the factory). Methods are async-by-default because the
 * Supabase swap WILL be async — keeping the surface async from day one
 * means no callsite changes when we cut over.
 *
 * Schema design (forward-looking):
 *
 *   projects ─┬─ designs (1:N, project_id FK)
 *             ├─ messages (1:N, project_id + design_id FK)
 *             ├─ notes (1:N, project_id + design_id FK)
 *             └─ theme_drafts (1:1, project_id PK)
 *
 * Today's LocalStorage adapter writes a single nested blob per project
 * for simplicity (one localStorage key = one full snapshot). When we
 * move to Supabase the same `ProjectSnapshot` shape gets unpacked into
 * the row-based tables above; nothing about the page-side type
 * surface changes.
 */

import type { UIMessage } from "ai";
import type { Design } from "@/lib/studio-designs";
import type {
  Comment,
  CommentThread,
  CommentThreadStatus,
  CommentThreadWithMessages,
} from "@/lib/studio-comments";
import type {
  Membership,
  OrgMembership,
  Organisation,
  ResourceAccess,
  Subject,
  Team,
  User,
} from "@/lib/studio-users";

/** Metadata-only view of a project — what `listProjects` returns.
 *  Keeps the listing fast: we don't want to deserialise every
 *  design's appSource just to render the sidebar.
 *
 *  Owner + access are polymorphic: a project is owned either by a
 *  user (rare — true personal scratch) or by a team (the common
 *  case), and grants in `access` reference either users (direct
 *  invites, guests) or teams (every member inherits). Real auth +
 *  Supabase will fill these from server queries; today's local
 *  setup backfills them via the storage adapter's v3→v4
 *  migration. */
export interface Project {
  id: string;
  name: string;
  /** Optional free-form description shown in the Projects menu
   *  (replaces the default "N screens" line when set) and edited
   *  in ProjectSettingsSheet. One line of plain text — not
   *  markdown. Empty string normalises to undefined so the UI
   *  fallback works cleanly. */
  description?: string;
  createdAt: number;
  updatedAt: number;
  /** Polymorphic owner — typically a team for normal collaboration
   *  flows; can be a user for personal-scratch projects that bypass
   *  team semantics. Pre-v4 data carried a flat `ownerId` field;
   *  the migration converts every such entry to `{ type: "user",
   *  id }` then re-homes them into the Personal team. */
  owner: Subject;
  /** Explicit grants beyond ownership — guest invites (user-typed
   *  subjects) and team-shares (team-typed). Order is preserved as
   *  written; the UI sorts for display. */
  access: ResourceAccess[];
}

// Re-exports of related entity types — keeps `@/lib/studio-storage`
// the canonical import path for everything storage-adjacent.
export type {
  Comment,
  CommentThread,
  CommentThreadStatus,
  CommentThreadWithMessages,
} from "@/lib/studio-comments";

/** Full project state — what `loadProject` returns and `saveProject`
 *  accepts. Mirrors the in-memory shape the Studio page maintains
 *  today; the storage layer is intentionally schema-flat with the
 *  page so we don't pay a translation cost on every save. */
export interface ProjectSnapshot {
  project: Project;
  designs: Design[];
  /** Which screen is currently focused inside this project. Stored
   *  per-project so switching back to a project remembers where you
   *  left off. */
  activeDesignId: string;
  messagesByDesign: Record<string, UIMessage[]>;
  notesByDesign: Record<string, string>;
  /**
   * JSON-serialised ThemeInput for the per-project theme draft.
   * Reserved in the schema even though the page doesn't wire it
   * through yet — the ThemeBuilderProvider's internal state needs a
   * public read API before we can save it cleanly. Schema-stable
   * upfront so the day we add theme persistence is a page-only diff,
   * not a storage migration.
   */
  themeDraftJson?: string;
}

export interface StudioStorage {
  /** List every project. Metadata only — call `loadProject` to get
   *  designs/chat/notes. */
  listProjects(): Promise<Project[]>;

  /** Load a single project's full snapshot. Returns `null` if the id
   *  doesn't resolve (e.g. project was deleted in another tab). */
  loadProject(id: string): Promise<ProjectSnapshot | null>;

  /** Create a new project. The adapter seeds it with a single blank
   *  design so the workspace is never empty. Returns the new
   *  project's metadata; the caller can `loadProject` if it needs
   *  the full snapshot. */
  createProject(input: {
    name: string;
    description?: string;
  }): Promise<Project>;

  /** Rename a project. Bumps `updatedAt`. Kept for back-compat;
   *  new callers should prefer `updateProject` which accepts a
   *  patch of any editable metadata. */
  renameProject(id: string, name: string): Promise<Project>;

  /** Patch a project's editable metadata (name, description).
   *  Bumps `updatedAt`. Empty strings on `description` are
   *  normalised to undefined so the UI fallback to the screen
   *  count works after a user clears the field. */
  updateProject(
    id: string,
    patch: Partial<Pick<Project, "name" | "description">>,
  ): Promise<Project>;

  /** Delete a project and everything it owns (designs, chat,
   *  notes). Idempotent — deleting a non-existent project is a
   *  no-op. */
  deleteProject(id: string): Promise<void>;

  /** Persist the project's current in-memory state. Replaces the
   *  stored snapshot wholesale. */
  saveProject(snapshot: ProjectSnapshot): Promise<void>;

  /** Read the cross-session pointer to which project the user had
   *  open last. `null` on a fresh install. */
  getActiveProjectId(): Promise<string | null>;

  /** Write the cross-session pointer. Pass `null` to clear. */
  setActiveProjectId(id: string | null): Promise<void>;

  // ─── Teams ─────────────────────────────────────────────────────
  // Lightweight CRUD for teams + memberships. Tomorrow these
  // queries land in Supabase tables with RLS policies; today they
  // read from localStorage. The interface is the same in both.

  /** Every team the storage knows about. */
  listTeams(): Promise<Team[]>;
  /** Single team by id, or null. */
  getTeam(id: string): Promise<Team | null>;
  /** Create a new team. Returns the metadata. The caller is
   *  responsible for adding a Membership row for the creator. */
  createTeam(input: { name: string; orgId?: string }): Promise<Team>;
  /** Rename. */
  renameTeam(id: string, name: string): Promise<Team>;
  /** Delete a team. Idempotent. The adapter is responsible for
   *  ALSO removing every membership row that referenced it so the
   *  page doesn't see orphans. Projects owned by the team are NOT
   *  cascade-deleted (caller decides what to do with them — could
   *  re-home into another team or delete separately). */
  deleteTeam(id: string): Promise<void>;

  /** All membership rows. Page typically filters to the current
   *  user. Future Supabase impl can take a userId arg to scope
   *  server-side. */
  listMemberships(): Promise<Membership[]>;
  /** Add a membership. Idempotent on (userId, teamId) — replacing
   *  the role if a row already exists. */
  addMembership(membership: Membership): Promise<Membership>;
  /** Remove a (userId, teamId) row. Idempotent. */
  removeMembership(input: {
    userId: string;
    teamId: string;
  }): Promise<void>;
  /** Update only the role on an existing (userId, teamId) row. */
  updateMembershipRole(input: {
    userId: string;
    teamId: string;
    role: Membership["role"];
  }): Promise<Membership>;

  // ─── Users ─────────────────────────────────────────────────────
  // First-class persisted entity for the SuperAdminSheet's
  // enumeration. When real auth lands these queries back onto the
  // auth provider's user table.

  listUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  /** Patch fields on an existing user. Pass only the fields to
   *  change; omitted fields are left alone. */
  updateUser(id: string, patch: Partial<User>): Promise<User>;

  // ─── Organisations ─────────────────────────────────────────────
  // Top-level entity that owns teams + carries plan/limits.

  listOrgs(): Promise<Organisation[]>;
  getOrg(id: string): Promise<Organisation | null>;
  createOrg(input: { name: string }): Promise<Organisation>;
  renameOrg(id: string, name: string): Promise<Organisation>;
  /** Delete an org. Cascade: drops every org-membership row that
   *  referenced it; teams within the org are NOT cascade-deleted
   *  (caller decides what to do — typically re-home them). */
  deleteOrg(id: string): Promise<void>;

  listOrgMemberships(): Promise<OrgMembership[]>;
  /** Upsert on (userId, orgId). */
  addOrgMembership(membership: OrgMembership): Promise<OrgMembership>;
  removeOrgMembership(input: {
    userId: string;
    orgId: string;
  }): Promise<void>;
  updateOrgMembershipRole(input: {
    userId: string;
    orgId: string;
    role: OrgMembership["role"];
  }): Promise<OrgMembership>;

  // ─── Comments ──────────────────────────────────────────────────
  // Comment threads anchored to a specific element on a screen.
  // Storage organises them per-design so the panel can load just
  // the active screen's threads. Each `CommentThreadWithMessages`
  // bundles the thread row + its comments in createdAt order — the
  // panel renders this shape directly without a join step.

  /** Every thread (with messages) on a given screen. Returned in
   *  createdAt ascending order. */
  listThreads(
    projectId: string,
    designId: string,
  ): Promise<CommentThreadWithMessages[]>;

  /** Create a new thread anchored to a stable element identifier
   *  (sourceId — preferred — or instanceId as a fallback). Adapter
   *  mints the ids + timestamps and writes both rows atomically. */
  createThread(input: {
    projectId: string;
    designId: string;
    anchorId: string;
    anchorKind: "source" | "instance";
    elementLabel: string;
    componentName?: string;
    body: string;
    authorId: string;
  }): Promise<CommentThreadWithMessages>;

  /** Flip a thread's status to `resolved` (or back to `open` with
   *  `reopenThread`). `resolvedBy` + `resolvedAt` are stamped from
   *  the caller. */
  resolveThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
    userId: string;
  }): Promise<CommentThread>;
  reopenThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<CommentThread>;

  /** Delete a thread + every comment in it. Idempotent. */
  deleteThread(input: {
    projectId: string;
    designId: string;
    threadId: string;
  }): Promise<void>;

  /** Append a comment (or one-level reply) to an existing thread.
   *  `parentCommentId` undefined = top-level follow-up; non-null =
   *  reply to that comment. Adapter mints id + timestamp. */
  addComment(input: {
    projectId: string;
    designId: string;
    threadId: string;
    parentCommentId?: string;
    authorId: string;
    body: string;
  }): Promise<Comment>;

  /** Edit a comment's body. Stamps `editedAt` so the UI can show
   *  the edited-indicator. Returns the patched row. */
  editComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
    body: string;
  }): Promise<Comment>;

  /** Delete a comment. Idempotent. If the deleted comment is the
   *  thread's opener AND the thread has no other comments, the
   *  adapter also deletes the thread (orphan threads don't make
   *  sense). */
  deleteComment(input: {
    projectId: string;
    designId: string;
    commentId: string;
  }): Promise<void>;
}

// Re-export so consumers can import types from `@/lib/studio-storage`
// without threading two paths (storage for Project/Snapshot, users
// for Team/Membership/etc).
export type {
  Membership,
  OrgMembership,
  Organisation,
  Subject,
  Team,
  User,
} from "@/lib/studio-users";
