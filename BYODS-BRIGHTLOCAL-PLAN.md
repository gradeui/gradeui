# BYODS Pilot — BrightLocal (`@brightlocal/ui-components` + `@brightlocal/tokens`)

## NEXT SESSION — start here (written end of July 12 session #3)

**State: everything committed through `a325f40`.** Session #3 shipped the two big ones:

- **PER-PROJECT REGISTRIES (live-verified):** `Project.registryId` + migration `0020`
  (APPLIED to the cloud instance), runtime override (`setActiveProjectRegistry` /
  `useActiveRegistry`), all 6 module-scope hazards defused (chat-sandpack templates are
  builder-backed lets on a subscription), per-REQUEST resolution in the chat +
  component-manifest routes, share resolves the project's registry server-side,
  picker in ProjectSettingsSheet. One deployment now serves gradeui and BrightLocal
  projects side by side — plain `pnpm dev`, no env var.
- **COMPONENTS BROWSER (Design System → Components):** per-registry grid → detail;
  "Exactly what the agent receives" = renderComponentRefsBlock({onlyFor}) byte-identical
  to the chat route; retrieval aliases; live previews via the registry's own renderer
  (lazy-mounted, boot shimmer); sidecar path + regen command per component.
- **BL CANONICAL EXAMPLES:** Storybook harvest fixed (id scheme `ui-components-*--docs`,
  anti-wedge waits) and RUN — 62/68 sidecar bodies now carry their Show-code JSX, riding
  every refs block. snippetToApp renders them live (import hoisting, prelude/JSX split,
  type-arg stripping, truncation skip; 147/157 blocks compile — 2 non-JSX API demos +
  8 truncated). Breadcrumb li-in-li fixed (span separator, both copies).

