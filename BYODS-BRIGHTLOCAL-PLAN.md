# BYODS Pilot — BrightLocal (`@brightlocal/ui-components` + `@brightlocal/tokens`)

## NEXT SESSION — start here (written end of July 11 session)

**State:** Everything below WORKS and is UNCOMMITTED in the working tree. The full pipeline is
live: prompt → BL screens in their true tokens → `/external-sandbox` renderer (esm.sh, seconds,
editor + tiles unified) → click-to-select with data-hook suffix resolution → CodeSandbox export
in their per-file import style. Sidecars are harvested from BrightLocal's own MCP server
(https://brightlocal-design-system-mcp.vercel.app/api/mcp — open, JSON-RPC POST, no auth).
Run with `NEXT_PUBLIC_STUDIO_REGISTRY=brightlocal pnpm dev`.

**Do first:**
1. `git add -p` and commit in chunks: (a) registry contract + B1/B2 plumbing (packages/studio/src/registry, refs.ts, screen-context, chat-sandpack, prompts/system.ts — verify gradeui zero-diff note in system.ts), (b) external renderer (app/external-sandbox, components/studio/external-ds-frame.tsx, studio-canvas wiring, middleware, layout), (c) BL registry data + scripts (registries/brightlocal, generated files, harvest scripts), (d) export parity (chat-export-npm, chat-export guard).
2. Delete the two zero-byte files `apps/docs/public/bl-probe.html` + `bl-live-probe.html` (sandbox couldn't unlink).
3. Add to `BRIGHTLOCAL_EXTRA_RULES` (packages/studio/src/registry/brightlocal.ts): charts always sit in a fixed-height wrapper (`h-64`/`h-80`), never height="100%" in an unsized parent (recharts width(-1) log).

**Open engineering (priority order):**
- Hover outline + measure overlay in `/external-sandbox` select mode (click works; no hover affordance yet).
- Comment pins + viewport-width picker + zoom on `ExternalDsMount` (protocol needs `ext:` messages for each).
- data-gds-source-id mutator path for external screens (source-anchored edits from selection).
- gradeui Breadcrumb bug: `BreadcrumbSeparator` renders `<li>` nested in `<li>` (hydration error; check component vs model composition).
- fast-sandbox vendored v4 build 404-fetches `/tailwindcss/theme` + `/utilities` on every load — pre-existing noise, investigate the vendored build's import resolution.
- Sandpack in-iframe CSS bootstrap (`/external-ds-css.ts` in chat-sandpack) is parked — beacons never fired inside CSB's iframe; safe to strip or leave.

**Client findings for the BrightLocal report:** (1) `component-meta.json` lists 23 phantom
exports (17 subcomponents + 6 roots — Typography/Chart/Map/DatePicker/Resizable/InputPassword);
reconcile log in draft-brightlocal-sidecars.mjs output; fix = generate meta from the barrel.
(2) `data-hook` names instances not components — tooling needs the suffix convention (our
`partSuffixMap`). (3) They already ship an MCP server + AI docs — pitch Studio as the design
surface over the same pipes.

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
