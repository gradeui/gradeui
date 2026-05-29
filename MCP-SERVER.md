# gradeui MCP server

A working requirements doc. What an MCP server for gradeui needs to do, what it exposes, and what we still have to figure out. Pairs with `STUDIO.md`, `STUDIO-LEARNING.md`, and `STUDIO-CHAT.md`. Not an implementation plan, a brief for one.

## Why an MCP server

Studio is the in-Studio surface for generation. The MCP server is the same primitives, tokens, and playbook surfaced to every other agent: Cursor, Claude Code, Windsurf, Zed, any MCP-aware tool. The relationship to those builders flips from "competitor for the same generation seat" to "substrate they sit on top of."

This matters strategically because the agent market is consolidating fast. The companies that win the agent IDE seat (Anthropic with Claude Code, Cursor on its own steam, Microsoft with whatever they ship next) are not the companies that win the design system seat. Those are two different fights. The MCP server is how gradeui shows up inside every fight without having to win any of them outright.

The product reality is simpler. A developer in Cursor types "build me a CRM dashboard with a left rail and a contact pipeline" and the agent emits real gradeui components directly into their codebase. The output respects the project's tokens, sticks to the allowlist, uses Sidebar instead of inventing one. The model can review its own output via the skills before handing the file back. None of this works without the MCP server doing the heavy lifting underneath.

## What the agent needs to do gradeui-grade work

Six categories of context the agent needs before generating anything good. These map roughly to the tool surface below.

The component allowlist and its sidecars. What components exist, what they are for, the compound API, the anti-patterns. Without this the model invents `<Sidebar variant="primary">` or `<TabBar>` or hand-rolls a flex layout where a Toolbar would do.

The token vocabulary. CSS variables, what each one means, the size scale (xs through xl), the spacing rhythm, the radius scale. Without this the model emits `bg-gray-900` and `text-blue-500` instead of `bg-foreground` and `text-primary`, and the theme picker stops working.

The layout primitives. Stack, Row, Grid, Flex, AppShell, with their nav variants. Without this every layout becomes inline `flex flex-col gap-2` and the settings panel cannot edit anything.

Reference layouts to pattern-match against. When the user asks for a CRM, the model needs an example CRM to anchor on. When they ask for a kanban, an example kanban. Without retrievable examples the model defaults to its prior-art training, which is shadcn marketing pages.

The skill atoms for reviewing what was generated. Accessibility audit. Layout review. Density audit. Image-description filling. The agent generates and reviews in the same loop; without the skills exposed, the review step has to happen in chat and most agents skip it.

The user's project context. Existing screens, currently-configured tokens, the team's naming conventions, the local reference layouts that supplement the curated set. Without this the agent generates in a vacuum and every output reads as foreign code dropped into the repo.

## Tools to expose

Three groups: reading (give the model context), writing (let it produce UI), reviewing (validate the output). Plus a small helpers group.

### Reading tools

`list_components()` returns a summary of every component in the allowlist: name, one-line description, tags. The agent calls this once at the start of a session to know the surface area.

`get_component(name)` returns the full sidecar for one component: compound API, prop shapes, examples, anti-patterns. The agent calls this when it has a candidate component but needs to verify the API before emitting.

`list_tokens()` returns the CSS variable reference grouped by category (colour, spacing, type, radius, shadow). The agent calls this when generating against the user's brand or asked to add a new token.

`list_layouts()` returns reference layout summaries: id, label, description, tags. The agent calls this when looking for a starter to pattern-match against.

`get_layout(id)` returns the full JSX source plus the design.md sidecar for one reference layout. The agent reads this to see how a real screen of that shape is composed.

`get_project_context()` returns the user's project state: screens, tokens currently configured, components used most, naming conventions. Computed lazily by walking the repo. The agent calls this when generating anything that should fit into the user's existing application.

`search_examples(query)` returns relevant reference layouts and skill examples for a free-text query. Retrieval-flavoured. The agent calls this when the request is ambiguous and a similarity search beats listing everything.

### Writing tools

