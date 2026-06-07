/**
 * gradeui-mcp — a stdio MCP server that lets any MCP host (Claude Desktop,
 * Claude Code) design Grade screens on YOUR subscription and save them into
 * a Supabase project, where they show up in Studio.
 *
 * It's the "MCP server adapter" from grade-local-testing-and-eval.md: a thin
 * transport shell over the shared core. The contract logic lives once —
 *   - createScreenContext  → the per-request payload (rules + component refs)
 *   - validateAgainstContract → the conformance gate before a save lands
 * — and this file only does transport + wiring.
 *
 * The reasoning happens on the host's subscription; this server makes ZERO
 * model calls. The eval ladder (tsc/lint/walker/Playwright) runs separately
 * and for free against the JSX this saves.
 *
 * The tool registrations themselves live in ./tools.ts
 * (registerGradeTools) so they're transport-agnostic — a future
 * Next.js/Vercel HTTP route can register the same tools against its own
 * server instance. This file is only the stdio entrypoint.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readEnv, createServiceClient, envFlag } from "./supabase";
import { registerGradeTools } from "./tools";

async function main() {
  const env = readEnv();
  const sb = createServiceClient(env);

  /** Where the live site (and its /e/<token> embed route) is served from.
   *  Override with GRADE_SITE_URL for local dev (http://localhost:3000). */
  const SITE_URL = process.env.GRADE_SITE_URL ?? "https://gradeui.com";

  // "gradeui-mcp", not "gradeui-screens" — the server's remit is the whole
  // design system (screens today; docs/search tools, themes, variations
  // next), so the name shouldn't paint us into a corner.
  // icons/websiteUrl (MCP spec 2025-11-25): hosts that support server
  // icons show the Grade mark instead of a letter avatar. Same asset as
  // the site favicon (apps/docs/app/icon.svg → gradeui.com/icon.svg).
  // Widened via a variable: older Implementation typings may not know
  // `icons`, and width-subtyping skips excess-property checks.
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
  const server = new McpServer(serverInfo);

  registerGradeTools(server, sb, env, {
    siteUrl: SITE_URL,
    // Panel opt-in (see GradeToolsOptions.appPanel — attaching it
    // suppresses hosts' normal image-in-chat display).
    appPanel: envFlag(process.env.GRADE_MCP_APPS),
  });

  // Client sniffing — log who connected and what they negotiated, so host
  // experiments (e.g. toggling desktop permissions for MCP Apps) are
  // diagnosable from the MCP logs. The structuredContent gate keys off the
  // CAPABILITY (extensions["io.modelcontextprotocol/ui"]); clientInfo is
  // the per-host fingerprint if we ever need quirk handling beyond that.
  server.server.oninitialized = () => {
    const info = server.server.getClientVersion();
    const caps = server.server.getClientCapabilities() as
      | { extensions?: Record<string, unknown> }
      | undefined;
    const apps = Boolean(caps?.extensions?.["io.modelcontextprotocol/ui"]);
    console.error(
      `gradeui-mcp: client=${info?.name ?? "unknown"} v${info?.version ?? "?"} | MCP Apps capability: ${apps ? "YES" : "no"}`,
    );
  };

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the protocol channel — diagnostics go to stderr only.
  console.error("gradeui-mcp: connected over stdio.");
}

main().catch((err) => {
  console.error("gradeui-mcp fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
