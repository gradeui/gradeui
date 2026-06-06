/**
 * gradeui-mcp — a stdio MCP server that lets any MCP host (Claude Desktop,
 * Claude Code) design Grade screens on YOUR subscription and save them into
 * a Supabase project, where they show up in Studio.
 *
 * It's the "MCP server adapter" from grade-local-testing-and-eval.md: a thin
 * transport shell over the shared core. The contract logic lives once —
 *   - createScreenContext  → the per-request payload (rules + component refs)
 *   - validateAgainstContract → the conformance gate before a save lands
 * — and this file only does transport + Supabase side-effects.
 *
 * The reasoning happens on the host's subscription; this server makes ZERO
 * model calls. The eval ladder (tsc/lint/walker/Playwright) runs separately
 * and for free against the JSX this saves.
 *
 * Tools:
 *   list_projects   — your projects (id + name) to target
 *   create_project  — make a new one
 *   create_screen   — get the Grade context to author a screen from a brief
 *   get_screen      — fetch a screen's current JSX (+ refs) to iterate on
 *   save_screen     — validate, then write the JSX into the project
 *
 * The generate→save split is inherent to MCP: the host's model writes the
 * JSX BETWEEN the create_screen and save_screen calls.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createScreenContext,
  validateAgainstContract,
  formatViolations,
} from "@gradeui/studio/core";
import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
import { readEnv, createServiceClient } from "./supabase.js";
import {
  listProjects,
  createProject,
  assertProject,
  getScreen,
  listScreens,
  saveScreen,
} from "./designs.js";
import {
  ensureShareLink,
  embedUrl,
  screenshotEmbed,
  savePreviewPng,
} from "./preview.js";

/** Where the live site (and its /e/<token> embed route) is served from.
 *  Override with GRADE_SITE_URL for local dev (http://localhost:3000). */
const SITE_URL = process.env.GRADE_SITE_URL ?? "https://gradeui.com";

/** Wrap a string into the MCP text-content envelope. */
function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}
function errorText(s: string) {
  return { isError: true, content: [{ type: "text" as const, text: s }] };
}

/**
 * Tool-result payload budget, in characters (~7k tokens). MCP hosts cap
 * tool-result size; a brief that alias-matches many fat refs can push the
 * full context past it (observed: 64k chars → host error). When the full
 * payload exceeds this, rebuild with compact refs — API lines survive
 * (that's the contract surface the validator enforces), worked examples
 * drop, and the save gate + retry loop covers the idiom misses.
 */
const PAYLOAD_BUDGET_CHARS = 28_000;

/** Build a screen context that fits the budget: full refs when they fit,
 *  compact when they don't. Returns the style used so the tool result can
 *  say which fidelity the host got. */
function budgetedContext(brief: string, pin?: readonly string[]) {
  const full = createScreenContext(brief, { pin });
  if (full.system.length <= PAYLOAD_BUDGET_CHARS) {
    return { ...full, style: "full" as const };
  }
  const compact = createScreenContext(brief, { pin, refsStyle: "compact" });
  return { ...compact, style: "compact" as const };
}

