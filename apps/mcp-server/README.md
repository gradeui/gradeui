# @gradeui/mcp-server

A local **stdio MCP server** that lets any MCP host — Claude Desktop or Claude Code — design Grade screens **on your subscription** and save them straight into a Supabase project, where they appear in Studio.

It's the "MCP server adapter" from `grade-local-testing-and-eval.md`: a thin transport shell over the shared core in `@gradeui/studio/core`. The contract logic lives once —

- `createScreenContext(brief)` → the per-request payload (rules + relevant component refs)
- `validateAgainstContract(jsx, { contracts })` → the conformance gate before a save lands

— and this server only does transport + Supabase writes. **It makes zero model calls.** The reasoning comes from the host's Claude subscription, so generating screens costs no API tokens; you're bounded by your plan, not per-token billing.

## Why subscription, not API

The token saving comes from the **client** (Claude Desktop / Claude Code) being subscription-backed — not from where the server runs. A cloud-hosted MCP would be identical in what it tests and what it costs; the only difference is operational (a cloud client can't reach `localhost`, so it'd need a tunnel). Run it locally over stdio and there's no tunnel and no login.

## Tools

| Tool | Args | What it does |
|---|---|---|
| `list_projects` | — | Your projects (id + name) to target |
| `create_project` | `name` | Make a new empty project |
| `list_screens` | `projectId` | A project's live screens (id, name, position) |
| `create_screen` | `projectId`, `brief` | Returns the Grade context to author a screen from; the host then writes the JSX |
| `get_screen` | `projectId`, `screenId` | Returns a screen's current JSX + the refs it implies, to iterate on |
| `save_screen` | `projectId`, `jsx`, `name?`, `screenId?`, `makeActive?` | Validates, then writes the JSX into the project |
| `preview_screen` | `projectId`, `screenId`, `width?`, `height?`, `colorMode?` | Screenshots the LIVE embed (`/e/<token>`) via Playwright and returns the PNG + embed URL — the real render, in-conversation |

The generate→save split is inherent to MCP: the host's model writes the JSX **between** the `create_screen` and `save_screen` calls. There is **no browser selection** over MCP — to edit, `get_screen` and describe the change in words; the model edits the actual source.

A screen persists as **raw JSX** at `designs.state.appSource` (see the root `CLAUDE.md` "Screen persistence" note) — exactly what Studio reads, so a screen written here is indistinguishable from one Studio wrote.

## Build

The server bundles `@gradeui/studio` (which ships raw TS) and resolves `@gradeui/ui/contracts` at runtime from the workspace `node_modules`, so build the workspace first:

```bash
pnpm install
pnpm build                      # builds packages/*, incl. @gradeui/ui dist (needed for /contracts)
pnpm -F @gradeui/mcp-server build
```

Output: `apps/mcp-server/dist/index.js` (executable, with a node shebang).

For iterating on the server itself: `pnpm -F @gradeui/mcp-server dev` runs `src/index.ts` directly via `tsx`.

## Environment

Three env vars, set in the **MCP host config** (below), not in a checked-in file — the service-role key is a secret:

| Var | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase dashboard → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | same page → Project API keys → `service_role` (**secret** — bypasses RLS) |
| `GRADE_OWNER_USER_ID` | the UUID of the auth user who should own + see the screens. Supabase dashboard → Authentication → Users (copy the user's UID), or the `owner_id` of one of your existing rows in the `projects` table |
| `GRADE_SITE_URL` | *(optional)* where the live site + `/e/<token>` embed route is served. Defaults to `https://gradeui.com`; set `http://localhost:3000` to preview against a local dev server |

`preview_screen` additionally needs Playwright's Chromium binaries: `npx playwright install chromium` (once). Minting a preview share link makes that screen viewable by anyone holding the token — same trust model as sharing from Studio; revoke from the share UI if needed.

The server writes with the service-role key (a headless server can't hold a signed-in session), then hands visibility back to RLS by making `GRADE_OWNER_USER_ID` the owner of everything it creates — so when you open gradeui.com signed in as that user, the screens render.

## Register with Claude Code

Either drop a `.mcp.json` at the root of the repo you're working in:

```json
{
  "mcpServers": {
    "gradeui-screens": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/gradeui/apps/mcp-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://YOUR-PROJECT.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "eyJ...service-role...",
        "GRADE_OWNER_USER_ID": "00000000-0000-0000-0000-000000000000"
      }
    }
  }
}
```

…or add it from the CLI:

```bash
claude mcp add gradeui-screens \
  --env SUPABASE_URL=https://YOUR-PROJECT.supabase.co \
  --env SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role... \
  --env GRADE_OWNER_USER_ID=00000000-0000-0000-0000-000000000000 \
  -- node /ABSOLUTE/PATH/TO/gradeui/apps/mcp-server/dist/index.js
```

There's **no login** — a local stdio server is just spawned as a child process. Restart Claude Code after adding it.

## Register with Claude Desktop

Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`) and add the same `mcpServers` block as the `.mcp.json` above, then restart Claude Desktop.

## The loop

1. *"List my Grade projects"* → `list_projects`
2. *"Make me a settings screen in project &lt;id&gt;"* → `create_screen` returns the Grade context → Claude writes the `App` component → `save_screen` validates and writes it
3. Refresh Studio → the screen is there, set active
4. *"Open that screen and make the header sticky"* → `get_screen` returns the JSX → Claude edits it → `save_screen` with the same `screenId` updates it in place

If `save_screen` reports contract violations, the screen is **not** written — Claude fixes the JSX and calls again. That's the deterministic eval gate doing its job before anything lands.
