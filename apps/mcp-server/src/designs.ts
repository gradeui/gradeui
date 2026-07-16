/**
 * The persistence layer for the MCP server — projects + screens (the
 * `designs` table) in Supabase.
 *
 * Mirrors the shapes the docs autosave adapter writes
 * (apps/docs/lib/studio-storage/supabase-adapter.ts) so a screen written
 * here is indistinguishable from one Studio wrote:
 *
 *   - a SCREEN is a row in `designs`; its JSX lives at `state.appSource`
 *     as a RAW STRING (no IR / no payload — see CLAUDE.md).
 *   - `position` is the 0-based order in the project's screen list.
 *   - timestamps are epoch milliseconds (BIGINT columns).
 *   - design ids are client-minted TEXT (not UUIDs).
 *
 * Every call surfaces its Supabase error by throwing — never swallow a
 * write error (STUDIO-PERSISTENCE.md: a swallowed error is silent data
 * loss).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const nowMs = () => Date.now();

/** Mint a screen id in the same shape the Studio client uses: a short,
 *  sortable, collision-resistant text id. */
export function mintScreenId(): string {
  return "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** The JSONB `state` blob on a `designs` row. */
export interface DesignState {
  appSource?: string | null;
  status?: string | null;
  kind?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  activeDesignId: string | null;
}

export interface ScreenRow {
  id: string;
  name: string;
  state: DesignState | null;
  position: number;
  createdAt: number;
  /** Epoch ms of the last save — posters captured before this are stale. */
  updatedAt: number;
}

export interface ScreenSummary {
  id: string;
  name: string;
  position: number;
}

// ─── Projects ──────────────────────────────────────────────────────────

/** List the configured owner's live (non-deleted) user-owned projects,
 *  newest first. */
export async function listProjects(
  sb: SupabaseClient,
  ownerUserId: string,
): Promise<ProjectSummary[]> {
  const { data, error } = await sb
    .from("projects")
    .select("id, name, updated_at, active_design_id")
    .eq("owner_type", "user")
    .eq("owner_id", ownerUserId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    updatedAt: r.updated_at as number,
    activeDesignId: (r.active_design_id as string | null) ?? null,
  }));
}

/** Create a new user-owned project. Owner = the configured user, so it's
 *  visible to them on the site via RLS. Returns the new id. */