`compose_page({ description, references?, context? })` runs the multi-pass page composer (the same one used inside Studio) and returns a JSX file plus a design.md draft. The agent calls this when the user asks for a full screen rather than a single component.

`save_page({ name, jsx, md, projectPath })` writes a new screen into the user's project. The agent calls this when the composition is ready to commit.

`update_page({ path, patches })` applies targeted edits to an existing screen file. Smaller surface than rewriting the whole file. The agent calls this when the user asks for a tweak rather than a rebuild.

### Reviewing tools

Each skill from `@gradeui/skills` exposed as an MCP tool. `review_accessibility(jsx)` returns a rubric result with severity-scored findings. Same for `review_layout(jsx)`, `review_density(jsx)`, and `describe_images(jsx)`. The agent runs these after writing and either accepts the output or iterates against the findings.

The rubric pattern (memory: `project_rubric_pattern`) means the agent receives consistent structured output across reviewers and can route to the right fix based on severity.

### Helpers

`lint_against_allowlist(jsx)` flags any non-allowlist components, JSX that imports from unknown packages, or props that do not exist on the named component. The agent runs this before save to catch hallucinations early.

`generate_tokens(brandDescription)` produces a token set from a brand description. The agent calls this when the user is starting a new project and has a brand voice but no token file yet.

`suggest_primitive(patternDescription)` returns a recommendation when the user is unsure which gradeui primitive to reach for. The agent forwards the user's description and shows the result.

## Resources to expose

MCP supports resources separately from tools. Resources are static reference content the model can read on demand. Three resource bundles worth exposing.

The playbook as a single readable resource: the same content Studio's system prompt aggregates. Tokens, layout primitives, sidecar excerpts, anti-patterns. Reading the playbook once at session start steers every generation in the session.

The full token reference as a structured resource, separate from the playbook so the model can fetch just the colour variables when it wants colours without pulling all spacing tokens too.

The reference layout content set: the .jsx + .md pairs as queryable resources. The agent uses `search_examples` for fuzzy lookup, but resources let it browse the catalogue directly when the user wants to see options.

## Prompts to expose

MCP prompts are slash-command-style entry points the agent can suggest. Four worth shipping.

`build-a-screen` is the guided multi-pass composition flow. The agent collects the description, picks references, runs the composer, and saves the result. The user does not need to know which underlying tools fired.

`review-a-screen` runs all the review skills against a target file and produces a consolidated report. The user runs this on a freshly generated screen or an existing one.

`migrate-a-page` is the migration-flavoured prompt. The agent takes an existing legacy component, identifies the gradeui equivalents, and rewrites it. Wires directly to the migration positioning the company is selling.

`theme-my-system` is the guided token-set generation flow for new projects. The user describes the brand, the agent calls `generate_tokens`, applies them to a starter reference layout, and writes the token file.

## Architecture choices

The server is a Node process the user runs locally. It reads their project from disk and exposes tools to whatever MCP client is connected. No remote service required for the base case.

The tools call into the same packages that power Studio: `@gradeui/ui` for sidecars, `@gradeui/studio-playbook` for the model-facing knowledge, `@gradeui/skills` for the reviewers, `@gradeui/walker` for the JSX parsing. This means a single source of truth for what the model knows about gradeui across both surfaces.

Versioning pins to the user's installed `@gradeui/ui` version. The server reads the lockfile and serves the sidecar bundle for that exact version. This avoids the trap of the server being ahead of the user's installed components and emitting code they cannot compile.

Inference is bring-your-own-token (see `feedback_no_hosted_free_tier`). Every tool that calls a model passes the user's API key from the agent's environment. The server never proxies inference and never holds keys server-side.

## Project-context detection

The hardest sub-problem is knowing the user's project well enough to fit into it without being told. Three signals the server can read.

The lockfile and `package.json` tell us which gradeui version is installed, whether `@gradeui/pro` is in use, and which optional peer deps (TipTap, dnd-kit, MapLibre) are present. This shapes which components the model can validly emit.

