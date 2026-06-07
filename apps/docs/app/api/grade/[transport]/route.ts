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
import {
  createServiceClient,
  envFlag,
  readEnv,
} from "@gradeui/mcp-server/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const SITE_URL =
  process.env.GRADE_MCP_SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://gradeui.com";

// icons/websiteUrl (MCP spec 2025-11-25): hosts that support server icons
// show the Grade mark instead of a letter avatar. Same asset as the site
// favicon (app/icon.svg → gradeui.com/icon.svg). Widened via a variable:
// mcp-handler types serverInfo as {name, version} only, and width-subtyping
// skips excess-property checks — the extra fields ride through to the SDK.
const serverInfo = {
  name: "gradeui-mcp",
  title: "GradeUI",
  version: "0.1.0",
  websiteUrl: "https://gradeui.com",
  icons: [
    {
      src: "https://gradeui.com/icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
  ],
};

// Two handlers, one server: hosts differ in what they can DISPLAY. A tool
// that carries panel metadata suppresses the host's normal image-in-chat
// rendering — great on hosts that render panels (claude.ai web), a dead
// loss on hosts that don't render REMOTE panels (Claude Desktop, mobile
// apps). So the panel becomes a per-connector choice via the URL:
//   ...?key=<secret>            → panel (default per GRADE_MCP_APPS env)
//   ...?key=<secret>&panel=0    → plain results: image renders in chat
//   ...?key=<secret>&panel=1    → force panel on
// Desktop/phone register the &panel=0 URL as a second connector.
const makeHandler = (appPanel: boolean) =>
  createMcpHandler(
    (server) => {
      // Inside the init fn (per-connection), not module scope: a missing
      // env var should fail the MCP request with a readable error, not the
      // build.
      const env = readEnv();
      const sb = createServiceClient(env);
      registerGradeTools(server, sb, env, {
        siteUrl: SITE_URL,
        // @sparticuz/chromium is a Linux binary — right for Vercel, dead
        // on a Mac. When running this route locally (`pnpm dev`), set
        // GRADE_MCP_CAPTURE=playwright in apps/docs/.env.local to use the
        // repo's full Playwright instead.
        capture:
          (process.env.GRADE_MCP_CAPTURE as
            | "playwright"
            | "serverless"
            | "none"
            | undefined) ?? "serverless",
        appPanel,
      });
    },
    { serverInfo },
    {
      basePath: "/api/grade", // must match this file's directory
      maxDuration: 60,
      verboseLogs: process.env.NODE_ENV !== "production",
    },
  );

const panelHandler = makeHandler(true);
const plainHandler = makeHandler(false);

function pickHandler(req: Request) {
  const panelParam = new URL(req.url).searchParams.get("panel");
  const appPanel =
    panelParam === null
      ? envFlag(process.env.GRADE_MCP_APPS)
      : envFlag(panelParam);
  return appPanel ? panelHandler : plainHandler;
}

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

const guarded = withKey((req) => pickHandler(req)(req));

export { guarded as GET, guarded as POST, guarded as DELETE };