export async function createProject(
  sb: SupabaseClient,
  ownerUserId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const id = randomUUID();
  const now = nowMs();
  const { error } = await sb.from("projects").insert({
    id,
    name,
    owner_type: "user",
    owner_id: ownerUserId,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return { id, name };
}

/** Guard: the project exists, isn't soft-deleted, and (if user-owned)
 *  belongs to the configured owner. Keeps a stray projectId from writing
 *  screens into someone else's project even though the service role
 *  technically could. Returns the project's `registry_id` so callers can
 *  resolve the right design-system contracts (BYODS) without a second
 *  round-trip. */
export async function assertProject(
  sb: SupabaseClient,
  ownerUserId: string,
  projectId: string,
): Promise<{ registryId: string | null }> {
  const { data, error } = await sb
    .from("projects")
    .select("id, owner_type, owner_id, deleted_at, registry_id")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Project ${projectId} not found.`);
  if (data.deleted_at) throw new Error(`Project ${projectId} is deleted.`);
  if (data.owner_type === "user" && data.owner_id !== ownerUserId) {
    throw new Error(
      `Project ${projectId} is not owned by the configured GRADE_OWNER_USER_ID — refusing to write to it.`,
    );
  }
  return { registryId: (data.registry_id as string | null) ?? null };
}

// ─── Theme (on the `projects` row) ─────────────────────────────────────

export interface ProjectTheme {
  /** The working ThemeInput — deterministic; Studio's generateTheme()
   *  reproduces the rendered theme from this. null when never edited. */
  draft: unknown | null;
  /** Saved named variants, if any. */
  variants: unknown | null;
  /** The project row's current `updated_at` — its optimistic-concurrency
   *  version. Pass it back to save_theme to guard against overwrites. */
  updatedAt: number;
}

/** Read a project's theme: the working draft ThemeInput plus any saved
 *  variants. The columns hold STRINGIFIED JSON (matching the Studio
 *  adapter, supabase-adapter.ts), so we parse before returning. */
export async function getTheme(
  sb: SupabaseClient,
  projectId: string,
): Promise<ProjectTheme> {
  const { data, error } = await sb
    .from("projects")
    .select("theme_draft_json, theme_variants_json, updated_at")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Project ${projectId} not found.`);
  const parse = (s: unknown): unknown | null => {
    if (s == null) return null;
    if (typeof s !== "string") return s; // tolerate a JSONB column too
    try {
      return JSON.parse(s);
    } catch {
      throw new Error(
        `Project ${projectId} theme JSON is malformed and could not be parsed.`,
      );
    }
  };
  return {
    draft: parse(data.theme_draft_json),
    variants: parse(data.theme_variants_json),
    updatedAt: data.updated_at as number,
  };
}

/** A project's owner-set agent guidance (migration 0019). The harness injects
 *  these into every screen context so the model follows the project's steering,
 *  not just the global Grade rules. */
export interface ProjectGuidelines {
  context: string | null;
  dos: string[];
  donts: string[];
  type: string | null;
}

export async function getProjectGuidelines(
  sb: SupabaseClient,
  projectId: string,
): Promise<ProjectGuidelines> {
  const { data, error } = await sb
    .from("projects")
    .select("context, dos, donts, type")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Project ${projectId} not found.`);
  return {
    context: (data.context as string | null) ?? null,
    dos: (data.dos as string[] | null) ?? [],
    donts: (data.donts as string[] | null) ?? [],
    type: (data.type as string | null) ?? null,
  };
}

export interface SaveThemeResult {
  /** false when the write was refused (the row moved on since
   *  expectedUpdatedAt) — reload, don't retry blindly. */
  ok: boolean;
  conflict?: boolean;
  /** The row's current `updatedAt`: the value just written on success, or
   *  the value that beat us on conflict. */
  updatedAt?: number;
}

/** Write a project's working theme draft (a ThemeInput object). Stored as
 *  a JSON STRING to match the Studio adapter's column shape, and bumps
 *  updated_at so the project re-sorts and Studio reloads the new theme.
 *  Only the draft is touched — saved variants are left alone. When
 *  `expectedUpdatedAt` is given, the write is guarded (race-free) and
 *  refused on a version mismatch rather than overwriting. */
export async function saveTheme(
  sb: SupabaseClient,
  projectId: string,
  theme: unknown,
  expectedUpdatedAt?: number,
): Promise<SaveThemeResult> {
  const now = nowMs();
  let q = sb
    .from("projects")
    .update({ theme_draft_json: JSON.stringify(theme), updated_at: now })
    .eq("id", projectId);
  if (expectedUpdatedAt != null) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id");
  if (error) throw error;
  if (expectedUpdatedAt != null && (!data || data.length === 0)) {
    // Version moved on (or the project vanished) — surface the live value.
    const { data: cur } = await sb
      .from("projects")
      .select("updated_at")
      .eq("id", projectId)
      .maybeSingle();
    return {
      ok: false,
      conflict: true,
      updatedAt: cur?.updated_at as number | undefined,
    };
  }
  return { ok: true, updatedAt: now };
}

// ─── Screens (the `designs` table) ─────────────────────────────────────

/** List a project's live screens in display order. */
export async function listScreens(
  sb: SupabaseClient,
  projectId: string,
): Promise<ScreenSummary[]> {
  const { data, error } = await sb
    .from("designs")
    .select("id, name, position")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    position: r.position as number,
  }));
}

/** Fetch one screen (its raw JSX appSource + metadata), or null. */
export async function getScreen(
  sb: SupabaseClient,
  projectId: string,
  screenId: string,
): Promise<ScreenRow | null> {
  const { data, error } = await sb
    .from("designs")
    .select("id, name, state, position, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("id", screenId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    state: (data.state as DesignState | null) ?? null,
    position: data.position as number,
    createdAt: data.created_at as number,
    updatedAt: (data.updated_at as number) ?? (data.created_at as number),
  };
}

/** Next free position at the end of a project's screen list. */
async function nextPosition(
  sb: SupabaseClient,
  projectId: string,
): Promise<number> {
  const { data, error } = await sb
    .from("designs")
    .select("position")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return ((data?.position as number | undefined) ?? -1) + 1;
}

export interface SaveScreenInput {
  projectId: string;
  /** Omit to create a new screen (a fresh id is minted). Pass to update an
   *  existing one in place (iteration). */
  screenId?: string;
  /** Display name. Defaults to the existing name on update, or "Untitled". */
  name?: string;
  /** The raw JSX source — stored verbatim at `state.appSource`. */
  jsx: string;
  /** Point `projects.active_design_id` at this screen after saving so it's
   *  the one Studio opens. Defaults true. */
  makeActive?: boolean;
  /** Optimistic-concurrency token: the `updatedAt` the caller loaded (from
   *  get_screen). When provided on an UPDATE, the write only lands if the
   *  row hasn't moved on since — otherwise it's a conflict and we DON'T
   *  overwrite. Omit for a brand-new screen or to force an unguarded write. */
  expectedUpdatedAt?: number;
}

export interface SaveScreenResult {
  id: string;
  position: number;
  created: boolean;
  /** Set when the write was refused because the row changed since
   *  `expectedUpdatedAt` — the caller should reload, not retry blindly. */
  conflict?: boolean;
  /** The row's current `updatedAt` (its live version) — on success the value
   *  just written, on conflict the value that beat us. */
  updatedAt?: number;
}

/**
 * Upsert a screen row. Preserves `created_at` + `position` on update;
 * appends at the end for a new screen. Writes the JSX verbatim into
 * `state.appSource`.
 */
export async function saveScreen(
  sb: SupabaseClient,
  input: SaveScreenInput,
): Promise<SaveScreenResult> {
  const { projectId, jsx, makeActive = true, expectedUpdatedAt } = input;
  const id = input.screenId ?? mintScreenId();
  const existing = await getScreen(sb, projectId, id);
  const now = nowMs();

  // Optimistic concurrency. The early check gives a clean conflict; the
  // `.eq("updated_at", …)` on the UPDATE below is the RACE-FREE guard (it's
  // the database, not us, that compares-and-swaps).
  if (
    expectedUpdatedAt != null &&
    existing &&
    existing.updatedAt !== expectedUpdatedAt
  ) {
    return {
      id,
      position: existing.position,
      created: false,
      conflict: true,
      updatedAt: existing.updatedAt,
    };
  }

  const createdAt = existing?.createdAt ?? now;
  const position =
    existing?.position ?? (await nextPosition(sb, projectId));
  const status = existing?.state?.status ?? "draft";
  const name = input.name ?? existing?.name ?? "Untitled";

  const row = {
    id,
    project_id: projectId,
    name,
    state: { appSource: jsx, status, kind: "screen" } satisfies DesignState,
    position,
    created_at: createdAt,
    updated_at: now,
  };

  if (existing && expectedUpdatedAt != null) {
    // Guarded update: only lands if the row is still at expectedUpdatedAt.
    const { data, error } = await sb
      .from("designs")
      .update(row)
      .eq("id", id)
      .eq("updated_at", expectedUpdatedAt)
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) {
      const fresh = await getScreen(sb, projectId, id);
      return {
        id,
        position,
        created: false,
        conflict: true,
        updatedAt: fresh?.updatedAt,
      };
    }
  } else {
    const { error } = await sb
      .from("designs")
      .upsert(row, { onConflict: "id" });
    if (error) throw error;
  }

  if (makeActive) {
    const { error: projErr } = await sb
      .from("projects")
      .update({ active_design_id: id, updated_at: now })
      .eq("id", projectId);
    if (projErr) throw projErr;
  }

  return { id, position, created: !existing, updatedAt: now };
}