The existing JSX in the project tells us conventions: naming patterns, file structure, common imports, the local reference layouts the team has accumulated. Walking the source with `@gradeui/walker` gives us a structured view of what is already there.

The token file (if one exists) or the user's Tailwind config tells us the current brand palette. We surface these as the "current tokens" the model should respect when generating new screens.

## Skills as tool wrappers

Every skill in `@gradeui/skills` should have a thin MCP wrapper exposing it as a tool. The skill's existing rubric output (memory: `project_rubric_pattern`) maps directly to the MCP tool result shape.

This means three things compound. New skills shipped to Studio automatically benefit the MCP surface with no MCP-specific code. The rubric format gives every consumer (Studio, MCP, CI) the same review output, so a CI job running the layout reviewer reads identical to an in-Studio review. And the agent can chain skills (run a11y, then layout, then density) without bespoke orchestration in the server, because each skill is a discrete tool.

## Open questions

A handful of decisions still up for debate.

Should the MCP server expose Studio's annotate-then-prompt batch boundary? Studio is canvas-first and uses spatial annotations as the input substrate. Agents are typed-message-driven. The annotate-then-prompt model may not translate naturally. Worth considering whether a "review with notes" tool can give some of the same benefits in a text-only world.

Does the agent get a live preview while writing, or write-then-review? Live preview requires a render loop the MCP server hosts; write-then-review is simpler but loses the tightest iteration. Probably write-then-review for v0 and revisit if Cursor and Claude Code ship preview affordances.

How does the server decide where to save files when `save_page` is called? Read conventions from the existing project. If `app/(dashboard)/page.tsx` exists, the agent's "billing page" probably goes in `app/(dashboard)/billing/page.tsx`. We need a fallback when the convention is unclear, probably "ask the agent for the path."

Should the server be packaged as `@gradeui/mcp-server` or distributed via `npx @gradeui/mcp-server` only? The latter is simpler for the user (one line in their MCP config) but couples our distribution to npm registry availability.

Auth for paid providers. The agent typically passes provider keys from its own environment. We should not hold or proxy them. But we may want a one-time setup step to verify keys before the agent starts using them.

## Phasing

What ships first, second, third. Each phase ends with something users get value from independently.

Phase one is the read-only context layer. `list_components`, `get_component`, `list_tokens`, `list_layouts`, `get_layout`, plus the playbook resource. With just this, an agent in Cursor stops inventing gradeui components and starts emitting real ones. No writing tools, no skills, no project detection. Smallest possible useful server.

Phase two adds project context detection and the reviewing skills. The agent can now generate code that fits the user's existing project conventions and validate it before handing back. Project context unlocks the "feels like our codebase" quality. Skills unlock the self-review loop.

Phase three adds the writing tools: `compose_page`, `save_page`, `update_page`. The agent can now produce and persist screens end to end without round-tripping through the user. This is the point at which the MCP server becomes a real product, not a context library.

Phase four adds the prompts and the migration workflow. `migrate-a-page` is the highest-value workflow because it converts directly to consultancy briefs (matches the positioning at `POSITIONING.md` and the migration story in the home page scaffolds).

## What this is not

A few clarifications about scope so the conversation stays focused.

Not an SDK. The MCP server is a process that speaks MCP, not a library you import. SDK-like integration is a separate workstream and not blocked by this one.

Not the same thing as Studio's chat surface. Studio Chat (see `STUDIO-CHAT.md`) is the in-Studio interaction layer. The MCP server is the out-of-Studio interaction layer. They share the same playbook and skills, but neither contains the other.

Not a model. The server orchestrates tool calls. The model is whatever the user's MCP client is using. We never ship our own model.

Not a hosting plan. The server runs locally on the user's machine. A hosted variant (running on gradeui.com infrastructure) may come later but is not in the v0 scope.

## Next steps

The minimum useful work to land Phase one. Write the bare `@gradeui/mcp-server` package with the read-only tools. Test against Cursor and Claude Code as the two highest-priority clients. Publish to npm. Document the config snippet for each client in the gradeui docs site. Once a real user tries to use it for real work, the gaps become obvious and Phase two scopes itself.
