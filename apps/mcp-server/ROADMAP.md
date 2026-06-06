# gradeui-mcp roadmap

Status: local stdio server fully working (7 tools: list_projects, create_project,
list_screens, create_screen, get_screen, save_screen, preview_screen).
MCP App panel built + spec-verified (test rig: view-harness.html).
App-panel rendering: CONFIRMED Claude Desktop does NOT render third-party
MCP Apps (June 2026). The panel is built, spec-correct, and iframe-free
(verify with view-harness.html) — its natural home is claude.ai WEB, which
is the apps-supported surface and where the Vercel connector lands anyway.
Desktop/Cowork keep the working fallbacks: PNG file cards + embed URLs.
Watch anthropics/claude-ai-mcp#165/#236 for Desktop support arriving.

## PRIORITY: MCP live on Vercel (phone/iPad/web access) — TODO

Decision: mount the MCP INSIDE apps/docs (gradeui.com/api/mcp) via Vercel's
official `mcp-handler` (Streamable HTTP). Same Vercel project as the site —
SUPABASE_SERVICE_ROLE_KEY is already in its env (the /e route uses it).

1. **Refactor tools to be transport-agnostic** (~30 min)
   - extract tool registration from apps/mcp-server/src/index.ts into
     `src/tools.ts`: `registerGradeTools(server, env, opts)`
   - stdio entry (index.ts) and the Next route both call it
   - opts.capture: "playwright" (local) | "none" | "serverless" — lets the
     hosted v1 ship without preview_screen (see step 4)
2. **Next.js route in apps/docs** (~30 min)
   - `pnpm -F @gradeui/docs add mcp-handler`
   - `app/api/[mcpSlug]/route.ts` using createMcpHandler + registerGradeTools
   - v1 auth: secret URL slug from env (MCP_PATH_SECRET) — capability URL,
     single-user; reject anything else with 404
   - GRADE_OWNER_USER_ID + MCP_PATH_SECRET added to Vercel env
3. **Deploy + register custom connector** on claude.ai (Settings → Connectors)
   - URL: https://gradeui.com/api/mcp-<secret>  (Streamable HTTP)
   - works on web + iPhone + iPad + desktop chat immediately; reasoning on
     subscription, server makes zero model calls
   - TEST FROM PHONE: "list my grade projects" → "make me a screen…"
4. **preview_screen on serverless** (fast-follow, the only fiddly bit)
   - playwright-core + @sparticuz/chromium in docs app (fits 250MB limit;
     8–15s run, within 60s max duration)
   - upload PNG to Supabase Storage (STUDIO-STORAGE bucket exists, migration
     0014; consider separate `previews` bucket) → return URL not data
   - meanwhile: the embed URL IS the mobile preview (tap → live screen)
5. **Later: real auth** — OAuth via mcp-handler's withMcpAuth (or Descope
   template) when anyone-but-Ali connects; rotate the slug to retire it

Refs: github.com/vercel/mcp-handler · vercel.com/docs/mcp/deploy-mcp-servers-to-vercel

## Studio live-sync (chat saves appear in Studio without refresh)
- Supabase Realtime on the `designs` table:
  `alter publication supabase_realtime add table designs;`
- In Studio (apps/docs), on project load subscribe:
  `supabase.channel('proj-<id>').on('postgres_changes', { schema: 'public', table: 'designs', filter: 'project_id=eq.<id>' }, handler)`
- Handler rules (respect STUDIO-PERSISTENCE dirty-tracking — never clobber local edits):
  - INSERT → add screen to sidebar list (badge it "new")
  - UPDATE to a non-active screen → refresh its row/poster
  - UPDATE to the ACTIVE screen → if local is clean, hot-reload; if dirty,
    surface "updated externally — reload?" (content signature decides)
- Result: "make me a screen" in any Claude chat → it materialises in the open
  Studio tab in real time. The phone-to-desktop demo.

## Panel polish (quick)
- Title + subtitle in the app panel: screen name as title, project name as subtitle
  (fetch project name in preview_screen, add `projectName` to structuredContent,
  render `.sub` line under `.name` in ui-template.ts)

## Docs tools — "Context7 for Grade" (cheap, sellable)
- `search_components(query)` + `get_component_docs(names)` read-only tools
  serving the playbook sidecars/contracts on demand
- lets ANY agent (Cursor, Claude Code, customer setups) query accurate Grade
  component APIs via MCP — adoption feature for @gradeui/ui
- nearly free: renderComponentRefsBlock + relevantComponentNames already do this

## Figma ↔ code parity (proven 2026-06-06: size-scale frame → validated screen)
- Every Figma→Grade translation IS a parity test: validator errors map to gap
  types (unknown-prop = Figma-only prop; invalid-enum = variant drift;
  allowlist miss = component gap; missing-required = code stricter)
- Tomorrow: standard frames — variant matrices per component family (best
  contract coverage) + a few composed screens (tests auto-layout → Stack/Row/Grid)
- Discipline: Figma names == code names; variant props == contract enums;
  sync sidecar when_to_use → Figma descriptions via figma_set_description
- Endgame: `parity_audit` tool — walk Figma library (figma-console
  get_library_components), diff names+variants against COMPONENT_CONTRACTS,
  report both directions; screens cover the visual half
- Known gaps from first audit: DECIDED — code adopts Figma's xs across the
  scale (Button, TabsList, Select; Figma added xs to Tabs too). BIGGER
  FINDING: Input never migrated to the unified t-shirt scale — it has its
  own default(36)/sm(32)/xs(28); unify to xs(24)/sm(28)/md(32)/lg(40) with
  default→md alias (touch packages/ui AND vendored apps/docs copies).
  Toggle/ToggleGroup allowlist gap FIXED 2026-06-06. Input placeholder
  modeled in sidecar+contract FIXED 2026-06-06. Tabs requires controlled
  `value` (generation ergonomics — consider defaultValue).

## Code → Figma (reverse direction): "send screen to Figma" via both MCPs
- Read screen JSX (gradeui-mcp get_screen) → translate to a Figma build
  plan → write with figma-console MCP: figma_instantiate_component +
  figma_set_instance_properties for DS components (name+prop parity makes
  this mechanical), figma_execute for auto-layout frames (Stack/Row/Grid →
  layoutMode + t-shirt gap map) and text
- Resurrects the abandoned `walker` goal with LLM-as-translator instead of
  a deterministic parser; static snapshot of one state (no motion/JS)
- Best as one-way export to a "From Grade" page — re-export replaces draft
  (avoid two-way merge hell); parity screens are the ideal first test
- Host quirk fix needed: Cowork advertises apps capability but doesn't render
  3p panels → add clientInfo sniff to the structuredContent gate (capability
  check alone insufficient)

## Parked / later
- A/B/C variation flow: `explorationGroup`/`variantLabel` keys in designs.state,
  promote/discard tools, vote via AskUserQuestion now, MCP App picker when #165 clears
- set_theme / list_themes tools (read STUDIO-THEMES ThemeInput contract first)
- preview_project (batch previews)
- ensureShareLink: update color_mode on reuse (currently ignored for existing links)
- watch anthropics/claude-ai-mcp#165 + #236 → live interactive panel lights up with zero code changes
