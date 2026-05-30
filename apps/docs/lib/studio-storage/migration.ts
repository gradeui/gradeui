"use client";

/**
 * First-sign-in local-to-cloud migration.
 *
 * When a user signs in for the first time on a device that has
 * local Studio data (projects in localStorage), we copy that data
 * into their cloud account so their work doesn't appear to vanish.
 * Subsequent sign-ins skip this — the migration is gated by a
 * one-time flag stored in Supabase user_metadata.
 *
 * Order matters: the LOCAL_USER_ID on existing seed data is
 * rewritten to the signed-in Supabase user id as the data flows
 * through. After successful migration, the local data is left in
 * place (read-only fallback) but the active backend becomes
 * Supabase.
 *
 * Idempotency: the migration checks `user_metadata.grade_migrated_v1`
 * before running. Setting this flag is the last step; if the
 * migration partially fails the user retries on next sign-in.
 *
 * Caller: SupabaseProvider invokes `maybeRunFirstSignInMigration()`
 * when the auth state flips to a signed-in user. Errors are logged
 * but never thrown into the React tree — a failed migration just
 * leaves the user starting fresh in the cloud, with their local
 * data still intact for manual recovery.
 */

import type { SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import { LocalStorageStudioStorage } from "./local-adapter";
import { SupabaseStudioStorage } from "./supabase-adapter";
import { LOCAL_USER_ID } from "@/lib/studio-users";
import type { Project, ProjectSnapshot } from "./types";

const MIGRATION_FLAG = "grade_migrated_v1";

export interface MigrationResult {
  status: "skipped" | "nothing-to-migrate" | "migrated" | "failed";
  projectsCopied: number;
  error?: string;
}

export async function maybeRunFirstSignInMigration(
  supabase: SupabaseClient,
  user: SupabaseUser,
): Promise<MigrationResult> {
  // Already migrated? Bail.
  if (user.user_metadata?.[MIGRATION_FLAG]) {
    return { status: "skipped", projectsCopied: 0 };
  }

  const local = new LocalStorageStudioStorage();
  const projects = await local.listProjects();
  if (projects.length === 0) {
    // Nothing to migrate — set the flag so we never check again on
    // this account.
    await markMigrated(supabase);
    return { status: "nothing-to-migrate", projectsCopied: 0 };
  }

  const cloud = new SupabaseStudioStorage(supabase);
  let copied = 0;

  try {
    for (const meta of projects) {
      const snapshot = await local.loadProject(meta.id);
      if (!snapshot) continue;
      await copyProjectToCloud(cloud, snapshot, user.id);
      copied++;
    }
    await markMigrated(supabase);
    return { status: "migrated", projectsCopied: copied };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn("[studio-storage] first-sign-in migration failed:", message);
    return { status: "failed", projectsCopied: copied, error: message };
  }
}

/** Rewrite the seed LOCAL_USER_ID references onto the real Supabase
 *  user id, then create the project in the cloud and save its full
 *  snapshot. Teams owned by the local user are NOT migrated in v1
 *  — they'd need org_id which the cloud schema enforces. For v1,
 *  projects come across as user-owned (the personal-team semantics
 *  collapse into single-user ownership). Multi-user teams will need
 *  a richer first-sign-in flow (org-creation, team-naming) that the
 *  next phase introduces. */
async function copyProjectToCloud(
  cloud: SupabaseStudioStorage,
  snapshot: ProjectSnapshot,
  cloudUserId: string,
): Promise<void> {
  const cloudProject = await cloud.createProject({
    name: snapshot.project.name,
    description: snapshot.project.description,
  });

  // Rebuild a snapshot keyed against the new cloud project id +
  // owner. The local snapshot's design/message/note ids are
  // preserved — no need to mint new ones.
  const cloudSnapshot: ProjectSnapshot = {
    project: {
      ...cloudProject,
      owner: { type: "user", id: cloudUserId },
      access: rewriteAccessSubjects(snapshot.project.access, cloudUserId),
    },
    designs: snapshot.designs,
    activeDesignId: snapshot.activeDesignId,
    messagesByDesign: snapshot.messagesByDesign,
    notesByDesign: snapshot.notesByDesign,
    themeDraftJson: snapshot.themeDraftJson,
  };

  await cloud.saveProject(cloudSnapshot);
}

function rewriteAccessSubjects(
  access: Project["access"],
  cloudUserId: string,
): Project["access"] {
  return access
    .map((a) => {
      if (a.subject.type === "user" && a.subject.id === LOCAL_USER_ID) {
        return { ...a, subject: { type: "user" as const, id: cloudUserId } };
      }
      return a;
    })
    // Team-typed access can't survive the v1 migration (we don't
    // create teams in the cloud yet) — drop those silently rather
    // than emit a dangling team id.
    .filter((a) => a.subject.type === "user");
}

async function markMigrated(supabase: SupabaseClient): Promise<void> {
  await supabase.auth.updateUser({
    data: { [MIGRATION_FLAG]: true, [`${MIGRATION_FLAG}_at`]: Date.now() },
  });
}
