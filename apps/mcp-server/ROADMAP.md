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

## PRIORITY: MCP live on Vercel (phone/iPad/web access) — BUILT 2026-06-07, awaiting deploy

Mounted INSIDE apps/docs via Vercel's official `mcp-handler` (Streamable
HTTP). Same Vercel project as the site — SUPABASE_SERVICE_ROLE_KEY +
NEXT_PUBLIC_SUPABASE_URL already in its env (readEnv falls back to the
NEXT_PUBLIC url).

1. ✅ **Transport-agnostic tools** — `src/tools.ts` registerGradeTools
   (stdio entry + Next route both call it); enablePreview: false on hosted
2. ✅ **Next.js route** — `apps/docs/app/api/grade/[transport]/route.ts`
   - endpoint: `POST https://gradeui.com/api/grade/mcp?key=<GRADE_MCP_KEY>`
   - auth: capability URL via GRADE_MCP_KEY env (?key= / x-grade-key /
     Bearer all accepted); wrong or unset key → 404, never falls open
   - deps added to docs: mcp-handler ^1.1.0, @modelcontextprotocol/sdk
     ^1.26.0, @gradeui/mcp-server workspace:* (+ transpilePackages entry,
     serverExternalPackages: ["playwright"])
3. **TODO deploy + register** (manual steps)
   - `pnpm install`; add GRADE_MCP_KEY (openssl rand -hex 32) +
     GRADE_OWNER_USER_ID to Vercel env; push
   - claude.ai → Settings → Connectors → Add custom connector →
     `https://gradeui.com/api/grade/mcp?key=<secret>`
   - TEST FROM PHONE: "list my grade projects" → "make me a screen…"
4. ✅ **preview_screen on serverless** — BUILT 2026-06-07
   - `src/preview-serverless.ts`: playwright-core ~1.59 + @sparticuz/chromium
     pinned 147.0.0 (LOCKSTEP: pw-core 1.59 speaks Chromium 147 — when
     bumping playwright, read browsers.json and bump sparticuz to match)
   - PNG → Supabase Storage public bucket `screen-previews` (auto-created
     on first upload, service role) → public URL in tool text +
     structuredContent.previewUrl; the embed URL stays the live preview
   - tools.ts opts: `capture: "playwright" | "serverless" | "none"`
     (stdio default playwright; hosted route passes serverless)
   - VERIFY ON DEPLOY: first hosted preview_screen call (cold ≈ 4–10s,
     bundle ~68MB traced — if Vercel 250MB limit bites, switch to
     @sparticuz/chromium-min + CDN download)
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
- Host quirk FIXED 2026-06-07: Cowork advertises apps capability but doesn't
  render 3p panels → structuredContent gate now also sniffs clientInfo.name
  (blocklist: cowork/desktop/claude-code). Needs local rebuild to take effect.

## Studio feature: paste a Figma link → screen (no MCP needed)
- NEEDS: Figma Personal Access Token (Account Settings → Security → PAT,
  "File content: read" scope) as FIGMA_TOKEN env. Free. OAuth later for
  user-owned files.
- Endpoints: GET api.figma.com/v1/files/:fileKey/nodes?ids=:nodeId
  (header X-Figma-Token) → node subtree JSON: INSTANCE.name +
  componentProperties (variant props), frame layoutMode/itemSpacing/padding,
  text content. Optional: GET /v1/images/:fileKey?ids=&format=png&scale=2
  → rendered PNG URL to ALSO feed vision (structure + pixels together).
- URL parse: /design/<fileKey>/...?node-id=40-770 → fileKey + nodeId
  (dash→colon).
- TRANSFORM (the real work, ~1 day): subtree → compact "FIGMA REFERENCE"
  block (~1-2k tokens). Instances → Component(prop=value) lines validated
  against COMPONENT_CONTRACTS inline (unknown name / illegal variant →
  parity warning in the block). Auto-layout → Stack/Row + nearest t-shirt
  gap. Image fills → MediaSurface slots.
- PLACEMENT: packages/studio (contract-aware, model-facing) — NOT apps/docs.
  Chat route injects like the selection block; the MCP server then gets a
  create_screen_from_figma tool from the same function for free.
- Screenshot-paste (vision) already works today as the pixel-tier fallback.

## Parked / later
- Foreign-Figma mapping ("one-time deal"): fuzzy-match external file's
  component names/variant props against COMPONENT_CONTRACTS, confirm
  uncertain matches with user (elicitation/wizard), store map per file.
  Graceful degradation already covers unmapped files (vision tier).
  Business angle: client onboarding ramp — "map your Figma to Grade once,
  your designs compile after."
- A/B/C variation flow: `explorationGroup`/`variantLabel` keys in designs.state,
  promote/discard tools, vote via AskUserQuestion now, MCP App picker when #165 clears
- set_theme / list_themes tools (read STUDIO-THEMES ThemeInput contract first)
- preview_project (batch previews)
- ensureShareLink: update color_mode on reuse (currently ignored for existing links)
- watch anthropics/claude-ai-mcp#165 + #236 → live interactive panel lights up with zero code changes
