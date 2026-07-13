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
/** Which interface created a project / screen. Open vocabulary (the `(string
 *  & {})` keeps autocomplete while allowing new surfaces without a code change):
 *  "studio" (the canvas), "assets" (a separate social-asset app sharing the
 *  gradeui login), "mcp", "api", "import". */
export type ProjectOrigin =
  | "studio"
  | "assets"
  | "mcp"
  | "api"
  | "import"
  | (string & {});

/** Project KIND — drives the Studio interface/canvas. Open vocabulary. */
export type ProjectType =
  | "web-app"
  | "website"
  | "mobile-app"
  | "slides"
  | "social"
  | "email"
  | (string & {});

/** A canvas viewport frame. Unset on a project → the defaults for its `type`. */
export interface Viewport {
  name: string;
  width: number;
  height: number;
}

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
  /** Free-form project brief fed to the generation prompt — project-level
   *  steering ("what this project is, who it's for"). Empty → undefined. */
  context?: string;
  /** Project steering rules the agent follows / avoids — bullet lists that
   *  ride into the prompt alongside the per-component contracts. */
  dos?: string[];
  donts?: string[];
  /** Which interface created this project (studio | assets | sites | mcp |
   *  api | import). Defaults to "studio". */
  origin?: ProjectOrigin;
  /** Project KIND — drives the interface. Defaults to "web-app". */
  type?: ProjectType;
  /** Optional canvas viewports; unset = the defaults for `type`. */
  viewports?: Viewport[];
  /** Design-system registry this project's screens are written against
   *  ("gradeui", "brightlocal" — DesignSystemRegistry.id). Unset =
   *  the deployment default (NEXT_PUBLIC_STUDIO_REGISTRY, else
   *  gradeui). PROJECT-level on purpose: a screen's JSX targets one
   *  component vocabulary and chat context / refs / allowlist /
   *  exporters are project-scoped — screens inherit. Resolution:
   *  getRegistryById(project.registryId) ?? getActiveRegistry(). */
  registryId?: string;
  /** Named per-project rules files — the project-scoped sibling of the
   *  registry's rules/*.md dir. Each file's content rides verbatim into
   *  the generation prompt (after the registry rules, before the
   *  brief). Editable in Project Settings; keep them terse — every
   *  char is prompt tokens on every turn. */
  rulesFiles?: ProjectRulesFile[];
}

export interface ProjectRulesFile {
  id: string;
  /** Display name, .md by convention ("copy-tone.md", "nav-rules.md"). */
  name: string;
  content: string;
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
  /**
   * JSON-serialised `ThemeVariant[]` — the project's saved remixes.
   * Opaque to the storage layer (a string); the page parses it into
   * ThemeVariant objects. NULL/undefined = no variants yet. Mirrors the
   * themeDraftJson persistence path exactly.
   */
  themeVariantsJson?: string;
}

/** One immutable snapshot of a screen at a point in time. The source
 *  ids inside `appSource` are frozen, which is what lets a comment bound
 *  to this revision stay valid forever even after the screen is
 *  regenerated. */
export interface ScreenRevision {
  id: string;
  projectId: string;
  designId: string;
  appSource: string | null;
  label?: string;
  authorId?: string;
  createdAt: number;
}

/** Broad asset category. Drives the type tabs in the asset browser and
 *  later how each asset is consumed (media → MediaSurface, font → theme
 *  typography, document → reference/attachment). */
export type AssetType = "media" | "font" | "document";

/** How an asset came to be. `owner_id` is always the creator (whoever
 *  pressed the button); origin records the mechanism. "filled" =
 *  resolved via the MediaSurface fill flow; "generated" = AI-created;
 *  "stock" = pulled from a stock provider; "upload" = the user's bytes. */
export type AssetOrigin = "upload" | "generated" | "filled" | "stock";

/** A user-owned binary file (image, font, document). Owned by a USER —
 *  reusable across their projects — with an optional `projectId` tag.
 *  Bytes live in a private bucket; `url` is a short-lived signed URL
 *  minted on read (absent until then). */
