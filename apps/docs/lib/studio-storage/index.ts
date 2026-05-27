/**
 * Studio storage — public entry point.
 *
 * Exports the `StudioStorage` interface for types, and a singleton
 * `getStudioStorage()` factory that today returns the LocalStorage
 * adapter. When we wire Supabase, the factory checks for a session
 * cookie / signed-in user and returns the Supabase adapter instead —
 * the page stays unchanged.
 */

import { LocalStorageStudioStorage } from "./local-adapter";
import type { StudioStorage } from "./types";

export type {
  Membership,
  OrgMembership,
  Organisation,
  Project,
  ProjectSnapshot,
  StudioStorage,
  Subject,
  Team,
  User,
} from "./types";

let cached: StudioStorage | null = null;

export function getStudioStorage(): StudioStorage {
  if (!cached) cached = new LocalStorageStudioStorage();
  return cached;
}
