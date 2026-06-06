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
 *  technically could. */
export async function assertProject(
  sb: SupabaseClient,
  ownerUserId: string,
  projectId: string,
): Promise<void> {
  const { data, error } = await sb
    .from("projects")
    .select("id, owner_type, owner_id, deleted_at")
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
    .select("id, name, state, position, created_at")
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
}

export interface SaveScreenResult {
  id: string;
  position: number;
  created: boolean;
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
  const { projectId, jsx, makeActive = true } = input;
  const id = input.screenId ?? mintScreenId();
  const existing = await getScreen(sb, projectId, id);
  const now = nowMs();

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

  const { error } = await sb
    .from("designs")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;

  if (makeActive) {
    const { error: projErr } = await sb
      .from("projects")
      .update({ active_design_id: id, updated_at: now })
      .eq("id", projectId);
    if (projErr) throw projErr;
  }

  return { id, position, created: !existing };
}
