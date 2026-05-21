# Studio × Figma — designer bridge plan

Companion to `STUDIO.md`, `STUDIO-SKILLS-PLAN.md`, `STUDIO-LAYOUT-PANEL.md`. Captures the "what would it take to make Studio feel like home for designers, not just for prompt-driven coders" question — specifically the three Figma-bridging directions, what each is realistically worth, and the sequence that gets us value fastest.

Nothing in here is wired up yet. The point of the doc is to pick a sequence before we start.

## The problem in one sentence

A Ramp-style designer's working state lives in a Figma file: frames, variants, autolayout, variables. Studio's working state lives in a JSX string. Today there's no bridge — a designer either rebuilds the Figma frame in chat ("make me a card with…") or hand-walks the engineer through it. Both lose information.

## Three directions, ranked by ROI

| Direction | What it does for a designer | Effort | Payoff | Verdict |
|---|---|---|---|---|
| **A. Paste-a-URL → seed Studio** | Drop a Figma frame URL into the chat input. Studio fetches the frame, interprets it, and emits matching gradeui JSX as the seed. | Low | High | **Ship first.** |
| **B. Import-as-reference-layout** | Pick a Figma frame and graduate it to a curated `REFERENCE_LAYOUTS` entry. Becomes a starter the model can seed any future user from. | Medium | Medium | Ship second — only after A proves the conversion is good enough. |
| **C. Export Studio → Figma** | Take the current Studio app and push it back into Figma as a frame tree. | Low–Medium | High | Ship third — but the cost dropped dramatically. The remote Figma MCP server ships `generate_figma_design`, which captures a live web URL into editable Figma frames. We don't write the renderer; we just point it at Studio's preview URL. |

The recurring theme: every direction here is gated on **name + token parity** between gradeui components and the Figma library. If a Figma `Button` doesn't map cleanly to `<Button>`, none of the three works. Section "Parity prerequisites" below.

## What we already have on the gradeui side

- **`packages/ui/COMPONENTS.md`** — per-component Figma status column (`✅ built / ⚠️ partial / ⏳ pending / ❌ not in Figma / 🔁 deferred`). This is the spine. The plan below assumes this file stays the source of truth for which components are even candidates for round-tripping.
- **CSS variables as the design-token interface** — `--background`, `--primary`, `--radius`, etc. Already the contract between code and consumers. Figma variables on the designer side need to mirror these one-for-one (most do; gap analysis in "Parity prerequisites").
- **Component sidecars (`packages/ui/components/ui/*.md`)** — already declare `aliases`, `name`, `props`, `composes_with`. The retrieval layer in Studio uses these to pin sidecars by prompt; the Figma import path can reuse the same retrieval to map a Figma node's component name → the right gradeui import.
- **Reference layouts (`packages/studio/src/playbook/layouts/scaffolds/*.jsx`)** — proven shape for "saveable seed app". Direction B drops `.jsx` files into this directory; no new abstraction needed.

## What the Figma MCPs give us

Figma ships **two first-party MCP servers** with overlapping but different toolsets. Picking the right one for each direction matters — the remote one collapses what would otherwise be weeks of work.

### Desktop server (runs alongside Figma desktop)

Endpoint: `http://127.0.0.1:3845`. Free, requires Figma desktop running with Dev Mode MCP enabled in preferences. Selection-aware — `get_design_context` defaults to whatever's selected in the open file.

| Tool | What it returns | Used for |
|---|---|---|
| `get_design_context` | Structured node tree — names, autolayout direction, padding/gap, type names if the node is a library instance, text content, fills. Default output is React + Tailwind; framework configurable per prompt | **The core of direction A.** What the model "sees" when a URL is pasted. |
| `get_variable_defs` | Variable bindings (colour / number / string) the selection uses, in their library namespace | Token mapping. Lets us answer "is this fill bound to a token we recognise, or a raw hex?" |
| `get_screenshot` | PNG of the selection | Two uses: (a) shown next to the seeded JSX in chat as "this is what you pasted", (b) fed as an image to the model so it can see decorative content the structural pass misses (illustrations, custom typography). |
| `get_metadata` | Sparse XML of layer IDs / names / types / positions | Sanity-check + cheap pre-pass for very large designs before calling `get_design_context`. |
| `get_figjam` | FigJam node XML + screenshots | Out of scope for v1 — Figma frames only. |

