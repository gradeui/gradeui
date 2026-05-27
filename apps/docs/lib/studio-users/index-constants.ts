/**
 * Stable id constants for the local/seed entities — split out into
 * their own file so the React session provider (session.tsx) can
 * import them without forming a cycle through `./index.ts`.
 *
 * Consumers should keep importing from `@/lib/studio-users`, which
 * re-exports these alongside the rest of the surface.
 */

/** Stable id for the local "you" user. Backfilled onto pre-Users
 *  data by the storage migration; new local-only flows reference
 *  it directly. Real auth will map this id over to whatever the
 *  provider assigns. */
export const LOCAL_USER_ID = "u-local";

/** Stable id for the local "Personal" team — every local user
 *  starts with one team-of-one that owns their first projects. */
export const LOCAL_TEAM_ID = "t-personal";

/** Stable id for the local "Default" organisation — the top-level
 *  container the local user owns. */
export const LOCAL_ORG_ID = "o-default";
