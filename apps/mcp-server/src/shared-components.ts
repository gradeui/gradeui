/**
 * Shared components — project-scoped reusable JSX modules screens import
 * via the stable "@project/components" specifier (an AppLayout, a
 * Stepper, a chart wrapper) instead of copy-pasting per screen.
 *
 * Mirrors the shapes designs.ts writes for screens: client-minted text
 * ids, epoch-ms versions, guarded compare-and-swap saves, soft delete.
 * The docs-side renderers fetch these rows and compile each `source`
 * with the same kernel that compiles screens.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

function nowMs(): number {
  return Date.now();
}

/** Client-minted id, matching the designs.id convention. */
export function mintComponentId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export interface SharedComponentRow {
  id: string;
  name: string;
  source: string;
  description: string | null;
  updatedAt: number;
}

export interface SharedComponentMeta {
  id: string;
  name: string;
  description: string | null;
  updatedAt: number;
  sourceChars: number;
}

/** List a project's LIVE shared components — metadata only (no source),
 *  so a big library doesn't blow the tool-result payload budget. */
export async function listSharedComponents(
  sb: SupabaseClient,
  projectId: string,
): Promise<SharedComponentMeta[]> {
  const { data, error } = await sb
    .from("shared_components")
    .select("id, name, description, updated_at, source")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    updatedAt: r.updated_at as number,
    sourceChars: ((r.source as string) ?? "").length,
  }));
}

/** Fetch one live shared component (by id) with its full source. */
export async function getSharedComponent(
  sb: SupabaseClient,
  projectId: string,
  componentId: string,
): Promise<SharedComponentRow | null> {
  const { data, error } = await sb
    .from("shared_components")
    .select("id, name, source, description, updated_at")
    .eq("project_id", projectId)
    .eq("id", componentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id as string,
    name: data.name as string,
    source: data.source as string,
    description: (data.description as string | null) ?? null,
    updatedAt: data.updated_at as number,
  };
}

export interface SaveSharedComponentInput {
  projectId: string;
  name: string;
  source: string;
  description?: string;
  createdBy?: string;
  /** Update an existing component in place; omitted → create. */
  componentId?: string;
  /** Version guard for updates (from get_shared_component). */
  expectedUpdatedAt?: number;
}

export interface SaveSharedComponentResult {
  id: string;
  created: boolean;
  conflict?: boolean;
  /** Name already taken by another live component in this project. */
  nameTaken?: boolean;
  updatedAt?: number;
}

/**
 * Create or update a shared component. Updates are compare-and-swap
 * guarded exactly like saveScreen: the DB compares `updated_at`, not us.
 */
export async function saveSharedComponent(
  sb: SupabaseClient,
  input: SaveSharedComponentInput,
): Promise<SaveSharedComponentResult> {
  const { projectId, name, source, description, createdBy, expectedUpdatedAt } = input;
  const now = nowMs();

  if (input.componentId) {
    const existing = await getSharedComponent(sb, projectId, input.componentId);
    if (!existing) {
      throw new Error(
        `Shared component ${input.componentId} not found in project ${projectId} (or it is deleted).`,
      );
    }
    if (expectedUpdatedAt != null && existing.updatedAt !== expectedUpdatedAt) {
      return { id: existing.id, created: false, conflict: true, updatedAt: existing.updatedAt };
    }
    let q = sb
      .from("shared_components")
      .update({ name, source, description: description ?? null, updated_at: now })
      .eq("project_id", projectId)
      .eq("id", input.componentId);
    if (expectedUpdatedAt != null) q = q.eq("updated_at", expectedUpdatedAt);
    const { data, error } = await q.select("id, updated_at");
    if (error) {
      if (isUniqueViolation(error)) return { id: existing.id, created: false, nameTaken: true };
      throw error;
    }
    if (!data || data.length === 0) {
      const live = await getSharedComponent(sb, projectId, input.componentId);
      return {
        id: input.componentId,
        created: false,
        conflict: true,
        updatedAt: live?.updatedAt,
      };
    }
    return { id: input.componentId, created: false, updatedAt: data[0].updated_at as number };
  }

  const id = mintComponentId();
  const { error } = await sb.from("shared_components").insert({
    id,
    project_id: projectId,
    name,
    source,
    description: description ?? null,
    created_by: createdBy ?? null,
    created_at: now,
    updated_at: now,
  });
  if (error) {
    if (isUniqueViolation(error)) return { id, created: false, nameTaken: true };
    throw error;
  }
  return { id, created: true, updatedAt: now };
}

/** Soft-delete (0016 "mark, don't destroy"). Frees the name for reuse. */
export async function deleteSharedComponent(
  sb: SupabaseClient,
  projectId: string,
  componentId: string,
): Promise<boolean> {
  const { data, error } = await sb
    .from("shared_components")
    .update({ deleted_at: nowMs() })
    .eq("project_id", projectId)
    .eq("id", componentId)
    .is("deleted_at", null)
    .select("id");
  if (error) throw error;
  return Boolean(data && data.length > 0);
}

function isUniqueViolation(error: { code?: string }): boolean {
  return error.code === "23505";
}

/** Missing-table guard (migration not applied yet) — Postgres 42P01. */
export function isMissingTable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "42P01"
  );
}
