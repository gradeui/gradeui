# Studio — `/studio` orientation

Studio is the AI-driven page composer that lives at `gradeui.com/studio`. It lets you describe a UI in natural language, watch the model emit a JSX app block, and preview it live inside a Sandpack iframe. This doc is the map for anyone editing Studio internals.

> **Sibling doc:** [STUDIO-SHELL.md](./STUDIO-SHELL.md) covers the chrome — layout (AppShell + body + Sheet), the data model (Project / Team / Org / User), the `StudioStorage` adapter + migration chain, permission resolver, URL history, impersonation / super-admin, and the Studio settings backend selector. This file (STUDIO.md) is about the *model* side: allow-list, Sandpack shims, selection bus, system prompt. If you're working on UI structure, identity, or persistence, go there first.
>
> **Canvas direction:** [`STUDIO-CANVAS.md`](../../STUDIO-CANVAS.md) (repo root) is the design doc for where the canvas goes next — the freeform object layer (screens / images / media placeholders / notes as a scene graph on the existing camera), AI placement via chat tool-calls, the live-frame/poster economics, bounded↔infinite bounds, and the **sandbox origin split** (the security prerequisite before any other-people's-code surface ships). If a task touches multi-object canvas work, camera-adjacent features, or sandbox isolation, read it first.

## File layout

```
apps/docs/
├── app/studio/page.tsx              # The route. Owns the tabs, per-design state maps, chat↔preview wiring.
├── app/api/chat/route.ts            # Server route. Builds the system prompt (incl. refs + selection blocks) and streams the model.
├── components/studio/
│   ├── design-tabs.tsx              # The tab strip (new / rename / close / switch).
│   ├── studio-chat.tsx              # Left pane — message list, input, selection chip, useChat wiring.
│   └── studio-preview.tsx           # Right pane — Sandpack preview, error boundary, select-mode toggle.
└── lib/
    ├── chat-sandpack.ts             # ★ The rulebook. System prompt, Sandpack file shims, allow-list, agent script.
    ├── studio-designs.ts            # Design slot type + id generator. Pure / serialisable.
    ├── studio-state.ts              # Misc chat-settings persistence.
    └── studio-templates.ts          # Starter templates surfaced in the UI.
```

## Things you will want to find

### The allow-list

The canonical source moved into the **playbook package** — see "Playbook — the model's knowledge layer" below for the full picture. Short answer: `packages/studio/src/playbook/components/allowlist.ts` exports `ALLOWED_COMPONENTS`. `apps/docs/lib/chat-sandpack.ts` re-exports it for back-compat (`import { ALLOWED_COMPONENTS } from "@/lib/chat-sandpack"` still works).

`chat-sandpack.ts` is still where the **Sandpack virtual filesystem** lives (`componentFiles`, `pageFiles`, `utilityFiles`). The allow-list and the virtual filesystem must stay in sync — adding a name to `ALLOWED_COMPONENTS` without a matching shim crashes the iframe with "Element type is invalid".

### The Sandpack shims

Same file. The `componentFiles` / `pageFiles` / `utilityFiles` objects are the virtual filesystem handed to Sandpack — stub re-exports from `@gradeui/ui` at paths the model is encouraged to use (`/components/ui/button.tsx`, `/lib/utils.ts`, etc.). If the model keeps inventing a path that doesn't resolve, a shim is usually the fix.

### The in-iframe agent

Also in `chat-sandpack.ts`: `PLAYGROUND_SELECTION_AGENT_TSX`. A TypeScript side-effect module that gets registered as `/selection-agent.ts` in the Sandpack files map and imported by `/index.tsx`. It owns the hover overlay, click capture, and postMessage protocol for the "select element" feature. The protocol is the small set of `grade:*` message types at the top of that constant — keep both sides of the bus (agent + `studio-preview.tsx`) in sync when you change it.

Historical note: this was originally an inline `<script>` baked into `/public/index.html`. Sandpack's CRA runtime dropped inline body-scripts silently (head-level `<script src=...>` worked, body IIFEs didn't), so the agent never executed and the select pill did nothing. Moving it into the bundle graph as a TS side-effect module fixed it. Don't move it back into the HTML without verifying it actually runs inside the remote iframe.

### The system prompt

`buildStudioSystemPrompt()` in `chat-sandpack.ts`. Takes the caller-supplied theme / reference context / selection block and stitches them into the base instructions. When the model starts hallucinating imports or ignoring rules, this is where you tighten the screws.

## Playbook — the model's knowledge layer

`@gradeui/studio` (in `packages/studio/`) owns everything the model is *told* about the design system — the allow-list, the per-component usage notes, and the seedable reference apps. Three primitives, one folder:

