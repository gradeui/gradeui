# gradeui-mcp roadmap

Status: local stdio server fully working (7 tools: list_projects, create_project,
list_screens, create_screen, get_screen, save_screen, preview_screen).
MCP App panel built + spec-verified (blocked host-side: anthropics/claude-ai-mcp#165/#236 —
third-party apps don't render yet; test rig at view-harness.html).

## Next: hosted / live URL (so web + mobile + any Claude surface can connect)

1. **Streamable HTTP transport** alongside stdio
   - `StreamableHTTPServerTransport` from @modelcontextprotocol/sdk
   - same tool registry, second entrypoint (e.g. `src/http.ts`), `/mcp` route
2. **Auth — non-negotiable before exposure**
   - minimum: bearer token check on the HTTP route (claude.ai custom connectors support headers)
   - the Supabase service-role key sits behind this server; never ship unauthenticated
3. **Server-side screenshots** (replace local `previews/` dir when hosted)
   - upload PNG to Supabase Storage instead of disk — the STUDIO-STORAGE substrate
     (bucket + assets table, migration 0014) already exists; consider a separate
     `previews` bucket (origin: "generated") to keep user libraries clean
   - return the public/signed URL in the tool result → every host can link/present it
   - keeps preview_screen working identically; savedPath becomes savedUrl
4. **Deploy**
   - needs Chromium for Playwright → container host (Fly.io / Railway), not serverless
   - env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GRADE_OWNER_USER_ID, GRADE_SITE_URL, AUTH_TOKEN
5. **Register as custom connector** on claude.ai → works on web, mobile, desktop chat
   - reasoning still billed to subscription; server does zero model calls

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

## Parked / later
- A/B/C variation flow: `explorationGroup`/`variantLabel` keys in designs.state,
  promote/discard tools, vote via AskUserQuestion now, MCP App picker when #165 clears
- set_theme / list_themes tools (read STUDIO-THEMES ThemeInput contract first)
- preview_project (batch previews)
- ensureShareLink: update color_mode on reuse (currently ignored for existing links)
- watch anthropics/claude-ai-mcp#165 + #236 → live interactive panel lights up with zero code changes
