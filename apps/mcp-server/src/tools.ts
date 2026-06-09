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
import {
  ALLOWED_COMPONENTS,
  relevantComponentNames,
  renderComponentRefsBlock,
} from "@gradeui/studio/playbook";
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
  getStoredPreview,
  screenshotEmbed,
  savePreviewPng,
  uploadPreviewPng,
} from "./preview";
import { PREVIEW_VIEW_URI, PREVIEW_VIEW_HTML } from "./preview-view-html";
import {
  INTERACTIVE_DEMO_URI,
  INTERACTIVE_DEMO_HTML,
} from "./interactive-demo";
import { PREVIEW_RESOURCE_URI, buildPreviewTemplate } from "./ui-template";

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
  /**
   * Attach the MCP App panel (SEP-1865) to preview_screen. DEFAULT OFF:
   * as of June 2026, claude.ai web renders 3p panels but feeds them
   * nothing (toast: "There was a problem displaying content"), and
   * attaching a panel SUPPRESSES the host's normal result display — so
   * the plain image content block (which renders in chat exactly like
   * e.g. Mobbin's MCP images) never shows. Enable via GRADE_MCP_APPS=1
   * once hosts forward tool-result/tool-input properly; verify with
   * view-harness.html meanwhile.
   */
  appPanel?: boolean;
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
  if (opts.appPanel)
    server.registerResource(
      "gradeui-preview-view",
      PREVIEW_VIEW_URI,
      {
        description:
          "Inline interactive preview of a Grade screen (MCP App view)",
        mimeType: "text/html;profile=mcp-app",
      },
      async () => ({
        contents: [
          {
            uri: PREVIEW_VIEW_URI,
            mimeType: "text/html;profile=mcp-app",
            // Self-contained single-file bundle (React + the @gradeui/ui
            // vocabulary + sucrase, all inlined) built from the ONE renderer
            // (apps/docs/lib/studio-render-core + apps/docs/preview-view). It
            // compiles the screen's JSX — delivered via tool-result — and
            // renders it DIRECTLY in the host's sandboxed iframe: no nested
            // frame, no runtime network. The spec's default CSP
            // (script-src 'self' 'unsafe-inline'; connect-src 'none') is
            // exactly what an inline single-file bundle needs, so no csp
            // declaration is required.
            text: PREVIEW_VIEW_HTML,
            _meta: {
              ui: {
                // Screens with a <Map> render via the worker-free Leaflet
                // adapter, which fetches CARTO raster basemap tiles (the
                // Google-like look). The sandbox default blocks that
                // (connect-src 'none', img-src 'self' data:), so the tile
                // hosts (a–d.basemaps.cartocdn.com) must be declared or maps
                // come up blank. Everything else stays offline.
                csp: {
                  connectDomains: [
                    "https://a.basemaps.cartocdn.com",
                    "https://b.basemaps.cartocdn.com",
                    "https://c.basemaps.cartocdn.com",
                    "https://d.basemaps.cartocdn.com",
                  ],
                  resourceDomains: [
                    "https://a.basemaps.cartocdn.com",
                    "https://b.basemaps.cartocdn.com",
                    "https://c.basemaps.cartocdn.com",
                    "https://d.basemaps.cartocdn.com",
                  ],
                },
                prefersBorder: false,
              },
            },
          },
        ],
      }),
    );

  // ── preview_image's image panel ─ the proven poster-in-a-panel ─────────
  // Renders the screenshot INLINE as a panel. Hosts like Cowork render
  // MCP App panels but NOT bare image content blocks, so an image-only
  // tool result shows nothing inline there — this panel is how the picture
  // appears. It self-loads the stored poster from tool-input (screenId +
  // colorMode) at the deterministic Supabase path; resourceDomains lets the
  // panel's <img> reach Supabase Storage (default img-src is 'self' data:).
  if (opts.appPanel)
    server.registerResource(
      "gradeui-preview-image",
      PREVIEW_RESOURCE_URI,
      {
        description: "Inline image preview of a Grade screen (poster panel)",
        mimeType: "text/html;profile=mcp-app",
      },
      async () => ({
        contents: [
          {
            uri: PREVIEW_RESOURCE_URI,
            mimeType: "text/html;profile=mcp-app",
            text: buildPreviewTemplate(
              `${env.url}/storage/v1/object/public/screen-previews`,
            ),
            _meta: {
              ui: {
                csp: { resourceDomains: [env.url] },
                prefersBorder: false,
              },
            },
          },
        ],
      }),
    );

  // ── interactive_demo ─ minimal proof that MCP Apps interactivity works ─
  // A dependency-free, self-contained interactive panel (button + text
  // echo). Independent of the Grade renderer: if this renders + responds
  // in a host but the full preview doesn't, the issue is the Grade bundle,
  // not MCP Apps support. Gated on appPanel like the other UI resources.
  if (opts.appPanel) {
    server.registerResource(
      "gradeui-interactive-demo",
      INTERACTIVE_DEMO_URI,
      {
        description: "Minimal interactive MCP App (proof of interactivity)",
        mimeType: "text/html;profile=mcp-app",
      },
      async () => ({
        contents: [
          {
            uri: INTERACTIVE_DEMO_URI,
            mimeType: "text/html;profile=mcp-app",
            text: INTERACTIVE_DEMO_HTML,
          },
        ],
      }),
    );

    server.registerTool(
      "interactive_demo",
      {
        title: "Interactive MCP App check",
        description:
          "Render a tiny interactive UI inline to confirm MCP Apps interactivity works in this host: a click counter + a text echo. No Grade rendering — pure proof of the mechanism. Use this if you want to verify the host supports interactive MCP panels at all.",
        _meta: { ui: { resourceUri: INTERACTIVE_DEMO_URI } },
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: "text" as const,
            text: "Interactive demo: click the button and type in the field. If the panel updates as you do, interactive MCP UI works in this host.",
          },
        ],
      }),
    );
  }

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

  // ── list_components ──────────────────────────────────────────────────
  server.registerTool(
    "list_components",
    {
      title: "List Grade components",
      description:
        'List the Grade Design System components you may use in screen JSX (the Studio allowlist) — the source of truth for what save_screen will accept. Call with NO arguments for the full name list. Pass `query` (a feature, component name, or alias — e.g. "chart", "map listings", "dropdown menu") to get the COMPACT API reference (import, variants, sizes, props, composes_with) for the matching components. Only emit components this tool returns; anything else fails the contract check on save.',
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe(
            'Optional. A feature/component/alias to filter on (e.g. "chart", "map", "dropdown") — returns compact API refs for matches. Omit to list the whole allowlist.',
          ),
      },
    },
    async ({ query }) => {
      const allowedList = [...ALLOWED_COMPONENTS];

      // No query → the full allowlist as a plain name list.
      if (!query || !query.trim()) {
        return text(
          [
            `Grade components you may emit (${allowedList.length}) — the Studio allowlist:`,
            "",
            allowedList.map((n) => `- ${n}`).join("\n"),
            "",
            'Pass `query` (e.g. "chart", "map", "dropdown") to get the compact API reference (props/variants/composition) for specific components.',
          ].join("\n"),
        );
      }

      // Query → retrieval-matched names (the same matcher the generator
      // uses: name + subcomponents + sidecar aliases) UNION direct
      // name-substring hits, all filtered to the allowlist so we never
      // hint at a component the model can't actually emit.
      const q = query.trim().toLowerCase();
      const allowed = new Set(allowedList.map((n) => n.toLowerCase()));
      const refMatched = relevantComponentNames(query).filter((n) =>
        allowed.has(n.toLowerCase()),
      );
      const nameMatched = allowedList.filter((n) =>
        n.toLowerCase().includes(q),
      );
      const matched = Array.from(new Set([...refMatched, ...nameMatched]));

      if (matched.length === 0) {
        return text(
          `No allowlisted components matched "${query}". Call list_components with no arguments to see the full list.`,
        );
      }

      // Compact refs keep the result under the host's size limit; a
      // matched component without an authored sidecar still surfaces by
      // name so the caller knows it's available.
      const block = renderComponentRefsBlock({
        onlyFor: matched,
        style: "compact",
      });
      const header = `Matched ${matched.length} component(s) for "${query}": ${matched.join(", ")}`;
      return text(block ? `${header}\n\n${block}` : header);
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

  // ── preview tools ─────────────────────────────────────────────────────
  const captureMode = opts.capture ?? "playwright";
  if (captureMode !== "none") {
    // Shared capture: stored-poster reuse → live Playwright capture (one
    // retry) → stale-poster fallback; every fresh capture becomes the
    // screen's stored poster. Returns the PNG + the live embed URL +
    // metadata, or an error string. Both preview_image (PNG only) and
    // preview_screen (image + live panel) build their result from this, so
    // the gnarly capture/fallback logic lives in exactly one place.
    const captureScreenShot = async (a: {
      projectId: string;
      screenId: string;
      width?: number;
      height?: number;
      colorMode?: "light" | "dark";
      refresh?: boolean;
    }) => {
      const sls = captureMode === "serverless";
      await assertProject(sb, env.ownerUserId, a.projectId);
      const screen = await getScreen(sb, a.projectId, a.screenId);
      if (!screen) {
        return {
          ok: false as const,
          error: `No screen "${a.screenId}" in project ${a.projectId}. Save it first, or check list via get_screen.`,
        };
      }
      const mode = a.colorMode ?? "light";
      const w = Math.min(Math.max(a.width ?? (sls ? 1024 : 1280), 320), 2560);
      const h = Math.min(Math.max(a.height ?? (sls ? 640 : 800), 320), 2560);
      const share = await ensureShareLink(sb, a.projectId, a.screenId, mode);
      const url = embedUrl(opts.siteUrl, share.token, w);

      const stored = a.refresh
        ? null
        : await getStoredPreview(sb, a.screenId, mode, screen.updatedAt);

      const capture = async () =>
        sls
          ? await (
              await import("./preview-serverless")
            ).screenshotEmbedServerless(url, w, h, mode)
          : await screenshotEmbed(url, w, h, mode);

      let shot = stored ? { base64: stored.base64, width: w, height: h } : null;
      let staleFallback: number | null = null;
      let fallbackUrl: string | null = null;
      let captureErr: unknown = null;
      if (!shot) {
        try {
          shot = await capture();
        } catch {
          try {
            shot = await capture();
          } catch (e) {
            captureErr = e;
          }
        }
        if (!shot) {
          const anyAge = await getStoredPreview(sb, a.screenId, mode, 0);
          if (!anyAge) throw captureErr;
          shot = { base64: anyAge.base64, width: w, height: h };
          staleFallback = anyAge.capturedAt;
          fallbackUrl = anyAge.url;
        }
      }

      let savedPath: string | null = null;
      let savedUrl: string | null = stored?.url ?? fallbackUrl ?? null;
      if (!stored && !staleFallback) {
        try {
          savedUrl = await uploadPreviewPng(sb, a.screenId, mode, shot.base64);
        } catch (err) {
          console.error(
            "gradeui-mcp: poster upload failed:",
            err instanceof Error ? err.message : err,
          );
        }
        if (!sls) {
          try {
            savedPath = await savePreviewPng(screen.name, a.screenId, shot.base64);
          } catch (err) {
            console.error(
              "gradeui-mcp: preview file write failed:",
              err instanceof Error ? err.message : err,
            );
          }
        }
      }

      return {
        ok: true as const,
        screen,
        shot,
        url,
        w,
        h,
        mode,
        savedUrl,
        savedPath,
        staleFallback,
        fromStored: Boolean(stored),
      };
    };

    // ── preview_image ─ just the screenshot, no interactive panel ─────────
    server.registerTool(
      "preview_image",
      {
        title: "Preview a Grade screen as an image",
        description:
          "Render a saved screen (real render via the live embed route) and show the screenshot INLINE as an image panel. Ideal for screens the live renderer can't fully show — e.g. maps, which need network the sandbox blocks. Reuses the stored poster if the screen is unchanged; pass refresh: true to force a fresh capture. For a live, interactive render, use preview_screen.",
        ...(opts.appPanel
          ? { _meta: { ui: { resourceUri: PREVIEW_RESOURCE_URI } } }
          : {}),
        inputSchema: {
          projectId: z.string().describe("Project id"),
          screenId: z
            .string()
            .describe("Screen (design) id, e.g. from save_screen"),
          width: z
            .number()
            .optional()
            .describe("Virtual render width in px (default 1280 local / 1024 hosted)"),
          height: z
            .number()
            .optional()
            .describe("Viewport height in px (default 800 local / 640 hosted)"),
          colorMode: z
            .enum(["light", "dark"])
            .optional()
            .describe("Theme mode (default dark)"),
          refresh: z
            .boolean()
            .optional()
            .describe("Force a fresh capture even if a current poster exists"),
        },
      },
      async ({ projectId, screenId, width, height, colorMode, refresh }) => {
        const r = await captureScreenShot({
          projectId,
          screenId,
          width,
          height,
          colorMode,
          refresh,
        });
        if (!r.ok) return errorText(r.error);
        const headline = r.staleFallback
          ? `"${r.screen.name}" — WARNING: live capture failed; this is the PREVIOUS capture (${r.mode}, ${new Date(r.staleFallback).toISOString()}) and predates the latest save. Retry shortly (refresh: true).`
          : r.fromStored
            ? `"${r.screen.name}" — stored poster (${r.mode}; refresh: true re-renders).`
            : `"${r.screen.name}" — live render, ${r.w}×${r.h} ${r.mode}.`;
        return {
          content: [
            { type: "image" as const, data: r.shot.base64, mimeType: "image/png" },
            {
              type: "text" as const,
              text:
                headline +
                (r.savedPath ? `\nFile: ${r.savedPath}` : "") +
                (r.savedUrl ? `\nPoster: ${r.savedUrl}` : "") +
                `\nLive embed: ${r.url}`,
            },
          ],
        };
      },
    );

    // ── preview_screen ───────────────────────────────────────────────────
    server.registerTool(
      "preview_screen",
      {
        title: "Preview a Grade screen (live, interactive)",
        description:
          "Show a saved screen as a LIVE, interactive render inline. On hosts that support MCP Apps (e.g. claude.ai web) this renders the real screen in an interactive panel; on other hosts it falls back to a screenshot PNG in chat plus the embed URL. Use after save_screen to SEE and interact with the render. Every capture is stored as the screen's poster; an unchanged screen reuses it instantly — pass refresh: true to force a fresh capture. Mints a read-only share link if none exists. For just a still picture, use preview_image.",
        ...(opts.appPanel
          ? { _meta: { ui: { resourceUri: PREVIEW_VIEW_URI } } }
          : {}),
        inputSchema: {
          projectId: z.string().describe("Project id"),
          screenId: z.string().describe("Screen (design) id, e.g. from save_screen"),
          width: z
            .number()
            .optional()
            .describe("Virtual render width in px (default 1280 local / 1024 hosted)"),
          height: z
            .number()
            .optional()
            .describe("Viewport height in px (default 800 local / 640 hosted)"),
          colorMode: z
            .enum(["light", "dark"])
            .optional()
            .describe("Theme mode to render and which poster slot to use (default dark)"),
          refresh: z
            .boolean()
            .optional()
            .describe("Force a fresh capture even if a current poster exists"),
        },
      },
      async ({ projectId, screenId, width, height, colorMode, refresh }) => {
        await assertProject(sb, env.ownerUserId, projectId);
        const screen = await getScreen(sb, projectId, screenId);
        if (!screen) {
          return errorText(
            `No screen "${screenId}" in project ${projectId}. Save it first, or check list via get_screen.`,
          );
        }
        // Serverless runs in a 2GB box — default to a smaller canvas there
        // (lower render + PNG-encode peak). Explicit width/height still wins.
        const serverless = captureMode === "serverless";
        const mode = colorMode ?? "light";
        const w = Math.min(Math.max(width ?? (serverless ? 1024 : 1280), 320), 2560);
        const h = Math.min(Math.max(height ?? (serverless ? 640 : 800), 320), 2560);
        const share = await ensureShareLink(sb, projectId, screenId, mode);
        const url = embedUrl(opts.siteUrl, share.token, w);

        // Poster reuse: if the stored capture postdates the screen's last
        // save, serve it — zero Chromium, instant, and it means a poster
        // captured on the desktop serves hosted/phone previews. refresh:
        // true forces a live render.
        const stored = refresh
          ? null
          : await getStoredPreview(sb, screenId, mode, screen.updatedAt);

        // Live capture with one retry, then DECLARED degradation: the 2GB
        // serverless box intermittently dies mid-pageload
        // (ERR_INSUFFICIENT_RESOURCES). When that happens the app panel has
        // already self-loaded the PREVIOUS poster — so a silent failure
        // here reads to the human as "preview works but is one edit
        // behind". Serving the stale poster while SAYING it's stale keeps
        // the surface honest; throwing only when there's nothing at all.
        const capture = async () =>
          serverless
            ? await (
                await import("./preview-serverless")
              ).screenshotEmbedServerless(url, w, h, mode)
            : await screenshotEmbed(url, w, h, mode);

        let shot = stored
          ? { base64: stored.base64, width: w, height: h }
          : null;
        let staleFallback: number | null = null;
        let fallbackUrl: string | null = null;
        let captureErr: unknown = null;
        if (!shot) {
          try {
            shot = await capture();
          } catch (err1) {
            try {
              shot = await capture();
            } catch (err2) {
              captureErr = err2;
            }
          }
          if (!shot) {
            const anyAge = await getStoredPreview(sb, screenId, mode, 0);
            if (!anyAge) throw captureErr;
            shot = { base64: anyAge.base64, width: w, height: h };
            staleFallback = anyAge.capturedAt;
            fallbackUrl = anyAge.url;
          }
        }
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
        // don't render panels — they dump structuredContent into the
        // visible result instead (observed twice in Cowork, June 2026,
        // after the capability gate landed). Claude DESKTOP is NOT listed:
        // it renders panels and forwards tool-result correctly (verified
        // 2026-06-06 — image + buttons displayed; only nested embed
        // iframes are blocked there). This gate only matters when the
        // panel is enabled (GRADE_MCP_APPS=1) — keep that flag unset in
        // Cowork's config.
        const clientName = server.server.getClientVersion()?.name ?? "";
        const knownNonRenderer = /cowork|claude[ _-]?code/i.test(clientName);
        const uiSupported =
          Boolean(opts.appPanel) &&
          Boolean(clientCaps?.extensions?.["io.modelcontextprotocol/ui"]) &&
          !knownNonRenderer;

        // Persist — every fresh capture becomes the screen's poster in
        // Storage (latest-<mode>.png, BOTH engines, so desktop captures
        // serve later hosted previews), plus a local PNG file when running
        // on a workstation. Best-effort: a failed write must not sink a
        // successful screenshot.
        let savedPath: string | null = null;
        let savedUrl: string | null = stored?.url ?? fallbackUrl ?? null;
        // Never upload the stale-fallback base64 — that would bump the
        // poster's timestamp and dress yesterday's pixels up as fresh.
        if (!stored && !staleFallback) {
          try {
            savedUrl = await uploadPreviewPng(sb, screenId, mode, shot.base64);
          } catch (err) {
            console.error(
              "gradeui-mcp: poster upload failed:",
              err instanceof Error ? err.message : err,
            );
          }
          if (!serverless) {
            try {
              savedPath = await savePreviewPng(
                screen.name,
                screenId,
                shot.base64,
              );
            } catch (err) {
              console.error(
                "gradeui-mcp: preview file write failed:",
                err instanceof Error ? err.message : err,
              );
            }
          }
        }
        // Text stays TERSE on purpose: hosts treat image-led results as
        // first-class (rendered in the chat flow); burying the image under
        // paragraphs of agent guidance demotes the whole result to a
        // collapsed expander (observed on claude.ai web, June 2026).
        const headline = staleFallback
          ? `"${screen.name}" — WARNING: live capture failed twice (serverless resources); this is the PREVIOUS capture (${mode}, ${new Date(staleFallback).toISOString()}) and predates the latest save. TELL THE USER the preview is out of date; the embed URL below is live and current. Retry preview_screen shortly (refresh: true).`
          : stored
            ? `"${screen.name}" — stored poster (${mode}, captured ${new Date(stored.capturedAt).toISOString()}; refresh: true re-renders).`
            : `"${screen.name}" — live render, ${w}×${h} ${mode}.`;

        // Project theme — the inline View generates + applies this exactly
        // like the share / embed routes (generateTheme → themeToCSSVars).
        // Best-effort: a missing/failed theme just renders on default tokens.
        let themeDraftJson: string | null = null;
        try {
          const { data: proj } = await sb
            .from("projects")
            .select("theme_draft_json")
            .eq("id", projectId)
            .maybeSingle();
          themeDraftJson =
            (proj as { theme_draft_json?: string | null } | null)
              ?.theme_draft_json ?? null;
        } catch {
          /* theme is non-essential to the preview — ignore and use defaults */
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
                headline +
                (savedPath ? `\nFile: ${savedPath}` : "") +
                (savedUrl ? `\nPoster: ${savedUrl}` : "") +
                `\nLive embed: ${url}`,
            },
          ],
          // Forwarded to the inline View via ui/notifications/tool-result
          // (NOT added to model context in apps-capable hosts). The View
          // compiles `appSource` and renders it directly — so this carries
          // the raw JSX (a few KB), not a multi-MB image. `embedUrl` rides
          // along as an "open full" escape hatch. Omitted entirely on hosts
          // without the ui extension (see capability gate above).
          ...(uiSupported
            ? {
                structuredContent: {
                  name: screen.name,
                  screenId,
                  width: w,
                  height: h,
                  mode,
                  appSource: screen.state?.appSource ?? "",
                  embedUrl: url,
                  themeDraftJson,
                },
              }
            : {}),
        };
      },
    );
  }
}