```
packages/ui/components/ui/
├── button.tsx                      # the component
├── button.md                       # ◀ sidecar (next to its source)
├── card.tsx
├── card.md
└── …

packages/studio/src/playbook/
├── components/
│   ├── allowlist.ts                # ALLOWED_COMPONENTS, ALLOWED_EXTERNAL_IMPORTS, PINNED_COMPONENTS
│   └── sidecars.generated.ts       # AUTO-GENERATED — do NOT edit by hand
└── layouts/
    ├── index.ts                    # REFERENCE_LAYOUTS registry + MISSING_COMPONENTS
    ├── scaffolds.generated.ts      # AUTO-GENERATED — do NOT edit by hand
    └── scaffolds/
        ├── ecommerce-listing.jsx
        ├── airbnb-listings.jsx
        └── …                        # one .jsx per reference layout
```

Sidecars live in **`packages/ui/components/ui/<name>.md`** so the single-source-of-truth promise holds: the component and its doc change in the same commit, the same PR, the same review. `packages/studio/scripts/generate-sidecars.mjs` reads them all and emits `playbook/components/sidecars.generated.ts` — an inlined-string map so the playbook has zero filesystem deps at runtime (it can be imported by both server and Sandpack-in-iframe code paths). Always edit the source `.md` / `.jsx` and re-run the generator — never edit the generated file.

| You want to… | Edit | Then run |
|---|---|---|
| add a component to the model's allow-list | `playbook/components/allowlist.ts` (the `ALLOWED_COMPONENTS` array) — also add the shim in `chat-sandpack.ts` `componentFiles` | nothing; pure TS |
| document how to use a component | `packages/ui/components/ui/<kebab-name>.md` (next to the `.tsx`) | `pnpm -F @gradeui/studio generate:sidecars` |
| seed a full reference app | `playbook/layouts/scaffolds/<kebab-id>.jsx` + entry in `playbook/layouts/index.ts` `REFERENCE_LAYOUTS` | `pnpm -F @gradeui/studio generate:scaffolds` |

### Component sidecars — `packages/ui/components/ui/*.md`

One markdown file per allowlisted component. YAML frontmatter (name, import, subcomponents, props, when_to_use, composes_with, optional aliases / variants / sizes / notes) followed by a short prose body with one canonical JSX example and (optionally) a block of anti-patterns. The retrieval layer scans the user's prompt against frontmatter `name` + `aliases` and pins the matching sidecar(s) under a "REFERENCE COMPONENTS" block in the system prompt.

**Authoring rules:**

- Keep them tight. ~200 words is the median. The full file goes into the prompt verbatim, every byte costs tokens.
- Lead with frontmatter, not prose. `when_to_use` is the single most-read field.
- One JSX example. Pick the canonical shape, not the kitchen sink.
- Anti-patterns are gold. "DO NOT pass `{lat, lng}` objects" steers the model harder than "Coords are tuples".

### Reference layouts — `playbook/layouts/scaffolds/*.jsx` + registry

Full `<App>` JSX scaffolds the model can be **seeded with** for common app shapes — ecommerce listing, SaaS user editor, data table with filters, music app, TV streaming, confetti celebration, airbnb-style stays. Unlike sidecars (which document a single component), reference layouts are runnable apps. The retrieval pass tag-matches the user's prompt and pins the best layout under a "REFERENCE LAYOUT" block, so the model edits a working scaffold rather than synthesising one from scratch — far less surface area for errors.

**Authoring a new layout:**

1. Drop a `kebab-case-id.jsx` file in `playbook/layouts/scaffolds/`. Single `App` component, `export default App`. The harness drops it into `/App.tsx` verbatim.
2. Run `pnpm -F @gradeui/studio generate:scaffolds`.
3. Append an entry to `REFERENCE_LAYOUTS` in `playbook/layouts/index.ts` — `id` must match the filename, `tags` are lowercased soft-match tokens (think "words the user would say when asking for this").

**Authoring rules** (same constraints the existing scaffolds follow):

- Use ONLY components from `ALLOWED_COMPONENTS`. Anything else fails the Sandpack harness.
- Reach for layout primitives (`Stack`, `Row`, `Grid`, `Flex`, `AppShell`) over raw utility classes — these scaffolds double as training data the model mimics.
- Semantic tokens only: `bg-background`, `bg-muted`, `bg-card`, `text-foreground`, `border-border`. No `bg-blue-500` — strands the layout outside the theme.
- No real images. The Sandpack sandbox has no asset pipeline; use tinted gradients on `MediaSurface` or `Card` (`bg-gradient-to-br from-primary/30 via-muted to-accent/20`) and let consumers swap to `<img>` later.
- Keep scaffolds under ~120 lines. The goal is a runway, not a finished app.

**Parked layouts.** When a layout idea blocks on a primitive that doesn't exist yet, park it in the comment block at the bottom of `playbook/layouts/index.ts` ("Reference layouts we WANT to ship but that depend on a missing component") instead of writing a half-broken scaffold. Pair the entry with the missing primitive in `MISSING_COMPONENTS` directly above. Once the primitive ships, the parked entry becomes a cheap follow-up — author the `.jsx`, lift the entry into `REFERENCE_LAYOUTS`, delete the parked comment. `airbnb-listings` was the worked example of this pattern (parked while Map was missing → shipped alongside `<Map>`).

