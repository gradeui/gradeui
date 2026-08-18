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
import { projectSteeringBlock } from "@gradeui/studio/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createScreenContext,
  validateAgainstContract,
  formatViolations,
} from "@gradeui/studio/core";
import {
  relevantComponentNames,
  renderComponentRefsBlock,
} from "@gradeui/studio/playbook";
import type { DesignSystemRegistry } from "@gradeui/studio/registry";
import {
  contractsForRegistry,
  registryFor,
  REGISTRY_IDS,
} from "./registry-contracts";
import type { McpEnv } from "./supabase";
import {
  listProjects,
  createProject,
  assertProject,
  getScreen,
  listScreens,
  saveScreen,
  getTheme,
  saveTheme,
  getProjectGuidelines,
  type ProjectGuidelines,
} from "./designs";
import {
  listSharedComponents,
  getSharedComponent,
  saveSharedComponent,
  deleteSharedComponent,
  isMissingTable,
} from "./shared-components";
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
import {
  PREVIEW_SCALED_URI,
  PREVIEW_SCALED_HTML,
  SRCDOC_PROBE_URI,
  SRCDOC_PROBE_HTML,
} from "./ui-scaled-template";

/** Format a project's owner-set steering (brief, do/don't, and its own
 *  authored rules files) into the block injected into every screen
 *  context, so the agent follows the project's steering over generic
 *  defaults.
 *
 *  Delegates to @gradeui/studio/core so this server and Studio chat build
 *  the SAME block. They previously each had their own version and drifted:
 *  the rules-files harness landed in the docs app on Jul 13 and never
 *  reached here, so MCP-authored screens followed a strictly smaller rule
 *  set than the same project's chat-authored ones. */
function projectGuidelinesBlock(g: ProjectGuidelines): string {
  return projectSteeringBlock({
    type: g.type,
    context: g.context,
    dos: g.dos,
    donts: g.donts,
    files: g.rulesFiles,
  });
}