The session-earlier `mcp__Figma__*` tools were this server. It disconnected; reopen Figma desktop and re-enable Dev Mode MCP to bring them back.

### Remote server (Figma-hosted, beta)

URL in the [remote-server-installation docs](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/). Currently free during beta, will be usage-based paid. Same read tools as desktop, plus the entire **write side**:

| Tool | What it does | Used for |
|---|---|---|
| `generate_figma_design` | Captures live web UI from a URL and emits editable Figma frames into a new file, existing file, or clipboard | **Collapses direction C from "we build the renderer" to "we point this at Studio's preview URL".** Restricted to a client allow-list (Cursor, Claude Code, VS Code, etc.) — Studio's-not-listed status is the one open question. |
| `use_figma` | General-purpose create/edit/inspect on any Figma Design or FigJam object — pages, frames, components, variants, variables, styles, text, images | Fallback for direction C if `generate_figma_design` is client-gated. Slower (we build the tree explicitly) but unblocked. |
| `search_design_system` | Searches connected libraries for components / variables / styles matching a query | Helps direction A: given a node with `componentName: "Button"`, confirm the library actually publishes a `Button` before lifting. |
| `get_libraries` | Lists libraries subscribed to a file + libraries available to add | Inventory check for parity audits. |
| `create_new_file` | Creates a new design or FigJam file in user drafts | Direction C: lands the captured frames somewhere if no target file is given. |
| `upload_assets` | Uploads PNG/JPG/GIF/WebP into a Figma file (max 10MB) | Future: lets generated `<MediaSurface>` placeholders end up as real fills on the Figma side. |
| `add_code_connect_map` / `get_code_connect_map` / `get_code_connect_suggestions` / `send_code_connect_mappings` / `get_context_for_code_connect` | Reads + writes the Code Connect mapping that links a Figma node to its code component | **The quality dial for both A and C.** With mappings, the lift is exact. Without, it's fuzzy name-match against sidecars. See "Code Connect" section below. |

### The big architectural shift

The v1 of this plan assumed we'd build a JSX → Figma-node-tree renderer and ship a custom Figma plugin. **We don't.** `generate_figma_design` already does it. The work is reduced to:

1. Wire the remote Figma MCP server into Studio's chat route as another tool source.
2. Decide which direction surfaces each tool ("Export to Figma" header button → `generate_figma_design`; chat paste-a-URL → `get_design_context`).
3. Handle the client allow-list question on `generate_figma_design` (test first; if blocked, fall back to `use_figma`).

That's days, not weeks.

## Parity prerequisites (the blocker on all three directions)

The work in this section is shared by A, B, and C. If we get it wrong, all three break the same way.

### Component-name parity

The contract: **a Figma component's name + variant props should match the gradeui import's name + JSX props, kebab vs Pascal aside.** When `get_design_context` returns `{ type: "INSTANCE", componentName: "Button", componentProperties: { variant: "secondary", size: "sm" } }`, the importer should be able to lift that straight to `<Button variant="secondary" size="sm" />` with no remapping layer.

Where it can break:

- **Figma uses "Property" but code uses prop** — fine if names match (`variant`, `size`). Audit needed against `packages/ui/components/ui/*.md` frontmatter `props:`. Mismatches go in a translation table or get renamed at the Figma side. Renaming Figma is cheaper than maintaining a translation table.
- **Different variant values.** COMPONENTS.md flags this already (`Toggle: Figma covers default size only`). For partial coverage, importer falls back to the default and emits a comment.
- **Composite components** (`Card + CardHeader + CardTitle + ...`). Designers compose these in Figma as a frame + child instances; we have to recognise the pattern and emit the composed JSX, not five sibling tags.
- **Layout primitives without a Figma component**. `Stack` / `Row` are Figma *autolayout frames*, not library instances. The importer reads `autolayout.direction === "VERTICAL"` → `<Stack>`, `HORIZONTAL` → `<Row>`. Gap/padding/align come from autolayout properties.

