/**
 * Transport-agnostic Grade tool registrations.
 *
 * Every MCP tool + the MCP App view resource is registered here against a
 * plain `McpServer`, with zero knowledge of the transport. The stdio
 * entrypoint (index.ts) and any future HTTP route (e.g. a Next.js/Vercel
 * MCP handler) call `registerGradeTools` with their own server instance,
 * Supabase client, env, and options.
 *
 * `enablePreview` exists because preview_screen shells out to Playwright —
 * fine on a workstation, unavailable on most serverless runtimes.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createScreenContext,
  validateAgainstContract,
  formatViolations,
} from "@gradeui/studio/core";
import { COMPONENT_CONTRACTS } from "@gradeui/ui/contracts";
import type { McpEnv } from "./supabase";
import {
  listProjects,
  createProject,
  assertProject,
  getScreen,
  listScreens,
  saveScreen,
} from "./designs";
import {
  ensureShareLink,
  embedUrl,
  screenshotEmbed,
  savePreviewPng,
  uploadPreviewPng,
} from "./preview";
import {
  PREVIEW_RESOURCE_URI,
  PREVIEW_TEMPLATE_HTML,
} from "./ui-template";

export interface GradeToolsOptions {
  siteUrl: string;
  /**
   * preview_screen capture engine:
   * - "playwright" (default) — full Playwright, local workstation; PNG
   *   saved to apps/mcp-server/previews/ for the host to present.
   * - "serverless" — playwright-core + @sparticuz/chromium (Vercel/Lambda);
   *   PNG uploaded to Supabase Storage, public URL returned.
   * - "none" — tool not registered.
   */
  capture?: "playwright" | "serverless" | "none";
}

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

