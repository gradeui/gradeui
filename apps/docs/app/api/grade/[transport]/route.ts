/**
 * gradeui-mcp over Streamable HTTP — the hosted twin of the local stdio
 * server (apps/mcp-server). Same `registerGradeTools`, different transport:
 * Vercel's `mcp-handler` mounts an MCP endpoint inside this Next.js app, so
 * the MCP lives at gradeui.com alongside the site whose database it writes
 * to. Register it on claude.ai (Settings → Connectors → Add custom
 * connector) and it works from web, iPhone, iPad — reasoning stays on the
 * subscription; this server makes zero model calls.
 *
 *   Endpoint:  POST https://gradeui.com/api/grade/mcp?key=<GRADE_MCP_KEY>
 *
 * AUTH (v1, single user): a capability URL. The service-role key sits
 * behind this route, so it must never be reachable unauthenticated. Until
 * real OAuth lands (mcp-handler's withMcpAuth — see ROADMAP), the secret
 * rides the connector URL itself as ?key=…, with header fallbacks
 * (x-grade-key / Authorization: Bearer) for hosts that strip query strings.
 * Wrong/missing key → 404, indistinguishable from no route. Rotate by
 * changing GRADE_MCP_KEY in Vercel env.
 *
 * PREVIEW: capture: "serverless" — playwright-core + @sparticuz/chromium
 * (self-extracting Chromium for serverless; see
 * apps/mcp-server/src/preview-serverless.ts, incl. the version-lockstep
 * note). The PNG is uploaded to Supabase Storage (public bucket
 * "screen-previews") and its URL returned alongside the MCP image content,
 * so the human gets a viewable link on any host. Cold call ≈ 4–10s, within
 * maxDuration 60.
 *
 * ENV (Vercel project settings):
 *   NEXT_PUBLIC_SUPABASE_URL   — already set (readEnv falls back to it)
 *   SUPABASE_SERVICE_ROLE_KEY  — already set (the /e route uses it)
 *   GRADE_OWNER_USER_ID        — NEW: who owns what this server writes
 *   GRADE_MCP_KEY              — NEW: the capability-URL secret
 */

import { createMcpHandler } from "mcp-handler";
import { registerGradeTools } from "@gradeui/mcp-server/tools";
import { createServiceClient, readEnv } from "@gradeui/mcp-server/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL =
  process.env.GRADE_MCP_SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://gradeui.com";

const handler = createMcpHandler(
  (server) => {
    // Inside the init fn (per-connection), not module scope: a missing env
    // var should fail the MCP request with a readable error, not the build.
    const env = readEnv();
    const sb = createServiceClient(env);
    registerGradeTools(server, sb, env, {
      siteUrl: SITE_URL,
      capture: "serverless",
    });
  },
  {},
  {
    basePath: "/api/grade", // must match this file's directory
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

/** Constant-time-ish comparison — avoids the classic early-exit timing
 *  leak without pulling in node:crypto (lengths still leak; acceptable for
 *  a high-entropy capability secret). */
function keysMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function withKey(
  h: (req: Request) => Promise<Response> | Response,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const secret = process.env.GRADE_MCP_KEY;
    if (!secret) {
      // Unset secret = endpoint OFF. Never fall open: the service-role key
      // is behind this route.
      return new Response("Not found", { status: 404 });
    }
    const url = new URL(req.url);
    const bearer = req.headers.get("authorization");
    const provided =
      url.searchParams.get("key") ??
      req.headers.get("x-grade-key") ??
      (bearer ? bearer.replace(/^Bearer\s+/i, "") : "");
    if (!provided || !keysMatch(provided, secret)) {
      return new Response("Not found", { status: 404 });
    }
    return h(req);
  };
}

const guarded = withKey(handler);

export { guarded as GET, guarded as POST, guarded as DELETE };
