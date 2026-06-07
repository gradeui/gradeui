/**
 * Service-role Supabase client for the MCP server.
 *
 * A headless stdio MCP can't carry a signed-in user session, so it writes
 * with the SERVICE-ROLE key, which bypasses RLS. Visibility on the site is
 * then handed back to RLS via ownership: every project this server creates
 * is owned by `GRADE_OWNER_USER_ID`, so when you open gradeui.com signed in
 * as that user, `user_can_read_project()` resolves true and the screens
 * render. (See CLAUDE.md "Screen persistence" + the 0008 RLS migration.)
 *
 * The service-role key is read from the MCP process env and never leaves
 * the machine running the server.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface McpEnv {
  url: string;
  serviceRoleKey: string;
  /** UUID of the Supabase auth user who should own (and therefore see)
   *  everything this server writes. */
  ownerUserId: string;
}

/**
 * Read + validate the three required env vars. Throws a single, actionable
 * error listing everything missing — better than failing deep in a tool
 * call with an opaque Supabase error.
 */
export function readEnv(): McpEnv {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const ownerUserId = process.env.GRADE_OWNER_USER_ID ?? "";

  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!ownerUserId) missing.push("GRADE_OWNER_USER_ID");
  if (missing.length > 0) {
    throw new Error(
      `gradeui-mcp: missing required env var(s): ${missing.join(", ")}. ` +
        `Set them in the MCP host config (see apps/mcp-server/README.md).`,
    );
  }

  return { url, serviceRoleKey, ownerUserId };
}

/** Lenient boolean env parse — "1", "true", "yes", "on" (any case,
 *  surrounding whitespace tolerated). Strict `=== "1"` checks have already
 *  cost one debugging session. */
export function envFlag(value: string | undefined): boolean {
  return /^\s*(1|true|yes|on)\s*$/i.test(value ?? "");
}

export function createServiceClient(env: McpEnv): SupabaseClient {
  return createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