export function registerGradeTools(
  server: McpServer,
  sb: SupabaseClient,
  env: McpEnv,
  opts: GradeToolsOptions,
): void {
  // ── MCP App view (SEP-1865) ──────────────────────────────────────────
  // One static template, registered once — hosts may prefetch/cache it,
  // so it carries no per-call data. preview_screen links to it via
  // _meta.ui.resourceUri; the screenshot travels in structuredContent.
  // Hosts without Apps support ignore all of this and fall back to the
  // plain content[]. NOTE: as of June 2026 Claude hosts don't render
  // third-party MCP Apps (anthropics/claude-ai-mcp#165, #236) — this is
  // forward wiring; verify with apps/mcp-server/view-harness.html.
  server.registerResource(
    "gradeui-preview-view",
    PREVIEW_RESOURCE_URI,
    {
      description: "Inline preview panel for Grade screens (MCP App view)",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: PREVIEW_RESOURCE_URI,
          mimeType: "text/html;profile=mcp-app",
          text: PREVIEW_TEMPLATE_HTML,
          // img-src data: is covered by the spec's default CSP; the
          // frameDomains declaration is for the view's "Live" toggle, which
          // nests the real gradeui.com/e/<token> embed. The view hides that
          // toggle on desktop hosts (hostInfo sniff) since Claude Desktop
          // disallows nested iframes — browser hosts get the live screen.
          _meta: {
            ui: {
              csp: { frameDomains: ["https://gradeui.com"] },
              prefersBorder: false,
            },
          },
        },
      ],
    }),
  );

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

  // ── list_screens ─────────────────────────────────────────────────────
  server.registerTool(
    "list_screens",
    {
      title: "List a project's screens",
      description:
        "List the live screens in a project (id, name, position) so you can pick one to get_screen / save_screen / preview_screen.",
      inputSchema: {
        projectId: z.string().describe("Project id (from list_projects)"),
      },
    },
    async ({ projectId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      const screens = await listScreens(sb, projectId);
      if (screens.length === 0) {
        return text(
          `Project ${projectId} has no screens yet. Use create_screen → save_screen to add one.`,
        );
      }
      const lines = screens.map(
        (s) => `${s.position}. ${s.name} — id: ${s.id}`,
      );
      return text(`Screens in project ${projectId}:\n${lines.join("\n")}`);
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
  const captureMode = opts.capture ?? "playwright";
  if (captureMode !== "none") {
    server.registerTool(
      "preview_screen",
      {
        title: "Preview a Grade screen (real render)",
        description:
          "Render a saved screen through the live embed route (gradeui.com/e/<token>) and return an actual screenshot PNG plus the embed URL. Use after save_screen to SEE the real render and iterate. Mints a read-only share link for the screen if none exists. In hosts that support MCP Apps, also renders an inline preview panel with a live-embed toggle.",
        _meta: {
          ui: { resourceUri: PREVIEW_RESOURCE_URI },
        },
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
        const url = embedUrl(opts.siteUrl, share.token, w);
        const shot =
          captureMode === "serverless"
            ? await (
                await import("./preview-serverless")
              ).screenshotEmbedServerless(url, w, h)
            : await screenshotEmbed(url, w, h);
        // MCP Apps capability gate (SEP-1865). structuredContent carries the
        // multi-MB data-URI for the app iframe — but hosts WITHOUT apps
        // support may dump structuredContent into the visible tool result,
        // flooding the model's context (observed in Cowork, June 2026: the
        // base64 blob blew the host's 25k-token result cap). Only attach it
        // when the client negotiated the ui extension.
        const clientCaps = server.server.getClientCapabilities() as
          | { extensions?: Record<string, unknown> }
          | undefined;
        // ALSO sniff clientInfo: some hosts advertise the ui extension but
        // never render third-party panels — they dump structuredContent into
        // the visible result instead (observed twice in Cowork, June 2026,
        // after the capability gate landed; Desktop has the same panel gap,
        // anthropics/claude-ai-mcp#165/#236). Blocklist the known offenders.
        const clientName = server.server.getClientVersion()?.name ?? "";
        const knownNonRenderer = /cowork|desktop|claude[ _-]?code/i.test(
          clientName,
        );
        const uiSupported =
          Boolean(clientCaps?.extensions?.["io.modelcontextprotocol/ui"]) &&
          !knownNonRenderer;

        // Persist alongside the image content — hosts differ in whether they
        // show MCP images to the human, but every host's agent can open,
        // present, or link a file path or URL. Local → a PNG on disk;
        // serverless → Supabase Storage (a hosted MCP has no reachable
        // disk). Best-effort: a failed write must not sink a successful
        // screenshot.
        let savedPath: string | null = null;
        let savedUrl: string | null = null;
        try {
          if (captureMode === "serverless") {
            savedUrl = await uploadPreviewPng(
              sb,
              screen.name,
              screenId,
              shot.base64,
            );
          } else {
            savedPath = await savePreviewPng(
              screen.name,
              screenId,
              shot.base64,
            );
          }
        } catch (err) {
          console.error(
            "gradeui-mcp: preview persist failed:",
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
                (savedUrl ? `Preview PNG URL (public): ${savedUrl}\n` : "") +
                `Embed URL (read-only${share.created ? ", newly minted" : ""}): ${url}\n` +
                `This is the REAL render — same route any embed uses. If the host rendered an inline preview panel (MCP App), the human can already see it; otherwise SHOW THE HUMAN the render: present/attach the saved PNG file, or give them the preview PNG URL and the embed URL as clickable links. Iterate with get_screen → save_screen, then preview again.`,
            },
          ],
          // Forwarded verbatim to the app iframe (ui/notifications/tool-result)
          // and NOT added to model context in apps-capable hosts — the
          // data-URI is token-free there. Omitted entirely elsewhere (see
          // capability gate above).
          ...(uiSupported
            ? {
                structuredContent: {
                  name: screen.name,
                  screenId,
                  width: w,
                  height: h,
                  embedUrl: url,
                  previewUrl: savedUrl ?? undefined,
                  imageDataUri: `data:image/png;base64,${shot.base64}`,
                },
              }
            : {}),
        };
      },
    );
  }
}