export interface Asset {
  id: string;
  ownerId: string;
  /** Optional project association. Undefined = lives in the user's
   *  general library, usable anywhere. */
  projectId?: string;
  type: AssetType;
  /** Object path inside the bucket: {ownerId}/{id}.{ext}. */
  path: string;
  /** Original filename, shown in the browser. */
  name: string;
  contentType: string;
  /** Pixel dimensions for media (so a slot can reserve space). */
  width?: number;
  height?: number;
  bytes: number;
  /** How it was created (audit trail). */
  origin: AssetOrigin;
  /** The prompt/description that produced it — for generated/filled
   *  assets. The bit that lets you see (and re-run) what made an image. */
  sourcePrompt?: string;
  /** Accessibility text; also the seed for enrichment suggestions. */
  altText?: string;
  /** Open bag for derived metadata (alt-text suggestions, tags, colours,
   *  detected objects). Grows without a migration per signal. */
  enrichment?: Record<string, unknown>;
  createdAt: number;
  /** Signed, short-lived delivery URL. Minted on read; never persisted. */
  url?: string;
}

/** One immutable entry in the activity trail. Append-only; rendered as
 *  "{actor} {action} {target} on {designId} inside {projectId} at
 *  {createdAt}". See STUDIO-AUDIT.md. */
export interface StudioEvent {
  id: string;
  /** Who did it (users.id). Resolved to a name at render time. Undefined
   *  for anonymous actions — e.g. a `share.view` by a non-member. */
  actorId?: string;
  /** RLS scope. */
  projectId: string;
  /** The screen/variant it happened on; undefined = project-level. */
  designId?: string;
  /** Namespaced verb — "asset.generate", "comment.add", "screen.rename". */
  action: string;
  targetKind?: string;
  targetId?: string;
  /** Human-facing context: { model, prompt, from, to, … }. */
  metadata?: Record<string, unknown>;
  createdAt: number;
}

/** A public, obfuscated share link to a screen. `token` is the
 *  capability key that goes in the /s/<token> URL. `revisionId` pins a
 *  specific snapshot; undefined = always the latest (live). */
/** The canvas's viewport vocabulary — also the ids of the four preset
 *  specs, so mapping the canvas's current viewport onto a share's
 *  initial spec is identity. (Share rows themselves store full
 *  `ShareViewportSpec[]` docs — migration 0017.) */
export type ShareViewport = "responsive" | "mobile" | "tablet" | "desktop";

/**
 * One viewport a share exposes — the future-proof shape: named,
 * arbitrarily sized, orientable, and a share carries as MANY of these
 * as the creator wants. The four classic presets are just well-known
 * specs (see SHARE_VIEWPORT_PRESETS).
 *
 *   - `responsive: true` → fills the window; w/h/orientation ignored.
 *   - `orientation: "landscape"` renders h×w (the stored w/h stay
 *     portrait-normal so flipping is lossless).
 */
export interface ShareViewportSpec {
  /** Stable key within the share — preset id ("mobile") or a minted
   *  id for custom sizes ("custom-1"). */
  id: string;
  /** Display name — "Mobile", "iPhone 15 Pro", "Kiosk portrait"… */
  label: string;
  /** Fill-the-window mode (the classic "responsive"). */
  responsive?: boolean;
  /** Portrait-normal dimensions for fixed viewports. */
  w?: number;
  h?: number;
  orientation?: "portrait" | "landscape";
}

/** The classic four, as specs. Single source for the share dialog's
 *  default toggle rows and for upgrading legacy enum rows. */
export const SHARE_VIEWPORT_PRESETS: ShareViewportSpec[] = [
  { id: "responsive", label: "Responsive", responsive: true },
  { id: "mobile", label: "Mobile", w: 390, h: 844 },
  { id: "tablet", label: "Tablet", w: 768, h: 1024 },
  { id: "desktop", label: "Desktop", w: 1440, h: 900 },
];

/** Rendered size of a spec — applies the orientation flip. Returns
 *  undefined for responsive (no fixed artboard). */
export function shareViewportSize(
  spec: ShareViewportSpec,
): { w: number; h: number } | undefined {
  if (spec.responsive || !spec.w || !spec.h) return undefined;
  return spec.orientation === "landscape"
    ? { w: spec.h, h: spec.w }
    : { w: spec.w, h: spec.h };
}

export interface ShareLink {
  token: string;
  projectId: string;
  designId: string | null;
  revisionId?: string;
  mode: "view" | "comment";
  /** Light/dark the screen renders in — captured from the creator so
   *  the share matches what they were viewing. */
  colorMode: "light" | "dark";
  /** The viewport set this share EXPOSES (named / arbitrary W×H /
   *  orientation / any count), ordered as the share dialog listed
   *  them. The recipient's device menu is exactly this set — lets the
   *  creator lock a share to the viewports the screen actually
   *  supports (no mobile design yet → no Mobile option). Per-share
   *  theme assignment will follow the same pattern (STUDIO-THEMES.md). */
  viewports: ShareViewportSpec[];
  /** Which spec the share opens on (`viewports[i].id`). */
  initialViewportId: string;
  createdBy?: string;
  revoked: boolean;
  expiresAt?: number;
  createdAt: number;
}