async function main() {
  const env = readEnv();
  const sb = createServiceClient(env);

  const server = new McpServer({
    name: "gradeui-screens",
    version: "0.1.0",
  });

  // ── list_projects ────────────────────────────────────────────────────
  server.registerTool(
    "list_projects",
    {
      title: "List Grade projects",
      description:
        "List your Grade projects (id + name) so you can pick one to save a screen into. Use the id with create_screen / save_screen / get_screen.",
      inputSchema: {},
    },
    async () => {
      const projects = await listProjects(sb, env.ownerUserId);
      if (projects.length === 0) {
        return text("No projects yet. Use create_project to make one.");
      }
      const lines = projects.map(
        (p) => `- ${p.name} — id: ${p.id}`,
      );
      return text(`Your Grade projects:\n${lines.join("\n")}`);
    },
  );

  // ── create_project ───────────────────────────────────────────────────
  server.registerTool(
    "create_project",
    {
      title: "Create a Grade project",
      description:
        "Create a new, empty Grade project owned by you. Returns the new project id to save screens into.",
      inputSchema: { name: z.string().min(1).describe("Project name") },
    },
    async ({ name }) => {
      const p = await createProject(sb, env.ownerUserId, name);
      return text(`Created project "${p.name}".\nproject id: ${p.id}`);
    },
  );

  // ── create_screen ────────────────────────────────────────────────────
  server.registerTool(
    "create_screen",
    {
      title: "Start a Grade screen",
      description:
        "Get the Grade Design System context for a NEW screen from a brief. Returns the rules + the relevant component reference block. After you write the screen as a single self-contained React component named `App` (export default), call save_screen with the JSX and this projectId.",
      inputSchema: {
        projectId: z
          .string()
          .describe("Target project id (from list_projects)"),
        brief: z
          .string()
          .describe("What the screen should be, in natural language"),
      },
    },
    async ({ projectId, brief }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      const { system, refs, style } = budgetedContext(brief);
      const body = [
        `Target project: ${projectId}`,
        `Component refs in scope (${style}): ${refs.join(", ") || "(none matched)"}`,
        "",
        "Write the screen as ONE self-contained React component named `App` with `export default`, following the Grade rules below. Then call `save_screen` with { projectId, name, jsx } where `jsx` is the full component source.",
        "",
        "─── GRADE SCREEN CONTEXT ───",
        system,
      ].join("\n");
      return text(body);
    },
  );

  // ── get_screen ───────────────────────────────────────────────────────
  server.registerTool(
    "get_screen",
    {
      title: "Get a Grade screen to edit",
      description:
        "Fetch a screen's current JSX source plus the Grade component refs implied by that source, so you can iterate on it. Describe the change in words (there is no browser selection over MCP), edit the JSX, then call save_screen with the SAME screenId.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        screenId: z
          .string()
          .describe("Screen (design) id — list it via the project in Studio or after a save"),
      },
    },
    async ({ projectId, screenId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      const screen = await getScreen(sb, projectId, screenId);
      if (!screen) {
        const screens = await listScreens(sb, projectId);
        const hint = screens.length
          ? `Screens in this project:\n${screens
              .map((s) => `- ${s.name} — id: ${s.id}`)
              .join("\n")}`
          : "This project has no screens yet.";
        return errorText(
          `No screen "${screenId}" in project ${projectId}.\n${hint}`,
        );
      }
      const appSource = screen.state?.appSource ?? "";
      // Derive refs from the CURRENT source so the edit context surfaces the
      // components the screen actually uses.
      const { system, refs, style } = budgetedContext(appSource);
      const body = [
        `Screen: "${screen.name}" — id: ${screen.id} (position ${screen.position})`,
        `Component refs in scope (${style}): ${refs.join(", ") || "(none matched)"}`,
        "",
        "Current source (raw JSX):",
        "```jsx",
        appSource,
        "```",
        "",
        "Edit this JSX per the user's request, then call `save_screen` with { projectId, screenId, jsx } (same screenId) to update it in place. Grade rules below.",
        "",
        "─── GRADE SCREEN CONTEXT ───",
        system,
      ].join("\n");
      return text(body);
    },
  );

  // ── save_screen ──────────────────────────────────────────────────────
  server.registerTool(
    "save_screen",
    {
      title: "Save a Grade screen",
      description:
        "Validate JSX against the Grade component contracts, then write it into the project. Omit screenId to create a new screen; pass it to update an existing one. If validation finds errors the screen is NOT saved — fix the JSX and call again.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        jsx: z
          .string()
          .describe("Full screen source — a single `App` component (export default)"),
        name: z
          .string()
          .optional()
          .describe("Screen name (defaults to existing on update, else 'Untitled')"),
        screenId: z
          .string()
          .optional()
          .describe("Existing screen id to update in place; omit to create new"),
        makeActive: z
          .boolean()
          .optional()
          .describe("Make this the project's active screen (default true)"),
      },
    },
    async ({ projectId, jsx, name, screenId, makeActive }) => {
      await assertProject(sb, env.ownerUserId, projectId);

      // Conformance gate — the deterministic seed of the eval ladder. Block
      // on error-severity violations so broken screens never land; warnings
      // and info pass through (logged in the success note).
      const report = validateAgainstContract(jsx, {
        contracts: COMPONENT_CONTRACTS,
      });
      const errors = report.violations.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        return errorText(
          `Not saved — ${errors.length} contract violation(s). Fix the JSX and call save_screen again:\n\n${formatViolations(
            report,
          )}`,
        );
      }

      const result = await saveScreen(sb, {
        projectId,
        screenId,
        name,
        jsx,
        makeActive,
      });

      const warnCount = report.violations.length;
      const warnNote =
        warnCount > 0
          ? `\n(${warnCount} non-blocking note(s): ${formatViolations(report)})`
          : "";
      return text(
        `Saved "${name ?? result.id}" — id: ${result.id} (position ${result.position}, ${
          result.created ? "new screen" : "updated"
        }) in project ${projectId}. Open it in Studio to see it render.${warnNote}`,
      );
    },
  );

  // ── preview_screen ───────────────────────────────────────────────────
  server.registerTool(
    "preview_screen",
    {
      title: "Preview a Grade screen (real render)",
      description:
        "Render a saved screen through the live embed route (gradeui.com/e/<token>) and return an actual screenshot PNG plus the embed URL. Use after save_screen to SEE the real render and iterate. Mints a read-only share link for the screen if none exists.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        screenId: z.string().describe("Screen (design) id, e.g. from save_screen"),
        width: z
          .number()
          .optional()
          .describe("Virtual render width in px (default 1280)"),
        height: z
          .number()
          .optional()
          .describe("Viewport height in px (default 800)"),
        colorMode: z
          .enum(["light", "dark"])
          .optional()
          .describe("Theme mode for a newly-minted share link (default dark)"),
      },
    },
    async ({ projectId, screenId, width, height, colorMode }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      const screen = await getScreen(sb, projectId, screenId);
      if (!screen) {
        return errorText(
          `No screen "${screenId}" in project ${projectId}. Save it first, or check list via get_screen.`,
        );
      }
      const w = Math.min(Math.max(width ?? 1280, 320), 2560);
      const h = Math.min(Math.max(height ?? 800, 320), 2560);
      const share = await ensureShareLink(
        sb,
        projectId,
        screenId,
        colorMode ?? "dark",
      );
      const url = embedUrl(SITE_URL, share.token, w);
      const shot = await screenshotEmbed(url, w, h);
      // Persist alongside the image content — hosts differ in whether they
      // show MCP images to the human, but every host's agent can open,
      // present, or link a file path. Best-effort: a failed write must not
      // sink a successful screenshot.
      let savedPath: string | null = null;
      try {
        savedPath = await savePreviewPng(screen.name, screenId, shot.base64);
      } catch (err) {
        console.error(
          "gradeui-mcp: preview file write failed:",
          err instanceof Error ? err.message : err,
        );
      }
      return {
        content: [
          {
            type: "image" as const,
            data: shot.base64,
            mimeType: "image/png",
          },
          {
            type: "text" as const,
            text:
              `Live render of "${screen.name}" (${screenId}) at ${w}×${h}.\n` +
              (savedPath ? `Saved PNG: ${savedPath}\n` : "") +
              `Embed URL (read-only${share.created ? ", newly minted" : ""}): ${url}\n` +
              `This is the REAL render — same route any embed uses. SHOW THE HUMAN the saved PNG (present/attach the file) — image tool-results may be visible only to you. Iterate with get_screen → save_screen, then preview again.`,
          },
        ],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the protocol channel — diagnostics go to stderr only.
  console.error("gradeui-mcp: connected over stdio.");
}

main().catch((err) => {
  console.error("gradeui-mcp fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