export interface GradeToolsOptions {
  siteUrl: string;
  /**
   * Where Playwright CAPTURES screenshots from (posters, preview_image,
   * preview_screen's PNG). Defaults to siteUrl. Exists because of the
   * 2026-06-11 finding: pages served by `next dev` never mount React in
   * HEADLESS browsers (any flavor — shell or full chromium; headed is
   * fine), so when GRADE_SITE_URL points at localhost for the live panel
   * iframes, captures must still run against the production deploy.
   * NOTE: production renders with ITS deployed component library — local
   * undeployed component changes won't show in posters until deployed.
   */
  captureSiteUrl?: string;
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
 *  say which fidelity the host got.
 *
 *  `registry` is the PROJECT'S design system — the same one save_screen
 *  validates against. Without it the rules, allowlist and refs handed to
 *  the author describe gradeui on a BrightLocal project, which is the
 *  registry-blindness this file was audited for (Aug 2026). */
function budgetedContext(
  brief: string,
  registry: DesignSystemRegistry,
  /** Registry rules files the PROJECT has switched off (Studio's Rules
   *  screen). Threaded from the project row so the switch means the same
   *  thing here as it does in Studio chat. */
  disabledRuleIds?: readonly string[],
  pin?: readonly string[],
) {
  const full = createScreenContext(brief, { pin, registry, disabledRuleIds });
  if (full.system.length <= PAYLOAD_BUDGET_CHARS) {
    return { ...full, style: "full" as const };
  }
  const compact = createScreenContext(brief, {
    pin,
    registry,
    disabledRuleIds,
    refsStyle: "compact",
  });
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

    // ── preview_screen_scaled ─ the canvas Fit view inside an MCP panel ──
    // The payload-light sibling of preview_screen: NO Chromium, NO PNG, NO
    // appSource — the result carries only the embed URL + virtual size
    // (constant-size no matter how big the screen is; this is the fix for
    // the "payload too large" failures the capture path can hit). The
    // panel nests the live /e/<token> embed at a virtual width and
    // transform-scales it to fit — gradeui.com interactivity, inside the
    // host. Nested frames are the open question per host: the panel's
    // status trace reports frame✓ / frame⌛ so a blocked host is a visible
    // readout, not a silent blank.
    server.registerResource(
      "gradeui-preview-scaled",
      PREVIEW_SCALED_URI,
      {
        description:
          "Live Grade screen, Fit-scaled in a nested embed iframe (MCP App view)",
        mimeType: "text/html;profile=mcp-app",
      },
      async () => ({
        contents: [
          {
            uri: PREVIEW_SCALED_URI,
            mimeType: "text/html;profile=mcp-app",
            // v5: inject the self-contained renderer bundle into the
            // shell. JSON.stringify makes it a valid JS string literal;
            // escaping "<" keeps "</script>" inside the bundle from
            // terminating the shell's own script block.
            text: PREVIEW_SCALED_HTML.replace(
              "__BUNDLE_JSON__",
              () => JSON.stringify(PREVIEW_VIEW_HTML).replace(/</g, "\\u003c"),
            ),
            _meta: {
              ui: {
                // The nested embed needs the site origin allowed. Hosts
                // that don't understand frameDomains ignore it (and may
                // block the frame — the panel reports that honestly).
                csp: {
                  frameDomains: [opts.siteUrl],
                  resourceDomains: [opts.siteUrl],
                  connectDomains: [opts.siteUrl],
                },
                prefersBorder: false,
              },
            },
          },
        ],
      }),
    );

    // ── srcdoc_probe ─ SCALED-PANEL-PLAN.md step 0 ───────────────────────
    server.registerResource(
      "gradeui-srcdoc-probe",
      SRCDOC_PROBE_URI,
      {
        description:
          "Probe: does this host allow srcdoc iframes in panels, at a real virtual viewport?",
        mimeType: "text/html;profile=mcp-app",
      },
      async () => ({
        contents: [
          {
            uri: SRCDOC_PROBE_URI,
            mimeType: "text/html;profile=mcp-app",
            text: SRCDOC_PROBE_HTML,
          },
        ],
      }),
    );
    server.registerTool(
      "srcdoc_probe",
      {
        title: "srcdoc viewport probe (MCP App capability check)",
        description:
          "Renders a 1280px-wide srcdoc iframe Fit-scaled in the panel. GREEN 'desktop ✓' = srcdoc frames work in this host AND act as a real virtual viewport (media queries match at 1280px) — the in-panel scaled renderer is viable. RED 'mobile ✗' = srcdoc allowed but viewport not honoured. Empty stage = host blocks srcdoc too.",
        _meta: { ui: { resourceUri: SRCDOC_PROBE_URI } },
        inputSchema: {},
      },
      async () => ({
        content: [
          {
            type: "text" as const,
            text: "srcdoc probe: green 'desktop ✓ 1280px viewport' in the panel means the v5 in-panel scaled renderer is fully viable in this host.",
          },
        ],
      }),
    );

    server.registerTool(
      "preview_screen_scaled",
      {
        title: "Preview a Grade screen (live, Fit-scaled, payload-light)",
        description:
          "Show a saved screen as a LIVE interactive render, scaled to fit the panel — the Studio canvas's Fit view inside the host. Unlike preview_screen this takes NO screenshot and returns NO source: the result carries only a share/embed URL (tiny, never hits payload limits) and the panel streams the real screen from the site in a nested iframe. Requires a host that allows nested frames in MCP App panels — the panel's status line reports frame✓ when it works. Mints a read-only share link if none exists. For a guaranteed-visible still image, use preview_image; for the capture-based flow, preview_screen.",
        _meta: { ui: { resourceUri: PREVIEW_SCALED_URI } },
        inputSchema: {
          projectId: z.string().describe("Project id"),
          screenId: z
            .string()
            .describe("Screen (design) id, e.g. from save_screen"),
          width: z
            .number()
            .optional()
            .describe(
              "Virtual render width in px the screen lays out at before scaling (default 1280)",
            ),
          height: z
            .number()
            .optional()
            .describe("Virtual viewport height in px (default 800)"),
          colorMode: z
            .enum(["light", "dark"])
            .optional()
            .describe("Theme mode for the embed (default light)"),
        },
      },
      async ({ projectId, screenId, width, height, colorMode }) => {
        // registryId rides into structuredContent so the View renders with
        // the PROJECT's design system (brightlocal ≠ gradeui vocab/CSS).
        const { registryId } = await assertProject(sb, env.ownerUserId, projectId);
        const screen = await getScreen(sb, projectId, screenId);
        if (!screen) {
          return errorText(
            `No screen "${screenId}" in project ${projectId}. Save it first, or check list via get_screen.`,
          );
        }
        const mode = colorMode ?? "light";
        const w = Math.min(Math.max(width ?? 1280, 320), 2560);
        const h = Math.min(Math.max(height ?? 800, 320), 2560);
        const share = await ensureShareLink(sb, projectId, screenId, mode);
        const url = embedUrl(opts.siteUrl, share.token, w);
        // Project theme draft — the bundle renders with the project's
        // theme, same as preview_screen.
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
          /* theme draft optional — bundle falls back to the default */
        }
        return {
          content: [
            {
              type: "text" as const,
              text:
                `Live Fit-scaled preview of "${screen.name}" (${w}×${h} virtual, ${mode}) ` +
                `rendered IN the panel (srcdoc, no capture). Embed: ${url}`,
            },
          ],
          // v5: the JSX route — a few KB of source, never a megabyte of
          // pixels. The shell proxies this into the srcdoc renderer.
          structuredContent: {
            name: screen.name,
            screenId,
            width: w,
            height: h,
            mode,
            appSource: screen.state?.appSource ?? "",
            embedUrl: url,
            themeDraftJson,
            registryId,
            // Project shared components — the View registers these with
            // the render core so "@project/components" imports resolve.
            sharedComponents: await fetchSharedComponentSources(sb, projectId),
            // v7: the renderer bundle drops its own header/footer/4:3
            // frame and renders edge-to-edge — the shell owns chrome at
            // 1:1 (the double-chrome fix). Requires the preview-view
            // bundle rebuilt with bare-mode support.
            bare: true,
          },
        };
      },
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

  // ── get_theme ────────────────────────────────────────────────────────
  server.registerTool(
    "get_theme",
    {
      title: "Get a project's theme",
      description:
        "Read a Grade project's theme — the working draft ThemeInput (deterministic: the rendered theme is generated from it) plus any saved variants. Edit the returned draft and pass it to save_theme to update the theme.",
      inputSchema: {
        projectId: z.string().describe("Project id (from list_projects)"),
      },
    },
    async ({ projectId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      const theme = await getTheme(sb, projectId);
      const versionLine = `version (updatedAt): ${theme.updatedAt} — pass this back to save_theme as expectedUpdatedAt so a concurrent edit isn't overwritten.`;
      if (theme.draft == null && theme.variants == null) {
        return text(
          `Project ${projectId} has no theme set yet (it uses the default). Use save_theme to set one.\n${versionLine}`,
        );
      }
      const parts = [
        `Theme for project ${projectId}:`,
        versionLine,
        "",
        "draft (ThemeInput):",
        JSON.stringify(theme.draft, null, 2),
      ];
      if (theme.variants != null) {
        parts.push("", "variants:", JSON.stringify(theme.variants, null, 2));
      }
      return text(parts.join("\n"));
    },
  );

  // ── save_theme ───────────────────────────────────────────────────────
  server.registerTool(
    "save_theme",
    {
      title: "Save a project's theme",
      description:
        "Set a Grade project's working theme draft from a ThemeInput JSON string. Pass the FULL ThemeInput (e.g. get_theme's draft, edited, re-stringified). The theme is deterministic — Studio regenerates the rendered theme from it on next load. Only the draft is updated; saved variants are untouched. ALWAYS pass expectedUpdatedAt (the version from get_theme) so a concurrent edit isn't silently overwritten; on a version mismatch the save is refused and you should get_theme again, re-apply your change, and retry.",
      inputSchema: {
        projectId: z.string().describe("Project id (from list_projects)"),
        themeJson: z
          .string()
          .describe(
            "The full ThemeInput as a JSON string (an object with hues, typography, spacing, etc.).",
          ),
        expectedUpdatedAt: z
          .number()
          .optional()
          .describe(
            "The `updatedAt` version returned by get_theme. The write is refused (no overwrite) if the theme changed since.",
          ),
      },
    },
    async ({ projectId, themeJson, expectedUpdatedAt }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      let theme: unknown;
      try {
        theme = JSON.parse(themeJson);
      } catch {
        return text(
          "themeJson is not valid JSON. Pass the ThemeInput as a JSON string.",
        );
      }
      if (theme == null || typeof theme !== "object" || Array.isArray(theme)) {
        return text(
          "themeJson must be a JSON object (a ThemeInput), not an array or primitive.",
        );
      }
      const result = await saveTheme(sb, projectId, theme, expectedUpdatedAt);
      if (!result.ok) {
        return text(
          `Conflict: the theme for project ${projectId} changed since you loaded it (now version ${result.updatedAt}). NOT overwritten. Call get_theme again, re-apply your change on the latest, and retry with the new expectedUpdatedAt.`,
        );
      }
      return text(
        `Saved theme draft for project ${projectId} (version ${result.updatedAt}). Studio will pick it up on next load.`,
      );
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
      title: "List a project's design-system components",
      description:
        'List the components you may use in a project\'s screen JSX (that design system\'s Studio allowlist) — the source of truth for what save_screen will accept FOR THAT PROJECT. Projects are registry-scoped (Grade, BrightLocal, …), so pass `projectId` (or `registryId`) — without one this tool cannot know which design system you are writing against. Pass `query` (a feature, component name, or alias — e.g. "chart", "data table", "dropdown menu") to get the COMPACT API reference (import, variants, sizes, props, composes_with) for the matching components; omit it for the full name list. Only emit components this tool returns; anything else fails the contract check on save.',
      inputSchema: {
        projectId: z
          .string()
          .optional()
          .describe(
            "Project id (from list_projects) — resolves the SAME registry save_screen will validate against. Required unless you pass registryId.",
          ),
        registryId: z
          .string()
          .optional()
          .describe(
            `Explicit design-system registry, for browsing without a project. One of: ${REGISTRY_IDS.join(", ")}.`,
          ),
        query: z
          .string()
          .optional()
          .describe(
            'Optional. A feature/component/alias to filter on (e.g. "chart", "map", "dropdown") — returns compact API refs for matches. Omit to list the whole allowlist.',
          ),
      },
    },
    async ({ projectId, registryId, query }) => {
      // Registry-BLIND answers are worse than no answer: this tool used to
      // describe gradeui components authoritatively to BrightLocal
      // projects, where every one of them fails the save-time contract
      // check (Aug 2026 report). Refuse rather than guess.
      let resolvedId: string | null;
      if (projectId) {
        ({ registryId: resolvedId } = await assertProject(
          sb,
          env.ownerUserId,
          projectId,
        ));
      } else if (registryId) {
        if (!REGISTRY_IDS.includes(registryId)) {
          return errorText(
            `Unknown registryId "${registryId}". Known registries: ${REGISTRY_IDS.join(", ")}.`,
          );
        }
        resolvedId = registryId;
      } else {
        return errorText(
          [
            "list_components needs to know WHICH design system you are writing against — component names collide across registries and the wrong answer fails the contract check on save.",
            "",
            `Pass \`projectId\` (from list_projects, preferred — it resolves the same registry save_screen validates against), or \`registryId\` (one of: ${REGISTRY_IDS.join(", ")}) to browse without a project.`,
          ].join("\n"),
        );
      }

      const registry = registryFor(resolvedId);
      const allowedList = [...registry.components.allowed];
      const label = `${registry.name} (registry "${registry.id}", package ${registry.package.name})`;

      // No query → the full allowlist as a plain name list.
      if (!query || !query.trim()) {
        return text(
          [
            `${label} — components you may emit (${allowedList.length}):`,
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
      const refMatched = relevantComponentNames(query, registry).filter((n) =>
        allowed.has(n.toLowerCase()),
      );
      const nameMatched = allowedList.filter((n) =>
        n.toLowerCase().includes(q),
      );
      const matched = Array.from(new Set([...refMatched, ...nameMatched]));

      if (matched.length === 0) {
        return text(
          `No ${label} component matched "${query}". Call list_components with the same project/registry and no \`query\` to see the full list.`,
        );
      }

      // Compact refs keep the result under the host's size limit; a
      // matched component without an authored sidecar still surfaces by
      // name so the caller knows it's available.
      const block = renderComponentRefsBlock({
        onlyFor: matched,
        style: "compact",
        registry,
      });
      const header = `${label} — matched ${matched.length} component(s) for "${query}": ${matched.join(", ")}`;
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
      const { registryId, disabledRuleIds } = await assertProject(
        sb,
        env.ownerUserId,
        projectId,
      );
      const registry = registryFor(registryId);
      const guidelines = projectGuidelinesBlock(
        await getProjectGuidelines(sb, projectId),
      );
      const { system, refs, style } = budgetedContext(
        brief,
        registry,
        disabledRuleIds,
      );
      const body = [
        `Target project: ${projectId}`,
        `Design system: ${registry.name} (registry "${registry.id}", package ${registry.package.name})`,
        `Component refs in scope (${style}): ${refs.join(", ") || "(none matched)"}`,
        "",
        `Write the screen as ONE self-contained React component named \`App\` with \`export default\`, following the ${registry.name} rules below. Then call \`save_screen\` with { projectId, name, jsx } where \`jsx\` is the full component source.`,
        ...(guidelines ? ["", guidelines] : []),
        "",
        `─── ${registry.name.toUpperCase()} SCREEN CONTEXT ───`,
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
        "Fetch a screen's current JSX source plus the component refs implied by that source (from the PROJECT'S design system, not necessarily Grade), so you can iterate on it. Describe the change in words (there is no browser selection over MCP), edit the JSX, then call save_screen with the SAME screenId.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        screenId: z
          .string()
          .describe("Screen (design) id — list it via the project in Studio or after a save"),
      },
    },
    async ({ projectId, screenId }) => {
      const { registryId, disabledRuleIds } = await assertProject(
        sb,
        env.ownerUserId,
        projectId,
      );
      const registry = registryFor(registryId);
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
      const { system, refs, style } = budgetedContext(
        appSource,
        registry,
        disabledRuleIds,
      );
      const guidelines = projectGuidelinesBlock(
        await getProjectGuidelines(sb, projectId),
      );
      const body = [
        `Screen: "${screen.name}" — id: ${screen.id} (position ${screen.position})`,
        `version (updatedAt): ${screen.updatedAt} — pass this back to save_screen as expectedUpdatedAt so a concurrent edit isn't overwritten.`,
        `Design system: ${registry.name} (registry "${registry.id}", package ${registry.package.name})`,
        `Component refs in scope (${style}): ${refs.join(", ") || "(none matched)"}`,
        "",
        "Current source (raw JSX):",
        "```jsx",
        appSource,
        "```",
        "",
        `Edit this JSX per the user's request, then call \`save_screen\` with { projectId, screenId, jsx, expectedUpdatedAt } (same screenId, the version above) to update it in place. ${registry.name} rules below.`,
        "",
        `─── ${registry.name.toUpperCase()} SCREEN CONTEXT ───`,
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
        "Validate JSX against the Grade component contracts, then write it into the project. Omit screenId to create a new screen; pass it to update an existing one. If validation finds errors the screen is NOT saved — fix the JSX and call again. When UPDATING, ALWAYS pass expectedUpdatedAt (the version from get_screen) so a concurrent edit isn't silently overwritten; on a version mismatch the save is refused — get_screen again, re-apply your change on the latest, and retry.",
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
        expectedUpdatedAt: z
          .number()
          .optional()
          .describe(
            "The `updatedAt` version from get_screen. On UPDATE, the write is refused (no overwrite) if the screen changed since.",
          ),
      },
    },
    async ({ projectId, jsx, name, screenId, makeActive, expectedUpdatedAt }) => {
      const { registryId } = await assertProject(sb, env.ownerUserId, projectId);

      // Conformance gate — the deterministic seed of the eval ladder. Block
      // on error-severity violations so broken screens never land; warnings
      // and info pass through (logged in the success note). Contracts are
      // resolved through the PROJECT'S registry (BYODS) — a BrightLocal
      // screen validates against BrightLocal's contracts, never gradeui's
      // name-colliding ones.
      const { registry, contracts } = contractsForRegistry(registryId);
      const report = validateAgainstContract(jsx, { contracts });
      const errors = report.violations.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        return errorText(
          `Not saved — ${errors.length} contract violation(s) against the "${registry.id}" registry's contracts. Fix the JSX and call save_screen again:\n\n${formatViolations(
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
        expectedUpdatedAt,
      });

      if (result.conflict) {
        return errorText(
          `Conflict: screen ${result.id} changed since you loaded it (now version ${result.updatedAt}). NOT overwritten. Call get_screen again, re-apply your edit on the latest source, and retry save_screen with the new expectedUpdatedAt.`,
        );
      }

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

  // ── shared components ─────────────────────────────────────────────────
  //
  // Project-scoped reusable JSX modules screens import via the stable
  // "@project/components" specifier. Stored in the shared_components
  // table (migration 0025); compiled at render time by the same kernels
  // that compile screens. Table-missing errors (42P01) get an actionable
  // message because migrations are applied manually.

  /** {name → source} of a project's live shared components, for the
   *  structuredContent channel. Missing table → empty (migration not
   *  applied yet must not break previews). */
  async function fetchSharedComponentSources(
    client: SupabaseClient,
    projectId: string,
  ): Promise<Record<string, string>> {
    try {
      const rows = await listSharedComponents(client, projectId);
      if (rows.length === 0) return {};
      const out: Record<string, string> = {};
      for (const meta of rows) {
        const full = await getSharedComponent(client, projectId, meta.id);
        if (full) out[full.name] = full.source;
      }
      return out;
    } catch (err) {
      if (isMissingTable(err)) return {};
      throw err;
    }
  }

  const MIGRATION_HINT =
    "The shared_components table does not exist yet — apply apps/docs/supabase/migrations/0025_shared_components.sql in the Supabase SQL editor first.";

  server.registerTool(
    "save_shared_component",
    {
      title: "Save a shared component",
      description:
        'Create or update a project-scoped SHARED COMPONENT — a reusable JSX module (an AppLayout, a Stepper) that screens import via `import { Name } from "@project/components"` instead of copy-pasting. The source must `export` a component whose name matches `name` (compound sub-parts like AppLayout.Header live inside the module). It may import "@gradeui/ui", "lucide-react", the other allowed externals, and other shared components via "@project/components". Validated against the project registry\'s contracts like a screen. Omit componentId to create; pass it (with expectedUpdatedAt from get_shared_component) to update — screens pick the new version up on next render.',
      inputSchema: {
        projectId: z.string().describe("Project id (from list_projects)"),
        name: z
          .string()
          .regex(/^[A-Z][A-Za-z0-9]*$/, "PascalCase component name")
          .describe("PascalCase export/import name, e.g. AppLayout"),
        jsx: z
          .string()
          .describe("Full module source. Must `export function <name>` (or const)."),
        description: z
          .string()
          .optional()
          .describe("One line on what it is for — shown in list_shared_components"),
        componentId: z
          .string()
          .optional()
          .describe("Existing component id to update in place; omit to create"),
        expectedUpdatedAt: z
          .number()
          .optional()
          .describe(
            "The `updatedAt` from get_shared_component. On UPDATE, the write is refused (no overwrite) if the component changed since.",
          ),
      },
    },
    async ({ projectId, name, jsx, description, componentId, expectedUpdatedAt }) => {
      const { registryId } = await assertProject(sb, env.ownerUserId, projectId);

      // The module must actually export the declared name, or every
      // importing screen breaks with a confusing undefined-component
      // error at render time. Cheap static check, not a compile.
      const exportRe = new RegExp(
        `export\\s+(?:function|const|let|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`,
      );
      if (!exportRe.test(jsx)) {
        return errorText(
          `Not saved — the source does not export \`${name}\`. Add \`export function ${name}(...)\` (or \`export const ${name} = ...\`, or include it in an \`export { ... }\` list).`,
        );
      }

      // Same conformance gate as screens: the component's own JSX must
      // respect the project registry's contracts. (No App/default-export
      // requirement — that is a screen rule, not a module rule.)
      const { registry, contracts } = contractsForRegistry(registryId);
      const report = validateAgainstContract(jsx, { contracts });
      const errors = report.violations.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        return errorText(
          `Not saved — ${errors.length} contract violation(s) against the "${registry.id}" registry's contracts:\n\n${formatViolations(report)}`,
        );
      }

      let result;
      try {
        result = await saveSharedComponent(sb, {
          projectId,
          name,
          source: jsx,
          description,
          createdBy: env.ownerUserId,
          componentId,
          expectedUpdatedAt,
        });
      } catch (err) {
        if (isMissingTable(err)) return errorText(MIGRATION_HINT);
        throw err;
      }

      if (result.conflict) {
        return errorText(
          `Conflict: shared component ${result.id} changed since you loaded it (now version ${result.updatedAt}). NOT overwritten. Call get_shared_component again, re-apply your edit on the latest source, and retry with the new expectedUpdatedAt.`,
        );
      }
      if (result.nameTaken) {
        return errorText(
          `Not saved — a live shared component named "${name}" already exists in this project. Use list_shared_components to find it and update it by componentId, or pick another name.`,
        );
      }
      return text(
        `Saved shared component "${name}" — id: ${result.id} (${
          result.created ? "new" : "updated"
        }, version ${result.updatedAt}) in project ${projectId}. Screens import it with: import { ${name} } from "@project/components" — existing screens pick the new version up on next render.`,
      );
    },
  );

  server.registerTool(
    "list_shared_components",
    {
      title: "List a project's shared components",
      description:
        "List the project's live shared components (id, name, description, version — no source, use get_shared_component for that). These are importable in screens via \"@project/components\".",
      inputSchema: {
        projectId: z.string().describe("Project id (from list_projects)"),
      },
    },
    async ({ projectId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      let rows;
      try {
        rows = await listSharedComponents(sb, projectId);
      } catch (err) {
        if (isMissingTable(err)) return errorText(MIGRATION_HINT);
        throw err;
      }
      if (rows.length === 0) {
        return text(
          `No shared components in project ${projectId} yet. Create one with save_shared_component.`,
        );
      }
      const lines = rows.map(
        (r) =>
          `- ${r.name} — id: ${r.id}, version: ${r.updatedAt}, ${r.sourceChars} chars${
            r.description ? ` — ${r.description}` : ""
          }`,
      );
      return text(
        `Shared components in project ${projectId} (import from "@project/components"):\n${lines.join("\n")}`,
      );
    },
  );

  server.registerTool(
    "get_shared_component",
    {
      title: "Get a shared component's source",
      description:
        "Fetch a shared component's full module source for editing. Edit the JSX, then call save_shared_component with the SAME componentId and this version as expectedUpdatedAt.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        componentId: z.string().describe("Component id (from list_shared_components)"),
      },
    },
    async ({ projectId, componentId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      let row;
      try {
        row = await getSharedComponent(sb, projectId, componentId);
      } catch (err) {
        if (isMissingTable(err)) return errorText(MIGRATION_HINT);
        throw err;
      }
      if (!row) {
        return errorText(
          `No shared component "${componentId}" in project ${projectId}. See list_shared_components.`,
        );
      }
      return text(
        `Shared component "${row.name}" — id: ${row.id}\nversion (updatedAt): ${row.updatedAt} — pass this back to save_shared_component as expectedUpdatedAt so a concurrent edit isn't overwritten.${
          row.description ? `\ndescription: ${row.description}` : ""
        }\n\nSource (raw JSX module):\n\`\`\`jsx\n${row.source}\n\`\`\``,
      );
    },
  );

  server.registerTool(
    "delete_shared_component",
    {
      title: "Delete a shared component",
      description:
        "Soft-delete a shared component (recoverable in the database; frees the name for reuse). Screens that import it will fail to render until they stop importing it — check usage first.",
      inputSchema: {
        projectId: z.string().describe("Project id"),
        componentId: z.string().describe("Component id (from list_shared_components)"),
      },
    },
    async ({ projectId, componentId }) => {
      await assertProject(sb, env.ownerUserId, projectId);
      let ok;
      try {
        ok = await deleteSharedComponent(sb, projectId, componentId);
      } catch (err) {
        if (isMissingTable(err)) return errorText(MIGRATION_HINT);
        throw err;
      }
      if (!ok) {
        return errorText(
          `No live shared component "${componentId}" in project ${projectId} — nothing deleted.`,
        );
      }
      return text(
        `Deleted shared component ${componentId} (soft — recoverable in the database). Screens importing it will error until updated.`,
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
      // Capture may target a different deploy than the user-facing embed
      // link (GRADE_CAPTURE_URL) — same token, same data, both read the
      // shared Supabase. `flat=1` = the capture-grade render: the screen
      // DIRECTLY in the page (no FastIframeHost) with the
      // data-grade-ready contract the capture waits on.
      const captureUrl =
        embedUrl(opts.captureSiteUrl ?? opts.siteUrl, share.token, w) +
        "&flat=1";

      const stored = a.refresh
        ? null
        : await getStoredPreview(sb, a.screenId, mode, screen.updatedAt);

      const capture = async () =>
        sls
          ? await (
              await import("./preview-serverless")
            ).screenshotEmbedServerless(captureUrl, w, h, mode)
          : await screenshotEmbed(captureUrl, w, h, mode);

      let shot = stored ? { base64: stored.base64, width: w, height: h } : null;
      let staleFallback: number | null = null;
      let fallbackUrl: string | null = null;
      let captureErr: unknown = null;
      if (!shot) {
        try {
          shot = await capture();
        } catch (first) {
          // Retry only for transient failures (launch hiccups, navigation
          // timeouts). A "rendered no content" diagnostic is deterministic —
          // retrying doubles the wall-clock for the same answer and blows
          // the MCP request budget (the 2026-06-11 -32001 timeouts).
          const msg = first instanceof Error ? first.message : String(first);
          if (msg.includes("rendered no content")) {
            captureErr = first;
          } else {
            try {
              shot = await capture();
            } catch (e) {
              captureErr = e;
            }
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
        // Why the live capture failed, when it did — surfaced in the
        // headline so a stale-poster fallback can EXPLAIN itself instead
        // of swallowing the diagnostics (preview.ts collects page errors
        // precisely for this).
        captureError: captureErr
          ? captureErr instanceof Error
            ? captureErr.message
            : String(captureErr)
          : null,
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
            .describe("Theme mode (default light)"),
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
          ? `"${r.screen.name}" — WARNING: live capture failed; this is the PREVIOUS capture (${r.mode}, ${new Date(r.staleFallback).toISOString()}) and predates the latest save. Retry shortly (refresh: true).${r.captureError ? `\nCapture failure detail: ${r.captureError}` : ""}`
          : r.fromStored
            ? `"${r.screen.name}" — stored poster (${r.mode}; refresh: true re-renders).`
            : `"${r.screen.name}" — live render, ${r.w}×${r.h} ${r.mode}.`;
        // SMALL structuredContent only — name/dims/mode/embedUrl for the
        // panel chrome. The PANEL paints via its poster self-load (the
        // deterministic Supabase URL; the capture above uploaded it before
        // this result returns), now that the panel's mode-slot default
        // matches the server's. Deliberately NO imageDataUri: some hosts
        // (Claude Code desktop) echo structuredContent into the MODEL's
        // context, and a multi-hundred-KB base64 blob burned ~25k tokens
        // per call there (observed 21 Jul).
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
          structuredContent: {
            name: r.screen.name,
            screenId,
            width: r.w,
            height: r.h,
            mode: r.mode,
            embedUrl: r.url,
          },
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
        // registryId → structuredContent, so the inline View renders with
        // the PROJECT's design system rather than sniffing the source.
        const { registryId } = await assertProject(sb, env.ownerUserId, projectId);
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
        // See captureScreenShot: capture may target a different deploy,
        // and flat=1 is the capture-grade no-iframe render.
        const captureUrl =
          embedUrl(opts.captureSiteUrl ?? opts.siteUrl, share.token, w) +
          "&flat=1";

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
              ).screenshotEmbedServerless(captureUrl, w, h, mode)
            : await screenshotEmbed(captureUrl, w, h, mode);

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
                  registryId,
                },
              }
            : {}),
        };
      },
    );
  }
}