**Next up (agreed order):** (1) finish #13 — type the TODO(review) props (flows straight
into contracts) + re-harvest with a smarter MAX_CHARS so the 8 truncated blocks preview;
(2) anchored pinch zoom (#17 — diagnosis in the task: speak grade:zoom-gesture
{deltaY,clientX,clientY}; shared-screen's anchored session already consumes it);
(3) external starters (#15); (4) sidecar EDITING from the components page (dev-only
write route) — Ali wants to author compound-card examples there.

---

## Session #2 handoff (July 11) — superseded above, kept for context

**State:** Everything is COMMITTED (`bfbf93f`…`7166404` + the active-registry follow-up). Session #2
shipped full editor parity for external screens, all verified live in-browser:

- **Selection parity** — `/external-sandbox` mounts the REAL `installStudioSelectionAgent`
  (hover ring, persistent ring + corner handles + dimension badge, sibling outlines, Escape).
  Two registry seams parameterised on the agent (`partAttribute`, `resolveComponentName` via
  suffix map), defaults keep gradeui byte-identical. Dimension badge is now viewport-aware
  (flips above near the fold) in ALL renderers. Select-mode state replays on `ext:ready`
  (boot race fixed).
- **Per-registry contracts** — `RegistryContractSpec` (JSON-safe, registry rule 1) on
  `components.contracts`; `generate:brightlocal-contracts` transforms the 68 sidecars →
  `contracts.generated.ts`; `apps/docs/lib/registry-contracts.ts` converts specs → zod
  ComponentContracts at the edge. Inspector lookups all go through the registry seam — BL
  Button shows BL's `default|sm|lg`, never gradeui's by name collision. Non-gradeui registry
  without a spec ⇒ null, never another DS's contract.
- **Source-anchored edits** — `injectSourceIds` runs at the external push boundary
  (deterministic+idempotent ⇒ ids agree with the mutators' own pass). Breadcrumb chain,
  sibling overlays, panel mutations (verified size sm→lg round-trip + autosave) all live.
- **Viewport + zoom** — `ExternalDsMount` consumes the artboard camera (device presets ×
  effective zoom incl. Fit); style-driven sizing so the iframe survives preset flips.
  Pinch/ctrl+wheel forwards out as `ext:zoom-gesture` (UNANCHORED — see below).
- **Comments** — same agent captures for comment mode (page-side routing);
  `CanvasCommentPinsOverlay` reused as-is (same-origin iframe, source-id anchors).
- **Share** — `ExternalIframeHost` extracted from `ExternalDsMount` (the FastIframeHost
  split); `/s/` mounts it for external registries with identical framing math; theme selector
  + motion button hidden for external shares. `ext:content-height` feeds the responsive
  artboard. gradeui shares untouched.
- **Vercel build fix** — esm.sh imports via `importUrl()` variable indirection (tsc resolves
  LITERAL specifiers in `import()`).

Run with `NEXT_PUBLIC_STUDIO_REGISTRY=brightlocal pnpm dev`.

**Do first — per-project registry (the agreed next priority).** Goal: different registries at
the SAME url, one per project (gradeui + BL projects side by side). Surface is fully mapped:

1. **Registry lookup**: `getRegistryById(id)` already exported from `apps/docs/lib/active-registry.ts`
   (added end of session). Resolution rule: `project.registryId → getRegistryById → getActiveRegistry()`
   (env stays as deployment default/fallback).
2. **Project record**: add optional `registryId` to `Project`
   (`lib/studio-storage/types.ts:83-118`), to `updateProject`'s patch whitelist (`:363-368`),
   both adapters (`local-adapter.ts:622+`, `supabase-adapter.ts` — `ProjectRow` `:234-248`,
   `rowToProject` `:418-431`, BOTH `*_COLS` strings `:253-256`, create/update writes).
   Migration `0020_project_registry.sql` modelled on `0019_project_context_origin.sql`
   (additive `alter table projects add column if not exists registry_id text`).
3. **Client threading**: NO project context exists — `activeProjectId` is useState in
   `app/studio/page.tsx:447`, prop-drilled. Either add a tiny ActiveRegistryProvider or thread
   a `registry` prop. The `buildSystemPrompt` memo at `page.tsx:188` has `[]` deps — must
   depend on the active project's registry.
4. **Module-scope hazards (6)** — these evaluate at import, before any project exists:
   `studio-walker-register.ts:34`, `fast-sandbox/page.tsx:131`, `external-sandbox/page.tsx:47`
   (iframe: pass `?registry=<id>` on the src, read `useSearchParams`/location), 
   `chat-sandpack.ts:27` (`ACTIVE_REGISTRY` const — biggest refactor: make the consumers take
   a registry arg), `chat-export-npm.ts:41`, `stage-b-inspector.tsx:76`.
5. **Server routes**: `api/chat/route.ts:442` + `api/component-manifest/route.ts:52` call
   `getActiveRegistry()` server-side — add `registryId` to the request bodies
   (`studio-chat.tsx:447-475` builds the chat body; use the `settingsRef.current` pattern).
6. **Share**: `/s/[token]/page.tsx` already fetches the `projects` row (`:162-166`) — add
   `registry_id` to that select, pass a `registry`/`isExternal` prop into `SharedScreen`
   (replace the env check at `shared-screen.tsx:~223`).
7. **UI**: registry picker in `ProjectSettingsSheet`
   (`components/studio/project-settings-sheet.tsx`) + optionally on `NewProjectDialog`.
   Registry-keyed caches are already fine (refs + contracts key by `registry.id`).

**Then (priority order):**
- **Anchored pinch zoom on the external renderer** — Ali's explicit ask: the fast renderer
  zooms FROM the pinch point (zoom-to-cursor; `FocusedFastMount` owns the camera and anchors
  each `zoomBy` tick at the pointer before calling `artboard.zoomBy` — study that wiring
  properly, incl. the `grade:zoom-gesture` forwarding + pan compensation). The external
  `ext:zoom-gesture` currently forwards a bare factor ⇒ zooms from origin. Forward pointer
  coords in the message and replicate the anchor math in both the share view and
  `ExternalDsMount` (which has no pan camera yet — may need one for correct anchoring).
- gradeui Breadcrumb bug: `BreadcrumbSeparator` renders `<li>` nested in `<li>` (hydration
  error; check component vs model composition).
- Sidecar review pass: 68 BL sidecars have `TODO(review)` prop stubs; typed props flow
  straight into the contracts via `generate:brightlocal-contracts` (untyped ones are recorded
  as hidden "plumbing" today). Also consider `extends`/prop-inheritance on
  `RegistryContractSpec` (Ali: compound components should inherit e.g. Card's props).
- Starter templates for external registries: starters are gradeui JSX — hide for external
  registries or build per-registry starter sets (BL's Storybook patterns as seeds).
- Comment pins for external SHARES (inline `ext:set-comments` path, or reuse the host overlay
  — it's scale-aware and same-origin) + `ext:set-motion` if BL screens ever animate.
- fast-sandbox vendored v4 build 404-fetches `/tailwindcss/theme` + `/utilities` on every
  load — pre-existing noise, investigate the vendored build's import resolution.
- Sandpack in-iframe CSS bootstrap (`/external-ds-css.ts` in chat-sandpack) is parked — safe
  to strip or leave.

**Client findings for the BrightLocal report:** (1) `component-meta.json` lists 23 phantom
exports (17 subcomponents + 6 roots — Typography/Chart/Map/DatePicker/Resizable/InputPassword);
reconcile log in draft-brightlocal-sidecars.mjs output; fix = generate meta from the barrel.
(2) `data-hook` names instances not components — tooling needs the suffix convention (our
`partSuffixMap`). (3) They already ship an MCP server + AI docs — pitch Studio as the design
surface over the same pipes. (4) NEW: their meta's props lack types (sidecar `TODO(review)`
stubs) — typed prop metadata would make the settings-panel controls fully automatic.
(5) NEW: BYODS "Level 3 entry conventions" the pilot has surfaced so far: public npm +
prebundlable (esm.sh), shadcn-vocabulary tokens, components spread `...props` to their root
(what makes selection + source-anchoring work), a stable part attribute (`data-hook`), charts
need explicit-height wrappers.

---

**Status (July 11, 2026):** Phases 0–2 BUILT (sidecars drafted + `BRIGHTLOCAL_REGISTRY` +
B1 registry-fed knowledge path + B2 de-hardcoded renderers/exporters, incl. `applyRegistryImportStyle`
consuming `package.importMap`). Registry selection: `NEXT_PUBLIC_STUDIO_REGISTRY=brightlocal`
(`apps/docs/lib/active-registry.ts`). Non-gradeui registries auto-pin to the Sandpack renderer
(Fast Frame precompiles only gradeui). Phase 3 BUILT (July 11, second pass): external-DS previews use the
Tailwind **v4 browser build** + a `text/tailwindcss` `@theme inline` bridge (BL components are
authored against v4 — the v3 Play CDN couldn't compile them), tokens CSS inlined via
`runtime.previewCss` (the npm preset import was the Sandpack TIME_OUT), BL fonts (Inter/Poppins/
Geist Mono), Sandpack pin coerced at the top of StudioCanvas (tiles included), View|Edit source
toolbar added to the Sandpack mount. Also: allowlist/sidecars re-grounded in `dist/index.js` —
**component-meta.json lists 23 phantom exports** (17 subcomponents + 6 roots: Typography, Chart,
Map, DatePicker, Resizable, InputPassword); report upstream. **FAST EXTERNAL RENDERER SHIPPED (July 11, evening):** `/external-sandbox` — an
esm.sh-fed isolated renderer (DS prebundled with React externalized onto an import map, screen
sucrase-compiled in-browser, vendored Tailwind v4 build over `runtime.previewCss`). Boots in
seconds and renders BrightLocal true-to-Storybook (verified in-browser). Studio's focused frame
mounts it for external registries via `ExternalDsMount` (`external-ds-frame.tsx`, tiny
`ext:source/ready/error/rendered` postMessage protocol); Sandpack remains the CodeSandbox
export/handoff path — its in-iframe v4 bootstrap (`/external-ds-css.ts`, beacon-instrumented)
never demonstrably ran inside CSB's iframe and is parked, not load-bearing. REMAINING:
external mount lacks the selection/comment agent + viewport chrome (protocol v1); All-view
tiles still mount Sandpack (unstyled); data-hook suffix → component map (finding #2: their
hooks name INSTANCES, not components); sidecar review pass (`TODO(review)`); Phase 5 theming.
Dev toys `public/bl-probe.html` / `bl-live-probe.html` are deletable. Original plan below.

Grounded in a July 2026 audit of the published packages
(`@brightlocal/ui-components@2.20.0`, `@brightlocal/tokens@0.8.0`) and a line-level trace of Studio's
import handling. Companion to `STUDIO-BYODS.md` (this is its first real Level 3 pilot).

## Verdict from the package audit

Best-case Level 3 candidate. Architecturally a sibling of gradeui: Radix + cva + tailwind-merge,
Tailwind v4, public npm, MIT.

| BYODS risk point | BrightLocal reality |
|---|---|
| Theming | **Works.** `@brightlocal/tokens` layers primitives (`--ds-tailwind-colors-*`) → shadcn-standard semantic aliases (`--primary`, `--background`, `--card`, …) → `@theme inline`. Studio's theme engine already writes exactly this vocabulary. Values are hex not oklch — CSS doesn't care. |
| Sidecars | **Mostly a transform.** `component-meta.json` ships 65 components with exports/props/variants/category/description/compound flags, plus `AI_USAGE.md` (house rules) and `deprecations.json`, with `src/` in the tarball. Script the draft; human review is the remaining cost. |
| Selection | **Solved by their convention.** `dataHook` → `data-hook` attribute, required on interactive roots. `registry.selection.partAttribute = "data-hook"`. Their AI rules already force the model to emit it. |
| Preview resolution | Public npm, resolvable. Heavy dep tree (framer-motion, recharts, embla, flubber, react-day-picker, …) — weight, not blockage. CSS entry is `@source "./dist/**/*.js"`, which presumes a Tailwind build scanning their dist (see Phase 3). |
| Security | Fine pre-sandbox-split: first-party-assembled registry from public npm, not an uploaded bundle. |
| License | MIT. No npm auth story needed. |

## The import-style decision (settled)

BrightLocal mandates per-file imports (`@brightlocal/ui-components/button`, "never barrel") for
production bundle size. Studio's engine treats the barrel as its **internal normal form** — both
renderers heal stray subpaths back into it, and the prompt forbids subpaths. These do not conflict:

- **Generation + preview keep the barrel.** Their package exports `.`, so barrel imports render.
  Bundle size is irrelevant inside Fast Frame (precompiled) and Sandpack.
- **Export/handoff translates to their style.** A rewrite pass maps each component to its subpath
  using `component-meta.json`'s per-component `import` field. Their rule is respected exactly where
  it matters (their CI/bundlers), with zero churn to Studio's parsers.

Registry addition this implies: an optional `package.importMap?: Record<string, string>`
(component → subpath), consumed **only** by the exporters. Populate it for BrightLocal straight
from `component-meta.json`.

## What the code trace found (the real B2 surface)

The registry currently feeds **only the prompt**. `buildSystemPrompt` interpolates
`registry.package.name` throughout (`system.ts` L40/L47) — no hardcoded `@gradeui/ui` there.
Every render-time parser hardcodes the string instead:

| Touchpoint | File / line | Hardcoded assumption |
|---|---|---|
| Local/subpath import rewriter | `apps/docs/lib/chat-sandpack.ts` L234, regex L253–254, merge L269 | `@gradeui/ui/[a-z-]+` + `./components/ui/` → barrel literal |
| Auto-import injector | `chat-sandpack.ts` L294, `gradeImportRx` L340–341 | merges into `@gradeui/ui` literal only |
| Sandpack dependency pin | `chat-sandpack.ts` L712–713 | `"@gradeui/ui": "0.10.0"` |
| Fast Frame module resolver | `apps/docs/app/fast-sandbox/page.tsx` L138 (also L178, L253–254) | `path === "@gradeui/ui" \|\| startsWith("@gradeui/ui/")` → precompiled namespace |
| npm exporter | `apps/docs/lib/chat-export-npm.ts` L52–64, L105, L263 | rewrites to `@gradeui/ui` barrel; hardcodes `styles.css` entry |
| HTML exporter | `apps/docs/lib/chat-export.ts` L119–122 | `componentFiles` → `./components/ui/<name>` importmap |

Note: `componentFiles` is legacy for the live preview (only the HTML export consumes it) — B2 is
smaller than the doc's original table implies.

## Phases

### Phase 0 — Content pipeline (no Studio code; start now)
1. **Sidecar generation.** Script: `component-meta.json` + `AI_USAGE.md` + `deprecations.json` +
   `src/` → 65 draft sidecars in the existing frontmatter schema (`props`, `when_to_use`,
   `composes_with`, `aliases`). Human review pass. This is the pilot the BYODS doc predicts will
   harden the sidecar schema — capture schema gaps as they appear.
2. **Draft `BRIGHTLOCAL_REGISTRY`** against the v1 type: `id: "brightlocal"`,
   `package.name: "@brightlocal/ui-components"`,
   `styleImports: ["@brightlocal/tokens/tailwind-preset.css"]`,
   `components.allowed` from meta, `selection.partAttribute: "data-hook"`, sidecars from step 1.
3. **Ingest `AI_USAGE.md`** as prompt guidance (the future `prompt.extraRules` / `designMd` slot;
   until B3 exists, staple it into the registry-fed prompt as a stanza).

### Phase 1 — B1: registry-fed knowledge path
Per `STUDIO-BYODS.md` B0→B1: `refs.ts` per-registry cache keyed by `registry.id`;
`renderComponentRefsBlock`, `relevantComponentNames`, `buildComponentManifest`, screen context, and
`/api/component-manifest` take the registry. Acceptance: with `GRADE_REGISTRY`, output byte-identical
(the zero-diff rule); with `BRIGHTLOCAL_REGISTRY`, the model *emits* correct BrightLocal JSX
(preview still fails — expected).

### Phase 2 — B2: de-hardcode the six touchpoints
Make every literal in the trace table read `registry.package.name` (and version, styleImports):
the two Sandpack rewriter regexes, `gradeImportRx`, the dependency pin, Fast Frame's
`resolveImport`/`isKnownSpecifier`, both exporters. Two-renderer rule applies: every change lands in
BOTH `chat-sandpack.ts` and `fast-sandbox/page.tsx`. Fast Frame decision: BrightLocal is **not**
precompiled, so a non-gradeui registry routes through Sandpack (or the esm.sh tier) — accept slower
first paint for the pilot rather than bundling their lib into the docs page.

### Phase 3 — Preview CSS + fonts
Load `@brightlocal/tokens/tailwind-preset.css` as a `text/tailwindcss` stylesheet in the preview
bootstrap; rely on the Tailwind v4 browser build's DOM scanning for utilities rendered at runtime
(their `@source ./dist/**/*.js` can't run in-browser — verify coverage empirically on the first
10 screens; gaps become a safelist, same mechanism as the `@source inline` contract in
STUDIO-TOKENFIELD). Load their font files for `--ds-font-font-sans` etc. Dark mode: map Studio's
mode toggle to their `.dark` class variant.

### Phase 4 — Export in their idiom
Exporters consume `package.importMap`: barrel → per-file subpaths, `@brightlocal/tokens` preset in
the entry, `dataHook` conventions already in the emitted JSX (prompt-enforced from Phase 0.3).
This is the handoff artifact that makes the client engagement real.

### Phase 5 — Theming depth (optional, after the pilot renders)
Their semantic layer matches Studio's vocabulary, so theme apply should mostly work day one.
Ramp-step overrides map onto their stock-Tailwind primitives (`--ds-tailwind-colors-*`) via the
variables-viewer direction in STUDIO-BYODS. Do nothing here until Phases 1–3 prove out.

## Sequencing against the client engagement

Phase 0 needs no Studio changes and produces immediately useful artifacts (sidecars double as DS
documentation for the client). Phases 1–2 are the real engineering, in the order the BYODS doc
already prescribes — the pilot just gives B1/B2 a concrete acceptance test ("a BrightLocal screen
generates AND renders"). If client work starts before Phase 2 lands, the Level 2 fallback from
STUDIO-BYODS (their tokens + AI_USAGE rules on Grade components) carries vibecoding sessions with
zero new runtime code.