**Action:** before v1 of direction A, walk the COMPONENTS.md `Figma` column and produce a parity audit doc — for every `⚠️ partial` row, decide whether the Figma side gets bumped to ✅ or the importer needs a remap rule. Likely 1–2 days of design work; defer code until this is done.

### Token parity

Figma variables ↔ gradeui CSS variables.

- **Colours.** Figma library variables: `color/background`, `color/foreground`, `color/primary`, etc. (or whatever the current naming is). Should mirror gradeui's `--background`, `--foreground`, `--primary`. `get_variable_defs` returns variable IDs in the library namespace; we map those to CSS-var names.
- **Radii.** `radius/sm`, `radius/md`, `radius/lg` → `--radius`. gradeui derives `--radius-sm/lg` from `--radius` arithmetically — if Figma has independent radius variables, we lose the relationship on round-trip. **Decision needed:** does Figma duplicate the arithmetic, or do we treat `--radius` as canonical and synthesise the rest on export?
- **Spacing.** Tailwind's `gap-2 / gap-4 / gap-6` ladder. gradeui doesn't tokenise spacing (Tailwind's scale is the token system). On import: read raw px from autolayout, snap to nearest Tailwind value (`8/16/24/32` → `gap-2/4/6/8`). On export: reverse. Lossy in the gaps between Tailwind values, but those gaps are intentional.
- **Typography.** Figma text styles → `font-*` Tailwind classes. gradeui has a small set (display / heading / body / mono); the Figma library should mirror it. If a designer uses a one-off text style, importer falls back to the nearest body variant and emits a comment.

**Action:** alongside the component-parity audit, produce a token-parity table. One row per CSS variable, marking Figma-variable equivalent (if any), conversion direction, and lossy-on-roundtrip flag.

## Direction A — paste-a-Figma-URL → seed Studio

The cheapest, highest-payoff thing we can ship. End-to-end mechanics:

### User flow

1. Designer copies a Figma frame URL (selection link or node link — both have `?node-id=…`).
2. Pastes into the Studio chat input. **No new UI needed** — the existing input handles it.
3. Studio detects "this is a Figma URL" before sending and shows a small inline chip: `↗ Figma frame "Pricing card" — interpret as seed?`
4. Click "interpret as seed" (or auto-go if no other message text).
5. Server-side: chat route fans out to the Figma MCP, fetches `get_design_context` + `get_variable_defs` + `get_screenshot`. Cached by node-id for the session.
6. The Figma payload gets rendered into the system prompt as a new "FIGMA SEED" block (peer of TARGETED EDIT, REFERENCE LAYOUT). The user message becomes `Generate the gradeui JSX for the Figma frame above. Use the listed components verbatim where their names match.`
7. Model emits JSX. Screenshot is shown in the chat next to the model's response as "what you pasted vs. what I generated" so the designer can eyeball the gap.

### Code shape

- **URL detection.** `apps/docs/lib/figma-url.ts` — pure parser. Recognises `figma.com/file/<key>/...?node-id=<id>` and `figma.com/design/<key>/...?node-id=<id>`. Returns `{ fileKey, nodeId } | null`. Same shape used by direction B's importer.
- **Server-side fetch.** `apps/docs/app/api/figma/context/route.ts` — POST `{ fileKey, nodeId }`, returns `{ designContext, variableDefs, screenshotDataUrl }`. Internally calls the three MCP tools. Cached in-memory per `fileKey:nodeId` for the lifetime of the route's module.
- **System-prompt block.** New `renderFigmaSeedBlock(payload)` in `apps/docs/app/api/chat/route.ts`, sibling of `renderSelectionBlock()`. Includes the node tree (collapsed JSON), the variable bindings (name + token), and a short "rules" preamble:
  - Map autolayout `VERTICAL` → `<Stack>`, `HORIZONTAL` → `<Row>`, with `gap` from autolayout `itemSpacing` snapped to Tailwind scale.
  - For `INSTANCE` nodes whose `componentName` is in `ALLOWED_COMPONENTS`, use the gradeui import. Variant props lift verbatim.
  - For unrecognised `INSTANCE`s or raw shapes, fall back to closest gradeui equivalent and emit a comment `{/* TODO: <original name> — closest gradeui match */}`.
- **Chip UI.** `apps/docs/components/studio/figma-paste-chip.tsx` — listens for paste events on the chat textarea, runs the URL parser, renders the chip if positive.

### Hard parts

- **Decorative content the structural pass misses.** A frame with custom illustrations, masked images, vector shapes — `get_design_context` describes them as `RECTANGLE` or `VECTOR` with fills, but the seeded JSX won't know what to do with them. **Mitigation:** the screenshot goes to the model as an image attachment alongside the structural pass, so vision can fill the gap. Same trick `playground-scaffold` uses for screenshot-to-scaffold.
- **Frames that aren't real UIs.** A wireframe with rectangle-and-text placeholders interprets reasonably; a poster, a logo, a marketing illustration doesn't. **Mitigation:** check the design context for a minimum "looks like UI" signal (has at least one INSTANCE from the library, OR has autolayout frames more than 2 levels deep). If neither, surface a polite "this doesn't look like a UI frame, want me to try anyway?" prompt.
- **Token mapping in fills.** `get_variable_defs` only returns variables actually bound on the selection. A frame using raw hex everywhere returns an empty payload, and the importer has to either map hex → nearest CSS var or just emit `style={{ background: "#..." }}`. **Mitigation:** for v1, raw hex passes through as `style` props; v2 adds a "snap to token" pass.
- **Caching.** The MCP fetch is ~1–3s. Designer iterating on a frame and re-pasting the same URL shouldn't pay that twice. Per-session in-memory cache is enough.

### Minimum viable scope

What ships in v1 of direction A:

- URL parser + chip
- `/api/figma/context` route
- System-prompt block
- Screenshot attachment to the model
- Component-name lift for nodes whose `componentName` is in `ALLOWED_COMPONENTS`
- Autolayout → Stack/Row mapping
- Raw hex fills pass through as inline styles
- One-line acceptance test: paste the URL of a Card with a Title, Description, and Button → get back `<Card><CardHeader>…<Button>…</Card>`

What's deferred:

- Multi-frame URLs (selection of multiple frames).
- "Snap to token" pass for raw hex.
- Auto-detect "not a UI" frames.

## Direction B — import as a reference layout

Once direction A works well enough that the round-trip is consistently usable, the natural follow-up is: **let me save this as a starter for next time.**

Mechanics:

1. After a successful Figma seed (direction A), Studio shows a "Save as Reference Layout" action above the model's reply.
2. Click → opens a small form: `id` (kebab-case), `tags` (comma-separated), `title`.
3. On submit, the server writes a new `.jsx` to `packages/studio/src/playbook/layouts/scaffolds/<id>.jsx` and appends an entry to `REFERENCE_LAYOUTS` in `playbook/layouts/index.ts`. Runs `pnpm -F @gradeui/studio generate:scaffolds`.
4. Next user who prompts with matching tags gets this layout pinned as a seed.

This is **already the pattern** documented in `STUDIO.md` under "Reference layouts" — direction B is just adding a UI entry-point that uses a Figma frame as the source instead of hand-authored JSX.

Why ship this second rather than first: until direction A's conversion quality is "I'd commit this to a curated registry", elevating it to a reference layout dilutes the existing scaffolds. Once A is solid, B is ~half a day of work.

## Direction C — export Studio → Figma

Massively cheaper than v1 of this plan implied. **We don't build a renderer.** The remote Figma MCP server's `generate_figma_design` already captures a live web URL into editable Figma frames. Studio's Fast Frame preview lives at a real URL inside `apps/docs` (`/fast-sandbox/...`), so the integration is "point `generate_figma_design` at that URL".

### User flow

1. Designer hits an "Export to Figma" button in the Studio header.
2. Modal asks: new file / existing file / clipboard (the three destinations `generate_figma_design` supports).
3. Server calls `generate_figma_design` with the Fast Frame URL for the current design and the chosen destination.
4. Figma opens a browser window (`generate_figma_design` injects a capture script into the page). Designer hits "Entire screen" or "Select element" in the toolbar to capture states. Multiple captures are encouraged — flows + empty states + error states all in one session.
5. Frames land in Figma. Designer hits "Open file" to jump into the file.

### Code shape

- **MCP wiring.** Register the remote Figma MCP server in Studio's server-side MCP client setup. One config block; no plugin to ship, no per-user install.
- **Header button.** `apps/docs/components/studio/figma-export-button.tsx`. Disabled until `whoami` succeeds (i.e. the user has authenticated with Figma via the remote server's OAuth handshake).
- **Server route.** `apps/docs/app/api/figma/export/route.ts`. POST `{ designId, destination: "new" | "existing" | "clipboard", targetFileUrl?: string }`. Resolves `designId` → Fast Frame URL, calls `generate_figma_design`. Streams the tool's progress back to the chat column as a status line.
- **No JSX → Figma node tree code.** Deleted from the v1 plan. The capture is structural — Figma reads the live DOM, not the JSX.

### The client allow-list question

`generate_figma_design` is restricted to a whitelisted set of MCP clients: Augment, Claude Code, Codex by OpenAI, Cursor, Factory, Firebender, VS Code, Warp. Studio-the-product isn't on that list. Two possibilities:

1. **The gate is technical** (the tool inspects the client name and refuses). Then v1 of direction C uses `use_figma` instead — the general-purpose write tool with no allow-list. We'd build the frame tree explicitly: read the rendered DOM via Playwright in our server, walk it, call `use_figma` for each node. Slower (multi-second, network round-trips per call) but no allow-list barrier.
2. **The gate is informational** (Figma has only integration-tested with those clients but the tool works generally). Then we just call it and it works.

**Action:** spike this first thing. One server-side test from `apps/docs` calling `generate_figma_design` on a known URL. If it works, ship direction C as designed. If it errors, switch to `use_figma`-based fallback. Half a day either way.

### What direction C drops vs. v1 of this plan

- No custom Figma plugin to write or distribute.
- No JSX → Figma renderer to maintain.
- No `figma_get_design_system_kit` / `figma_instantiate_component` / `figma_set_instance_properties` orchestration code — that all happens inside `generate_figma_design` automatically.
- No diff mode complexity for v1. `generate_figma_design` always creates new frames; iterating means re-capturing.
- The `data-gds-source="Stack"` round-trip-identity hack is unnecessary because Figma's capture preserves DOM structure including data attributes.

### What direction C still needs from us

- **Stable, deep-linkable URLs for each Studio design.** Today the Studio design state is in `Record<designId, T>` maps in `app/studio/page.tsx` — purely client-side, not addressable. Fast Frame already takes URL params for the source it should render; we'd need to confirm a designer-facing "share this design" URL exists that works without a logged-in Studio session. **Action:** small route audit before starting C.
- **Theme propagation into the captured DOM.** `generate_figma_design` captures whatever the browser renders. If the URL doesn't apply the current theme automatically, captures come out in the default theme. Already handled by Fast Frame's `grade:fast-theme` postMessage protocol — but the export URL needs the theme baked in as a query param, not pushed at runtime.

## Code Connect — the quality dial (optional, plan-gated)

[Code Connect](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/) is a separate Figma feature that publishes explicit mappings from Figma library components to code components. With it in place, when `get_design_context` returns a node, the result includes the *actual* code import path + snippet for that component rather than just its display name. The remote MCP server's `get_code_connect_map` returns this directly.

**What Code Connect would buy us:**

- Direction A's name-match step becomes a lookup, not a guess. `<Button variant="secondary">` shows up because Figma's mapping says so, not because our retrieval matched on `componentName: "Button"`.
- Direction C's instance creation gets the right Figma component without `search_design_system` round-trips.
- Variant prop names match exactly — no translation table for `⚠️ partial` rows.

**Why it's not v1 work:**

- Code Connect's `code_connect:write` PAT scope requires an **Organization or Enterprise** Figma plan. On Starter / Professional, the scope checkbox is hidden in the PAT creation UI. (Confirmed by Figma forum threads.)
- We don't know Pebble Interactive's current Figma plan. **Action:** check this before scoping Code Connect work — if we're on Professional and not moving up, direction A/C's fuzzy-match fallback is the permanent path, not a bridge.
- The fuzzy-match fallback works. `packages/ui/components/ui/*.md` sidecars + `ALLOWED_COMPONENTS` already give us a manifest matching what Code Connect would expose. The plan above doesn't depend on Code Connect existing.

**If we do have Code Connect access:** authoring is `pnpm create @figma/code-connect` per component, dropping the resulting `.figma.tsx` next to the sidecar. The skill `figma-code-connect` (one of Figma's first-party agent skills, listed in the docs) automates most of it. Not a big lift, but pure overhead unless the plan tier supports publishing.

## Sequence summary

1. **Reconnect the desktop server.** Open Figma desktop, enable Dev Mode MCP in preferences. Restores the `mcp__Figma__*` tools used in this session. 5 minutes.
2. **Confirm Pebble's Figma plan tier.** Determines whether Code Connect is ever available. 5 minutes.
3. **Parity audits** (1–2 days, design-led). Component-name parity. Token parity. Lands as two new docs in `packages/ui/`.
4. **Direction A v1** (~3 days). URL parser, fetch route via desktop server's `get_design_context`, system-prompt block, chip UI, screenshot attachment.
5. **Direction A v2** (~2 days). "Snap to token" pass via `search_design_system`, multi-frame URLs, better non-UI-frame detection.
6. **Direction B** (~1 day on top of A). "Save as Reference Layout" entry point.
7. **`generate_figma_design` allow-list spike** (~0.5 day). Test from `apps/docs` against a known URL. Determines whether direction C uses `generate_figma_design` directly or falls back to `use_figma`.
8. **Direction C v1** (~2–3 days). Header button, server route, MCP wiring for the remote server, stable-URL audit. Whichever tool the spike picked.
9. **Code Connect rollout** (later, if plan tier allows). Authoring `.figma.tsx` per component. Upgrades direction A/C quality.

Total to "designer pastes a Figma URL into Studio and gets a working JSX seed": **about a week**, gated by the parity audit which is mostly design work.

Total to "designer hits Export and the current Studio app appears as Figma frames": **about a week and a half**, including the allow-list spike.

## Open questions

- **Does the existing Figma library use the same component names as `@gradeui/ui`?** (`Button` ↔ `Button`, not `Primary Button` ↔ `Button`.) Audit needed.
- **Do Figma variables exist for every gradeui CSS variable, or is the Figma library hard-coded on the theme?** If hard-coded, exports lose theme awareness — frames would always come out in the default Ramp theme.
- **What's Pebble's current Figma plan tier?** Determines whether Code Connect is ever available, which in turn determines whether direction A/C's fuzzy-match fallback is a bridge or the permanent path.
- **Is `generate_figma_design`'s client allow-list a hard gate or a soft one?** Sub-day spike; determines whether direction C ships with `generate_figma_design` directly or via the `use_figma` fallback.
- **Is there appetite for a designer-facing "Studio-in-Figma" inversion?** (Designer stays in Figma, opens a side-panel that lets them prompt and dump the result back into the file via `use_figma`.) Different product, same MCP surface — worth keeping as a future option but firmly out of scope for the plan above.

## See also

- `STUDIO.md` — Studio internals, system-prompt structure, reference-layouts authoring
- `STUDIO-SKILLS-PLAN.md` — companion plan for the Skills surface (parallel track)
- `STUDIO-LAYOUT-PANEL.md` — companion plan for the right-column tabs (the Figma chip lives in the chat column, not the right one)
- `packages/ui/COMPONENTS.md` — per-component Figma status; the source of truth the parity audits start from
- `packages/studio/src/playbook/layouts/index.ts` — the `REFERENCE_LAYOUTS` registry direction B writes into