**Retrieval ordering.** `tags` are exact-substring lowercase matches against the user prompt. When the registry grows past ~15 entries we'll switch to a stemmed index; until then, give every layout 8–15 tags covering synonyms and adjacent domains (`airbnb-listings` tags include `listings`, `real estate`, `fleet`, `logistics` because the same shape applies). Best-scoring scaffold wins; ties broken by brevity.

## Fast Frame — the current renderer (and what it fixes)

Studio's preview no longer uses a Sandpack iframe with a remote npm install. It uses **Fast Frame** — `apps/docs/app/fast-sandbox/page.tsx` — a normal Next route loaded in an iframe by `apps/docs/components/studio/fast-frame.tsx`. The Fast Frame page statically imports the entire `@gradeui/ui` namespace at build time:

```ts
// apps/docs/app/fast-sandbox/page.tsx
import * as GradeuiUi from "@gradeui/ui";
import * as LucideReact from "lucide-react";
import * as Recharts from "recharts";
// …everything the preview can reach for, all eager imports
```

The model-emitted JSX is compiled in the iframe with sucrase, then any `import` paths the snippet uses (`@gradeui/ui`, `@gradeui/ui/...`, `lucide-react`, `react`, etc.) are resolved against those pre-loaded namespace modules. No npm fetch, no Sandpack, no per-compile network round-trip. First page load is one Next chunk; subsequent compiles are instant.

**The big practical difference from the old Sandpack flow:** Fast Frame's `@gradeui/ui` import resolves through the **workspace symlink** (`apps/docs/node_modules/@gradeui/ui` → `packages/ui/`) — not from npm. So adding a component to the barrel and using it in Studio no longer requires a publish. But:

## The dist-rebuild gotcha (current — replaced the old publish-lag)

**Symptom:** You add a new component to `packages/ui/lib/index.ts`, add it to `ALLOWED_COMPONENTS`, restart dev, prompt Studio to use it, and Fast Frame crashes with:

> Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined.

**Why it happens:** Next's module resolver follows `packages/ui/package.json` → `exports["."].import` → `./dist/index.mjs`. Even though `@gradeui/ui` is a workspace dep, Next reads the **built dist**, not source. If you added an export to `lib/index.ts` and didn't rebuild, the dist is stale and the new export resolves to `undefined`. Fast Frame's namespace import is missing the name, the snippet's `import { NewThing } from "@gradeui/ui"` resolves to undefined, React errors.

**What to do about it:**

1. **Default workflow when adding a new component:** run `pnpm -F @gradeui/ui dev` in a second terminal alongside your usual `pnpm dev`. That spins up tsup in `--watch` mode, which keeps `dist/index.mjs` fresh on every save. With both terminals running, the workspace flow feels like editing source directly.
2. **One-shot fix when dev is already broken:** `pnpm -F @gradeui/ui build` (rebuilds once), then refresh Studio. No need to restart Next dev — its workspace HMR picks up the new dist.
3. **`@gradeui/ui` peer-dep changes** (e.g. adding `maplibre-gl` as an optional peer) require an `pnpm install` at the repo root before the rebuild lands — pnpm has to refresh the workspace's peer-dep graph.

**Rule of thumb:** **whenever you touch `packages/ui` source, the dist is one build behind you.** Run `pnpm -F @gradeui/ui dev` in watch mode for any session that involves editing components.

## Library resolution — the two-tier model (May 2026)

Fast Frame resolves `import`s the snippet emits against a curated set of pre-loaded namespaces. Anything outside that set falls through to a runtime CDN. Two tiers, picked per-import per-render.

### Tier 1 — pre-stamped, instant

Listed in `apps/docs/app/fast-sandbox/page.tsx` at the top of the file (`import * as X from "y"`) and again in the `resolveImport(path)` switch. The current curated set:

- React essentials: `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`
- DS itself: `@gradeui/ui`, `@gradeui/ui/...` (subpath-aware)
- Icons + viz: `lucide-react`, `recharts`
- Styling utilities: `clsx`, `class-variance-authority`, `tailwind-merge`
- Animations + celebrations: `motion`, `motion/react`, `canvas-confetti`
- Rich text: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-mention`, `@tiptap/extension-placeholder`
- Drag + drop: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Long-tail clones: `react-virtuoso` (virtualised lists), `react-hotkeys-hook` (global shortcuts), `@tanstack/react-table` (headless data tables), `@radix-ui/react-context-menu` (right-click), `@radix-ui/react-toolbar` (TipTap toolbar)
- Plus the `@/lib/utils` aliases for `cn`

**Why pre-stamp:** instant resolution (no network round-trip per compile), real TypeScript types in the docs site, deterministic bundles, predictable cold-start. Every dep adds to the iframe's initial chunk — adding a library is a real bundle cost, so the set stays curated.

**When to add a library to Tier 1:** if the model needs it on a substantial fraction of generations (Linear / Notion / Kanban clones, data-heavy dashboards), or if the CDN fallback transforms it badly (Node-API-dependent packages, packages with CSS imports the CDN doesn't bundle).

To add one: install the dep in `apps/docs/package.json`, add the eager `import * as X from "y"` to `fast-sandbox/page.tsx`, add the `if (path === "y") return X;` branch to `resolveImport`, add the specifier to `KNOWN_TIER_1` (so the Tier-2 pre-resolver knows to skip it), add it to `ALLOWED_EXTERNAL_IMPORTS` in `packages/studio/src/playbook/components/allowlist.ts` (so the system prompt tells the model it's available), and optionally author a `6x` rule in `playbook/prompts/system.ts` if there's non-obvious usage guidance.

### Tier 2 — esm.sh runtime fallback

For specifiers the resolver doesn't know, Fast Frame falls through to `https://esm.sh/{specifier}`. esm.sh transforms npm packages into browser-native ESM on the fly. Pre-resolution happens in `preResolveUnknownImports(source)`, called from `renderCompiled` before `compile()` runs:

1. Scan the source with a regex for `import ... from "..."` + `import("...")` + `require("...")` specifiers.
2. For each that isn't in `KNOWN_TIER_1` and isn't already in `CDN_CACHE`, kick off `import("https://esm.sh/{specifier}")` in parallel.
3. Await all CDN imports. Failures land in `CDN_CACHE` marked with `__cdn_error__`.
4. Then sucrase compiles + `require()` runs synchronously, looking up the cache.

**Cost:** ~200–800ms cold per library on first use per session, then instant for the rest of the session. Subsequent compiles in the same iframe re-use the cache.

**Failure mode:** the package's CDN transform fails. The user sees `Fast sandbox: esm.sh failed to load "weird-pkg": ...` in the error panel. They either pick a different library or you pre-stamp it in a follow-up.

**When NOT to rely on Tier 2:** anything security-sensitive (you're running arbitrary code from a CDN in the user's browser); anything where the user will be offline; anything needing precise version pinning across deployments. For those, pre-stamp instead.

### Sandpack — the parity-check Tier (still in the codebase)

`apps/docs/components/studio/sandpack-frame.tsx` mounts the Sandpack-backed renderer. It npm-installs whatever the snippet imports inside the browser via a real bundler. Slower (multi-second cold start) but maximally permissive. Kept around so you can flip the renderer over when Fast Frame + Tier 2 fail and you need to confirm whether it's a Fast Frame quirk or a real package incompatibility.

## The publish-lag gotcha (still applies to two routes)

Two routes have NOT migrated off Sandpack and still consume `@gradeui/ui@latest` from npm:

- `apps/docs/app/layout-preview/[id]/page.tsx` — the chromeless route Playwright hits for thumbnail capture (`scripts/capture-layout-thumbnails.mjs`). Won't render a layout that uses an unpublished component.
- `apps/docs/components/studio/sandpack-frame.tsx` — `FocusedSandpackMount` + `TileSandpackMount`. Kept around as a **parity check**: when something looks suspicious in Fast Frame, you can flip the renderer over and confirm whether the bug reproduces against a real `npm install @gradeui/ui` in a real bundler. Not the default path, not deleted on purpose.
- Anything else still wrapped in `SandpackProvider` (grep for it before assuming).

For those routes, the original gotcha holds: a barrel addition isn't visible until a changeset is cut, the release workflow runs, and the new version is live on npm. The mitigations are the same as before — gate the names in `ALLOWED_COMPONENTS` until publish, or pair the barrel addition with a release. Note though: this only matters for Sandpack-backed surfaces. For day-to-day Studio dev (Fast Frame), no publish needed.

## The two-agent split (gotcha for postMessage protocols)

Studio's preview iframe runs **one of two** in-iframe agents depending on the active renderer. Both speak `grade:*` postMessage protocols to the canvas, but the handler implementations live in **two completely separate files** and they do NOT share code:

| Renderer | Handler location | Where the agent code is shipped |
|---|---|---|
| Fast Frame (default) | `apps/docs/app/fast-sandbox/page.tsx` → the inline `handleMessage` switch | Runs as a regular Next route inside the iframe — handler is plain TS in the page component |
| Sandpack (parity / thumbnail capture) | `apps/docs/lib/chat-sandpack.ts` → `PLAYGROUND_SELECTION_AGENT_TSX` template string | Source is a string constant in the parent; Sandpack ships it as `/selection-agent.ts` into the iframe |

**The trap:** Adding a new `grade:*` message type? You must add the handler **in both files** if you want the protocol to work across renderers. Doing only one and switching renderers will silently fail with timeouts or no-op behaviour, because the iframe just sees an unknown `data.type` and skips it.