/**
 * Thrown by a guarded write (saveScreen with `expectedUpdatedAt`) when the
 * row moved on since the caller loaded it — i.e. someone else (the AI/MCP,
 * another tab) saved in the meantime. The write did NOT happen; the caller
 * should surface this (pause autosave, offer reload) rather than retrying
 * blindly and clobbering the other edit. `currentUpdatedAt` is the live
 * version that beat us, when known.
 */
export class VersionConflictError extends Error {
  readonly currentUpdatedAt?: number;
  constructor(currentUpdatedAt?: number) {
    super("This was changed elsewhere since you loaded it.");
    this.name = "VersionConflictError";
    this.currentUpdatedAt = currentUpdatedAt;
  }
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
    /** Design-system registry id — see Project.registryId. */
    registryId?: string;
  }): Promise<Project>;

  /** Rename a project. Bumps `updatedAt`. Kept for back-compat;
   *  new callers should prefer `updateProject` which accepts a
   *  patch of any editable metadata. */
  renameProject(id: string, name: string): Promise<Project>;

  /** Patch a project's editable metadata. `name`/`description` are the
   *  basics; `context`/`dos`/`donts` are the agent-steering guidance the
   *  harness injects into every screen context. Bumps `updatedAt`. Empty
   *  strings on `description` are normalised to undefined so the UI fallback
   *  to the screen count works after a user clears the field. */
  updateProject(
    id: string,
    patch: Partial<
      Pick<
        Project,
        "name" | "description" | "context" | "dos" | "donts" | "registryId" | "rulesFiles"
      >
    >,
  ): Promise<Project>;

  /** Soft-delete a project — marks `deleted_at` so it drops out of
   *  listProjects but stays recoverable. Cloud adapter soft-deletes +
   *  logs the event; the local adapter hard-deletes (no recovery
   *  surface in local-only mode). Idempotent. */
  deleteProject(id: string): Promise<void>;

  /** Restore a soft-deleted project (clears `deleted_at`). Cloud-only;
   *  local has no trash. */
  restoreProject(id: string): Promise<void>;

  /** Persist the project's current in-memory state. Reconciles the
   *  normalised rows (screens, messages, notes) against the snapshot
   *  — upserting present rows and deleting removed ones. The bulk
   *  catch-all used by the page's autosave + project-switch flush;
   *  discrete user actions prefer the granular helpers below. */
  saveProject(snapshot: ProjectSnapshot): Promise<void>;

  // ─── Screens (designs) — granular, row-level writes ─────────────
  // These exist so the page persists a discrete user action (add a
  // screen, close a screen) as a single row write rather than
  // re-serialising the whole project. `saveProject` remains the
  // reconciling catch-all; these are the fast path.

  /** Append a screen to a project. The page mints the `Design`
   *  (id, name, status, timestamps); the adapter writes one row at
   *  `position` (0-based index in the screen list). Logs a
   *  `screen.create` event — or `screen.duplicate` (carrying the source
   *  screen) when `duplicatedFrom` is supplied. */
  addScreen(
    projectId: string,
    design: Design,
    position: number,
    duplicatedFrom?: { id: string; name: string },
  ): Promise<void>;

  /** Soft-delete a screen — marks `deleted_at` so it drops out of
   *  loadProject but its chat, note, threads, and revisions are left
   *  intact for recovery. Cloud adapter soft-deletes + logs a
   *  `screen.delete` event; local hard-removes (no trash). The
   *  active-screen pointer is the caller's concern. Idempotent. */
  deleteScreen(projectId: string, designId: string): Promise<void>;

  /** Restore a soft-deleted screen (clears `deleted_at`); it returns
   *  with its full history thanks to the revision spine. Cloud-only. */
  restoreScreen(projectId: string, designId: string): Promise<void>;

  /** Persist a screen's editable fields (name, appSource, status,
   *  updatedAt) without touching its siblings. Used after inline
   *  rename / source regeneration.
   *
   *  `expectedUpdatedAt` (optional) is the optimistic-concurrency token:
   *  the `updatedAt` the caller last loaded. When provided, the write only
   *  lands if the row hasn't moved on since — otherwise it throws
   *  {@link VersionConflictError} and does NOT overwrite (a concurrent edit,
   *  e.g. by the AI/MCP or another tab, won). Omit for an unguarded write. */
  saveScreen(
    projectId: string,
    design: Design,
    position?: number,
    expectedUpdatedAt?: number,
  ): Promise<void>;

  /** Replace a screen's chat history wholesale. One row per message,
   *  ordered by array index. */
  saveMessages(
    projectId: string,
    designId: string,
    messages: UIMessage[],
  ): Promise<void>;

  /** Upsert a screen's free-form note body. Empty / whitespace-only
   *  clears the row. */
  saveNote(projectId: string, designId: string, body: string): Promise<void>;

  // ─── Revisions (immutable screen-history snapshots) ─────────────
  // Each sealed change to a screen writes one revision. Comments bind
  // to the revision they were made on (see createThread), so they
  // survive regeneration. The latest revision is the "current" screen.

  /** Append an immutable revision snapshot for a screen. Returns the
   *  created row (its id is the binding target for new comments). */
  addRevision(input: {
    projectId: string;
    designId: string;
    appSource: string | null;
    label?: string;
    authorId: string;
  }): Promise<ScreenRevision>;

  /** Every revision for a screen, newest first. */
  listRevisions(
    projectId: string,
    designId: string,
  ): Promise<ScreenRevision[]>;

  // ─── Share links (public, obfuscated screen shares) ─────────────

  /** Mint a public share link for a screen. Returns the row incl. its
   *  `token` — the caller builds the /s/<token> URL. Cloud-only. */
  createShareLink(input: {
    projectId: string;
    designId: string;
    mode?: "view" | "comment";
    colorMode?: "light" | "dark";
    /** Viewport set + which one the share opens on. Defaults to the
     *  four presets opening on "responsive". The adapter clamps the
     *  initial id into the set. */
    viewports?: { initialId: string; specs: ShareViewportSpec[] };
    revisionId?: string;
  }): Promise<ShareLink>;

  /** Every share link for a project (to list/manage/revoke). */
  listShareLinks(projectId: string): Promise<ShareLink[]>;

  /** Revoke a link by token (soft — sets revoked = true). */
  revokeShareLink(token: string): Promise<void>;

  // ─── Assets (user-owned files: media / fonts / documents) ───────
  // Cloud-only — the bytes live in a private Supabase Storage bucket.
  // The local adapter degrades gracefully (empty list / clear error).

  /** The signed-in user's assets, newest first. Optionally filter by
   *  type and/or project tag. Each returned asset carries a freshly
   *  minted, short-lived signed `url`. */
  listAssets(opts?: {
    type?: AssetType;
    projectId?: string;
  }): Promise<Asset[]>;

  /** Upload a file to the user's library. Writes the bytes to the
   *  bucket + the metadata row, and returns the asset with a signed
   *  `url`. `projectId` optionally tags it to a project; origin +
   *  sourcePrompt record provenance (e.g. a generated/filled image
   *  carries the prompt that made it). Cloud-only. */
  uploadAsset(input: {
    file: File;
    type?: AssetType;
    projectId?: string;
    width?: number;
    height?: number;
    origin?: AssetOrigin;
    sourcePrompt?: string;
    altText?: string;
    enrichment?: Record<string, unknown>;
  }): Promise<Asset>;

  /** Patch an asset's mutable metadata — tag it to (or off) a project,
   *  set alt text, attach enrichment. Owner-only. Returns the updated
   *  asset (with a fresh signed `url`). */
  updateAsset(
    id: string,
    patch: {
      projectId?: string | null;
      altText?: string;
      enrichment?: Record<string, unknown>;
    },
  ): Promise<Asset>;

  /** Delete an asset (bucket object + metadata row). Owner-only. */
  deleteAsset(id: string): Promise<void>;

  // ─── Activity trail (cross-cutting audit log) ───────────────────
  // Append-only. Every meaningful action funnels through logEvent;
  // feeds read via listEvents. See STUDIO-AUDIT.md.

  /** Record one action on the trail. Best-effort — never throws; a
   *  failed log must not break the action that triggered it. Cloud-only
   *  (local mode no-ops). */
  logEvent(input: {
    projectId: string;
    designId?: string;
    action: string;
    targetKind?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  /** Read a project's trail, newest first. Filter by `designId` for a
   *  single screen's history. */
  listEvents(opts: {
    projectId: string;
    designId?: string;
    limit?: number;
  }): Promise<StudioEvent[]>;

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
