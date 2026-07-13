# BYODS Pilot — BrightLocal. Session-5 handoff (end of July 13, session #4)

Paste into a fresh session. Read `CLAUDE.md` first. Ali is in **prep day**
for a live BrightLocal engagement — Studio must be fully productive against
`@brightlocal/ui-components` as a Level-3 external DS. Standing rules:
**parity, not reinvention** (shared agents/kernels with parameterised
seams — never re-rolled variants); *"crack on — don't stop, we are
working"*; curating vocabulary/templates/rules IS the design work.

## ⚠️ Do first

1. **Studio "Loading…" hang — diagnosed, needs Ali's SQL.** The projects
   SELECT now includes `rules_files`; his cloud Supabase lacks the column
   → raw PostgrestError (`[object Object]` overlay) → full-page Loading.
   Ali was given the one-liner (migration `0021_project_rules_files.sql`:
   `alter table public.projects add column if not exists rules_files
   jsonb;`). Confirm he ran it, reload, Studio returns. Lesson (twice
   now): missing column == silent Loading; consider surfacing adapter
   errors instead of throwing raw (P-series persistence rule: "surface
   every write error, never swallow it" — reads too).
2. **Verify the rules harness end-to-end**: distinctive sentence in the
   project's Context field (settings sheet) → send a chat message →
   devtools: `/api/chat` request body's `systemPrompt` should end with
   `PROJECT BRIEF: …`. Wiring: `projectSystemPrompt` memo in
   `app/studio/page.tsx` (after the `setActiveProjectRegistry` effect),
   consumer at `systemPrompt={projectSystemPrompt}`.
3. **Uncommitted file**: `apps/docs/components/studio/projects-menu.tsx`
   — Design System sub-nav gating for external registries (only
   Components + Blocks; General/Colors/Typography/Spacing are gradeui
   theme tooling = Ali's "we don't need the theme selector on external
   DS"). One bug already fixed in it (missing `useActiveRegistry` import
   — a conditional python patch silently no-opped). Verify once Studio
   loads, then commit.
4. Ali-side, still pending: `pnpm -F @gradeui/ui build` (Breadcrumb
   `<li>`→`<span>` fix; the li-in-li hydration noise in every console
   dump persists until the dist rebuilds).

## State of the tree

`main`, 16 commits ahead of origin. Session-4 commits `5f99e6c`…`a3fbe9a`
(git log tells the story; every message is written as documentation).
One uncommitted file (above).

## What session 4 shipped (verified live unless noted)

- **`5f99e6c` padding fix** — BL ships spacing as `@utility` blocks
  (`px-section-md`…) in tailwind-preset.css; preview theme had only
  `@theme`. Full preset now in `preview-theme.generated.ts`
  (`BRIGHTLOCAL_PREVIEW_THEME_FULL`). Also: esm.sh module-load retry
  (fixed the all-screens grid breakage), starter surfaces registry-gated.
- **`72b9a3f` + `6c8b258` Page Skeleton template** — 2nd BL scaffold
  (`registries/brightlocal/templates/page-skeleton.jsx`), authored from
  the LIVE dashboard screenshot, rebuilt on their compounds after Ali
  caught hand-rolled nav: `SidebarProvider > GlobalLayout >
  GlobalLayoutSidebar > Sidebar(Header/Content/Footer)` + `SidebarMenu`,
  footer = `SidebarAccountDropdown` (their story's exact mount). Props
  audited against dist `.d.ts` from unpkg (better type source than their
  MCP). "Start a new screen" dialog now registry-aware (BL scaffolds
  only; Motion/Playground hidden). Fixed a real hooks crash in
  EmptyPreview (early return above useMemo + post-mount registry flip =
  "Rendered fewer hooks" — split into child components).
- **`c71e124` standalone preview** — "Open preview in new tab" resolves
  per registry at click time: external → `/external-sandbox?registry=
  <id>#screen=<key>`; sandbox gained fast-sandbox's localStorage
  handshake (hash key, `{source,name}`, storage-event live updates, tab
  title). Share `/s/` = latest SAVED state (force-dynamic; pinned
  revision overrides).
- **BrightLocal DS MCP** (`https://brightlocal-design-system-mcp.
  vercel.app/api/mcp`, also added to Ali's Cowork):
  - **`ddf27fc` sidecar props typed (#13 ~done)** — v1 harvester wrote
    the props payload's KEYS ("primary?"); rewritten as frontmatter-
    props updater (`harvest-brightlocal-mcp.mjs`): 66/68 sidecars typed
    from `props.primary` + `extractedVariants` (cva enum values),
    deprecations flagged, sub-component props annotated → contracts
    regenerated → real enum/boolean knobs in the settings panel.
    Remaining TODO(review): map.md + sonner.md only (no typed props
    server-side).
  - **`fd17d5a` 29 composition recipes harvested** — page-level patterns
    (PageHeader, StatsGrid, LoginPage, SettingsPage, DataTablePage…)
    that exist NOWHERE in their Storybook (149 titles checked, zero
    matches — an agent-only pattern library; headline client finding).
    Hand-editable: `registries/brightlocal/recipes/*.jsx` (header
    `// Name — description` / `// keywords:` / `// components:`);
    `generate-registry-recipes.mjs` → Record spread into `blocks` as
    group "Recipes".
- **Blocks browser hardening** (`ec83864`, `adce394`, `02a9d2f`) —
  recipe `{/* slot */}` comments render as dashed placeholders
  (preview-only; 8/29 recipes ship placeholder slots); detail preview
  70vh; selection in URL (`?block=<id>`) so browser Back works; grid
  restores scroll on Back; module-shaped recipe sources handled
  (imports stripped multi-line-aware, prelude/first-JSX-tree split
  brace-depth-aware, defined components instantiated, trailing snippets
  preview-dropped); unknown tags resolve against `@brightlocal/icons`
  at runtime (`__icons.X ?? stub` — named imports of missing exports
  kill the module at link time); recipes carry VM-audited `freeIds`
  with name-aware shims (use*→()=>({}) / set*|handle*→noop / else []).
  All 29 mechanically audited; ~26 render fully; Map ones need a live
  Maps API key (badged, inherent).
- **`a3fbe9a` rules harness** (the "can I add rules / .md files?"
  answer):
  - Registry level: `registries/<id>/rules/*.md` → `generate-registry-
    rules.mjs` → `rules.generated.ts` → `prompt.extraRules`. BL's
    AI_USAGE distillation moved to `rules/00-house-rules.md`.
  - Project level: NEW `Project.rulesFiles` ({id,name,content}[]; types
    + both adapters + migration 0021) and — important — the pre-existing
    `context`/`dos`/`donts` were saved by the settings sheet but NEVER
    injected; now appended after the registry prompt as PROJECT BRIEF /
    ALWAYS / NEVER / PROJECT RULES (<name>) stanzas.

## Next queue (Ali's stated priorities)

1. Unbreak + verify harness (above).
2. **Dedicated screens**: Project Settings as its OWN screen, and a
   separate **Rules screen** — full-size editors, multiple named .md
   files. Data layer ready (`rulesFiles` + `handleUpdateProject`); NO
   rulesFiles UI exists anywhere yet. Ali: "we'd have these text areas
   much larger — and even allow multiple .md files".
3. **Recipes → retrieval** (the real prize): recipe `keywords` arrays
   are ready-made retrieval vocabulary — "add a stats row" should pull
   the StatsGrid recipe into context like sidecar refs. Not built.
4. Maybe rename the Blocks surface "Patterns" (industry term; keep
   "Recipes" as BL's own group label). Offered, undecided.
5. #17 anchored pinch zoom (deprioritised). Diagnosis saved in task:
   external-sandbox should emit `grade:zoom-gesture {deltaY, clientX,
   clientY}` like fast-sandbox/page.tsx:1470-89; shared-screen.tsx:
   521-39 already consumes.
6. Parity nit: breadcrumb click-to-select doesn't move selection on the
   external renderer (verify Fast Frame does before building).

## Client findings ledger (upstream BrightLocal report)

- component-meta.json: 23 phantom exports vs the real barrel;
  SidebarAccountDropdown absent entirely.
- data-hook names INSTANCES not components (selection suffix-map works
  around it).
- Hidden Storybook sections (blocks-*, lab-*); lab source minified;
  story-file-local components unrecoverable (standing ask: source).
- **Composition recipes exist ONLY behind the MCP** — zero Storybook
  presence. Drafted recommendation: one source of truth, two renderers —
  recipe files should generate both the MCP responses and a visible
  "Patterns" Storybook section as real CSF stories (executable, a11y +
  snapshot tested; MDX drifts). 8/29 ship placeholder slots nobody
  eyeballed rendering.
- `validate_usage`: dataHook check matches `<Sidebar` as a PREFIX
  (false positives on SidebarProvider etc.); flags barrel imports as
  errors — fine for their prod code, but fights our internal normal
  form (per-file convention applies at export via importMap; do NOT add
  "never barrel" to rules — OUTPUT RULE #3).
- Live logged-in product only partially matches published Storybook —
  drift finding; don't overstate ("or at least not that much").
- Their MCP `get_component_api` is EXCELLENT for props (typed tables,
  extractedVariants, deprecations, styling notes) — our v1 harvest was
  the problem, not their metadata. `get_composition_recipe` enumerates
  via the error path (`suggestions` on a miss; no list tool).

## Gotchas that cost time (don't repeat)

- **Assert python-heredoc patches applied** — a conditional
  `str.replace` on a missing anchor silently no-ops (the projects-menu
  import bug: page died with an opaque exception).
- Escaped backticks inside a template-literal `${}` expression are a
  syntax error ("Expected unicode escape") — nest unescaped or concat.
- `BRIGHTLOCAL_BLOCKS` / `_RECIPES` are **Records, not arrays**: spread
  `{...a, ...b}`; the browser does `Object.values`.
- Missing Supabase column == raw thrown PostgrestError == silent
  full-page "Loading" (twice now: 0020, 0021).
- Re-run the matching generator after editing any hand-editable dir
  (rules/templates/recipes/sidecars); harvesters OVERWRITE their files
  (stories harvester respects the `curated:end` marker; recipes/mcp
  harvesters do not — curate by renaming).
- Red "N" badges on preview tiles are the Next dev overlay INSIDE the
  iframe (hidden via `nextjs-portal{display:none}` in both sandbox
  pages) — not app errors.
- HMR bursts reset the module-scope registry override until the
  project-load effect reruns → screens look "switched/broken"; hard
  reload fixes. Warn Ali when a burst is coming.
- Browser automation: HMR reloads land the studio tab on the Screens
  view and eat queued clicks — re-navigate, then interact. Multiline
  commits: `git commit -F - <<'MSG'`; stale `.git/index.lock` → rm -f.