Protocols currently handled in **both** places (keep them in sync):
- `grade:fast-compile` carries an optional `modules` field — **project shared components** ({name → raw JSX module source}, from the `shared_components` table, migration 0025). The sandbox compiles each lazily and resolves `import { X } from "@project/components"` from them (see "Shared components" below).
- `grade:select-mode` / `grade:clear-selection` / `grade:selected`
- `grade:set-fidelity` (wireframe / full toggle)
- `grade:set-motion` (global motion toggle — stamps `data-motion="off"` on `<html>`; lib/motion)
- `grade:collect-media-sources` / `grade:media-sources` (Fill-images flow request/response)
- `grade:set-media-urls` (Fill-images URL-map push back into the iframe)
- `grade:set-media-pending` (Fill-in-flight sourceKey set — replace semantics; drives MediaSurface's placeholder shimmer via `window.__gradeMediaPending` + the `grade:media-pending-updated` event)
- `grade:zoom-gesture` (sandbox → parent: trackpad pinch / ctrl+wheel forwarded as `{ deltaY, clientX, clientY }` — pointer coords are iframe-local CSS px so the parent can anchor the zoom at the cursor. Handled by `FocusedFastMount` (which counter-translates its camera, then calls `useArtboardZoom.zoomBy`) and by the share view (centred zoom, no camera))

Protocols Fast Frame uniquely owns (don't mirror to Sandpack):
- `grade:fast-ready` (iframe-bundle-loaded ping)
- `grade:fast-compile` (sucrase compile + render trigger)
- `grade:fast-theme` (CSS-var update)
- `grade:fast-error` (sandbox surfaced a compile/runtime error)

Rule of thumb: if you find yourself editing the Sandpack agent template string, also open `fast-sandbox/page.tsx` and apply the same change. The default user experience runs through Fast Frame — Sandpack edits alone are invisible until someone explicitly flips the renderer over for a parity check.

## Per-design state model

`apps/docs/app/studio/page.tsx` holds a few `Record<designId, T>` maps:

- `messagesByDesign` — chat history per tab.
- `appSourceByDesign` — last emitted JSX block per tab.
- `selectionByDesign` — currently-captured element per tab (highlight-and-comment v1).

Chat _hooks_ (`useChat`) are keyed by `design.id`, so AI SDK internal state survives tab switches without us duplicating it.

When you add new per-design state, mirror the pattern:

1. Add a `Record<string, T>` map in `page.tsx`.
2. Clear the slot in `handleCloseDesign`.
3. Pass the current tab's value + a setter-callback down to whichever pane owns it.

Don't bolt new fields onto the `Design` type in `studio-designs.ts` — that type is deliberately minimal so it stays portable to a future persistence layer.

## Highlight-and-comment (a.k.a. "select mode")

### What it does for the user

Once the preview has rendered something, the header gets a **Select** pill next to the Preview/Code toggle. Flip it on, hover any element in the live preview, and the agent paints a primary-coloured outline around whatever you point at. Click once:

1. The outline freezes on that element.
2. A chip appears above the chat input showing `◎ <tag> "<text preview>" ×`.
3. Select mode auto-exits so you can keep interacting with the preview.

Type a follow-up prompt and send. The server attaches the element's outer HTML to the system prompt as a "TARGETED EDIT" stanza, so the model knows which part of the composition you want changed. The `×` on the chip drops the selection without sending.

The overlay is pointer-events-none and ignores `<body>`, `<html>`, and `#root` so you can't accidentally "select the whole frame". Outer HTML is truncated at ~500 chars before it leaves the iframe.

### Wire protocol (v1)

Parent → iframe:

- `{ type: "grade:select-mode", enabled: boolean }` — turn the hover overlay on/off.
- `{ type: "grade:clear-selection" }` — the parent no longer cares about the current pick; drop the outline.

Iframe → parent:

- `{ type: "grade:agent-ready" }` — fresh iframe boot; parent replays current state so a reload inherits the last select-mode + selection values.
- `{ type: "grade:selected", selection: { tag, text, outerHTML, rect, part?, componentName? } }` — user clicked something in select mode.

#### Component-aware selection (v1.1)

Any DS component that renders a `data-gds-part="<kebab-name>"` attribute on its root (see `packages/ui/` — `three-scene`, `media-surface`, `video-player`, `shader-preset-picker`, `shader-preset-preview` already do) becomes an **identifiable unit** for selection. When the user hovers/clicks anywhere inside such a component, the agent walks up the DOM via `el.closest('[data-gds-part]')` and uses _that_ ancestor as the selection target:

- `part` — the raw attribute value (kebab-case, e.g. `"three-scene"`).
- `componentName` — the kebab-case name converted to PascalCase (e.g. `"ThreeScene"`). Matches the JSX tag the model is likely to see in the current app source.
- `rect`, `outerHTML`, `text`, `tag` are all sourced from the component boundary too — so the hover outline snaps to the component edge rather than whichever leaf div the mouse is over.

Parent-side consequences:

- `StudioSelection` in `lib/chat-sandpack.ts` carries the two extra optional fields.
- The selection chip in `studio-chat.tsx` prefers `<ComponentName>` over `<tag>` when available (bolder treatment in `text-primary`).
- `studio-preview.tsx` header shows an "Editing `<ComponentName>`" badge while a component is selected.
- `renderSelectionBlock()` in `app/api/chat/route.ts` leads the stanza with `TARGETED EDIT — the user is pointing at a <ComponentName> component …` and instructs the model to locate the matching `<ComponentName ... />` JSX node to edit.

If the user clicks an element that isn't inside any `data-gds-part` subtree, the fields are omitted and the protocol falls back to v1 behaviour (tag + text + outerHTML at the clicked element).

**Convention for new components:** if a component is a worth-editing-as-a-unit building block (big visual surfaces, composites with props that shape behaviour — not primitive `<Button>`/`<Badge>` leaves), add `data-gds-part="<kebab-name>"` to its root element. The Studio selection agent picks it up automatically.

### Data flow

The captured selection flows **out-of-band** in the `/api/chat` request body (not inlined in the user message), which keeps it from polluting the history on follow-up turns. Server-side it's rendered into the system prompt as a "TARGETED EDIT" stanza — see `renderSelectionBlock()` in `app/api/chat/route.ts`. Selection state is per-design (`selectionByDesign` in `app/studio/page.tsx`) and cleared automatically after the message is sent.

## Settings panel — direct prop mutation (v1.2)

Selections with a `componentName` (i.e. picked a DS component with `data-gds-part`) also open a **settings panel** below the selection chip in the chat column. The panel reads the component's prop manifest and renders one control per prop (Select for enum, Switch for boolean, Input for string/number). Changing a control rewrites the current `App.tsx` JSX directly — no LLM round-trip. Sandpack HMRs to the patched source.

### Pieces

| File | Role |
|---|---|
| `apps/docs/app/api/component-manifest/route.ts` | GET endpoint. `?part=<kebab>` or `?name=<Pascal>` → `{ manifest: ComponentManifest[] }`. 30s client cache. |
| `apps/docs/lib/component-refs.ts` | Hosts `buildComponentManifest()` + `parsePropSignature()`. Parses the `props:` strings in each sidecar's frontmatter into structured `{ name, kind: "enum"\|"boolean"\|"string"\|"number"\|"unknown", enum?, optional, defaultValue?, description? }`. |
| `apps/docs/lib/studio-source-mutator.ts` | Pure `updateComponentProp(source, componentName, propName, value)` + `readComponentProp(...)`. Regex-based JSX tag locator + attribute splicer. Returns the original source on ambiguity. |
| `apps/docs/components/studio/settings-panel.tsx` | The panel itself. Fetches the manifest, renders controls, calls the mutator on change. |

### Known limits

- **One instance per file.** The mutator always targets the FIRST `<ComponentName>` opening tag it finds. A design using two `<Button>`s will only ever have one of them under the panel's control. Positional targeting (via the `rect` / `outerHTML` already carried in the selection payload) is the natural next step — not implemented.
- **Kind "unknown" props are hidden.** Function-typed props, React nodes, and generic object types (`Partial<Palette>`, `(ctx) => SceneHandle`) get `kind: "unknown"` from the parser and the panel filters them out. The chat is the escape hatch for those.
- **No AST.** Regex-based splicing copes fine with single-line and simple multi-line JSX, but complex conditional JSX inside the target component will trip it up. Swap in jscodeshift the day this becomes a problem.
- **Expression values round-trip lossy.** `controls={isOpen}` reads as "on" in the panel; toggling it off rewrites to `{false}` and loses the original `isOpen` binding. The panel treats expression-valued props as display-only when possible.

### Adding settings-panel support for a new component

1. Add `data-gds-part="<kebab-name>"` to the component's root element.
2. Make sure the component's sidecar (`packages/ui/components/ui/<name>.md`, next to the `.tsx`) declares its props in the frontmatter using one of the recognised shapes — the parser comments in `parsePropSignature()` in `lib/component-refs.ts` list them. Quoted-string unions, numeric unions, `boolean`, `number`, `string`, and `parens enum` all work out of the box. Function types and object types land as `kind: "unknown"` (hidden).

### Docked vs. inline variant (v1.3)

The panel now accepts a `variant: "inline" | "docked"` prop. `inline` is the original spot in the chat column — compact, collapsible. `docked` fills the right column and is always expanded.

`app/studio/page.tsx` owns the choice via `panelDockedByDesign: Record<designId, boolean>`. A `Dock →` affordance in the inline header flips the flag for the active design; an `Undock` button in the docked header flips it back. When docked, the inline copy is suppressed so the user isn't looking at two copies, and the right column renders the settings panel **instead of** `<ThemeBuilderPanel />`. The state is per-design on purpose — one design tab might be hero-focused and want the big panel; another might be mid-theming and want the builder back.

No new server state — docked is a pure UI flag on the parent. The mutator and manifest fetch paths are identical in both variants.

## Theme-aware media components — the `data-gds-theme` signature (v1.4)

CSS hot-reloads alone don't fire `MutationObserver`s. That's a problem for any in-iframe component that reads `var(--primary)` off the host and resolves it to a colour imperatively (THREE.Color values, canvas contexts, etc.) — the computed colour only re-resolves when something triggers the observer.

The fix: `buildPlaygroundThemeOptionsTsx` now computes a short dbj2 hash of the serialized light+dark var strings and writes it to `document.documentElement.dataset.gdsTheme` inside the wrapper's `useLayoutEffect`. Any var value change (hue, chroma, radius, any slider at all) changes the file text of `/theme-options.tsx` → react-refresh re-executes → effect runs → attribute changes → MutationObservers fire.

`<ThreeScene>` already watches that attribute (see `themeObserver.observe(document.documentElement, { attributeFilter: [..., "data-gds-theme", ...] })` in `packages/ui/components/ui/three-scene.tsx`). New theme-sensitive media primitives should piggyback on the same attribute instead of inventing their own signal.

## Timeline view mode (v1.5 — reads shots, not yet editable)

The preview toggle is now `Preview | Code | Timeline` (`view` union widened in `studio-canvas.tsx` + the page; it collapses to `preview` for the renderer, so the screen stays live above the dock). Timeline docks `TimelineDock` (`components/studio/timeline-dock.tsx`) under app-main in Fit view.

The dock **populates from the focused screen's source** — `extractCameraShots(appSource)` reads the `<ScreenAnimator>` shot list (inline `shots={[...]}` or `const SHOTS=[...]`), the same JSON the iframe animates from. `serializeShots` / `replaceShotsInSource` are the write half (round-trips edits back through the source-mutation channel), wired-ready but not yet driven by a drag UI.

Two views of the same data, toggled in the header: **Events** (foci-and-noodles — each shot a focus node, transitions as connectors) and **Timeline** (clips on a time ruler, sized to duration). Both are read-only today.

Design model + roadmap live in [`STUDIO-DIRECTOR.md`](../../STUDIO-DIRECTOR.md) (foci-and-noodles, event-anchored camera, props-in-source ringfencing, the per-screen vs FlowCanvas scales). Next slices: parse `DemoStage` `SCRIPT` reveals into a second track, a scrub playhead that seeks the live preview, and per-event editing (or prompt-to-edit).

## Theme selector — interim state (REVISIT)

The right panel's full **Theme tab** (picker list + builder controls — mode, hues, typography, shape, components) is **hidden behind a flag** as of June 2026: `SHOW_THEME_TAB` in `apps/docs/components/studio/studio-right-tabs.tsx`. The experience wasn't demo-quality — visually rough and not quite working — so it's parked rather than shown.

What's in its place: a compact **theme dropdown at the top of the right panel** (`ThemeDropdown` in the same file), a direct port of the share view's theme menu (`shared-screen.tsx` — swatch + name + chevron, brand-colours-only swatch). It rebases the page-level `ThemeBuilderProvider` draft exactly like `ThemePickerSection` did, so picking a theme re-skins the previewed screens only, never the docs chrome.

**This is a stopgap.** The theme selector needs a proper design pass:

- Decide what the full theme-editing surface should be (the hidden tab's builder controls are all still wired and working — it's the presentation that's wrong, not the plumbing).
- The dropdown only switches between registered themes; it exposes none of the builder (hues, type, shape, density). Fine for demos, not for actual theming work.
- When the redesign lands, either flip `SHOW_THEME_TAB` back on with the new tab content, or replace the tab model entirely. `ThemeTabContent` + `ThemePickerSection` are kept intact in the codebase for that moment.
- **Picking a theme wipes builder undo/redo** — by design: the pick goes through `builder.rebase(...)`, which sets a new history anchor (dirty dot / reset / undo are all defined relative to the picked theme, so the pick is a baseline change, not an edit). Harmless today because the builder controls are hidden so nothing creates history — but when they come back, guard the picker: disable it (or confirm-before-switch) while the builder is dirty, so a theme pick can't silently torch edits. Note the share view (`shared-screen.tsx`) doesn't have this problem because its picker is pure view state (`setActiveThemeId`) — there's no draft to lose. Alternative for the redesign: model the pick as a full-input history entry so undo survives theme switches, at the cost of re-anchoring logic for dirty/reset.
- The broader theme contract/remix/community direction lives in [`STUDIO-THEMES.md`](../../STUDIO-THEMES.md) — the redesigned selector should be planned against that doc's `ThemeInput` model.

## Future work / known limits

Things deliberately out of scope for v1 of highlight-and-comment, captured here so they don't get lost:

- **One element at a time.** The agent ignores multi-select (shift-click, drag-rect). If users start asking for "change these three buttons at once", model them as a `Selection[]` rather than a single slot.
- **Shallow context.** Only the clicked element's `outerHTML` is shipped. No parent, no siblings, no ancestor chain. If model edits start missing the surrounding layout intent, extend `PLAYGROUND_SELECTION_AGENT_TSX` + `renderSelectionBlock()` together.
- **Hard 500-char truncation.** Fine for buttons/chips; tight for cards or forms. Either raise the cap or swap for token-aware truncation before the block hits the system prompt.
- **Selection auto-clears after send.** There's no "pin" mode — pick again if you want to iterate on the same element over multiple turns. A chip-level padlock + an early-return on `onClearSelection` in `studio-chat.tsx` `handleSend` would cover it.
- **No visual confirmation in the chat stream.** The chip disappears on send and the assistant's reply doesn't quote the targeted element back. Fine for now; worth revisiting if users start losing track of what they aimed at.

## Dev workflow notes

- **You do not need to restart dev after editing `chat-sandpack.ts` or `app/api/chat/route.ts`.** Next's HMR re-reads the route module per request.
- **You do need to refresh the Studio tab (or "New design") after an error state** — Sandpack holds onto the crashed iframe until the provider remounts.
- Runtime errors inside the preview surface in `SandpackErrorBoundary`; the raw `@codesandbox/sandpack-react` error shape is unfriendly, so we normalise it there.

## See also

- `gradeui/CLAUDE.md` — monorepo orientation (tiering model, publish pipeline, repo-wide pitfalls)
- `packages/ui/CLAUDE.md` — component-layer reference (the model's prompt inherits a lot of its rules from this file's conventions)
- `packages/studio/src/playbook/layouts/index.ts` — the authoritative `REFERENCE_LAYOUTS` registry + `MISSING_COMPONENTS` parking lot. The header comment in that file is the long-form authoring rulebook; this STUDIO.md gives you the orientation, that file gives you the line-by-line constraints.
- `packages/studio/src/playbook/components/allowlist.ts` — `ALLOWED_COMPONENTS`, `ALLOWED_EXTERNAL_IMPORTS`, `PINNED_COMPONENTS`.
- `packages/ui/MAP.md` — worked example of a pre-implementation design doc; same pattern works for any non-trivial new primitive.

## Shared components (`@project/components`)

Project-scoped reusable JSX modules — an `AppLayout`, a `Stepper` — stored in the `shared_components` table (migration `0025`), one component per row (`name` = the export/import name; compound sub-parts live inside the module). Screens import them via the ONE stable specifier `"@project/components"`. Authoring goes through the MCP tools (`save_shared_component` / `list` / `get` / `delete`); Studio loads them read-only per project (`listSharedComponentSources` on the storage adapters).

Resolution per surface — the sources are DATA and must travel every channel the screen source travels:

| Surface | Channel | Resolver |
|---|---|---|
| Studio canvas / live embed / share view | `sharedModules` prop → `FastIframeHost` → `modules` on `grade:fast-compile` | `fast-sandbox/page.tsx` lazy module cache (duplicate kernel — keep in sync with the core) |
| Flat render (`/e/<token>?flat=1`, posters, `preview_image`) | `FlatScreen sharedModules` prop | `setProjectModules()` in `lib/studio-render-core.tsx` (the `registerImportResolver` seam) |
| MCP interactive View | `structuredContent.sharedComponents` | same core seam via `preview-view/view.tsx` |
| Sandpack (parity / BYODS-pinned) | `buildSandpackFiles({ sharedModules })` | mounted as `/shared-<Name>.jsx` + `/project-components.jsx` barrel; specifier rewritten to the barrel |
| CodeSandbox export | `openInCodeSandboxNpm({ sharedModules })` | real files `src/shared/<Name>.jsx` + `src/project-components.jsx` |

Both kernels resolve the namespace LAZILY (per-property compile with a cycle guard), so unused components cost nothing and mutual imports only fail on true circular initialization. Editing a shared component takes effect on next render — screens store no copy. Known gap: the standalone-HTML export (`chat-export.ts` data:-URL importmap) does not ship shared modules yet.

### Known limits + direction (Aug 2026)

- **Stage 1 SHIPPED (Aug 2026)** — boundary selection + visibility. See [`STUDIO-COMPONENTS.md`](../../STUDIO-COMPONENTS.md) (repo root) for the full model, the three-wrapper sync rule, and the gotchas. Historical framing below predates it:
- **Selection stops at the boundary.** `injectSourceIds` stamps only the screen's own source, so nodes INSIDE a shared component carry no `data-gds-source-id` and the pick inspector can't path into them. Direction (Figma instance/master model): Stage 1 = boundary semantics — clicking inside selects the usage tag, inspector shows a "Shared component" card (name/description/version + read-only View source), plus a Components list in the project rail next to Assets. Stage 2 = namespaced stamping inside modules + "enter the master" editing that writes to the component row (with the "affects every screen" framing). Settings-panel mutations inside a shared component are undefined until Stage 2 — the mutator only writes screen source.
- **Authoring is MCP-first.** save/list/get/delete_shared_component; Studio reads only.
