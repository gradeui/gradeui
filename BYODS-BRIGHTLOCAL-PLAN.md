# BYODS Pilot — BrightLocal. Session-6 handoff (end of July 14, session #5)

Paste into a fresh session. Read `CLAUDE.md` first. Ali is mid-engagement
with BrightLocal — Studio is productive against
`@brightlocal/ui-components` as a Level-3 external DS. Standing rules:
**parity, not reinvention**; *"crack on — don't stop, we are working"*;
curating vocabulary/templates/rules IS the design work.

## ⚠️ Do first

1. **Commit the tree.** Session 5 shipped ~25 files, ALL verified live on
   localhost, ALL uncommitted (the Cowork sandbox lost its shell mount to
   the repo mid-session — file edits worked, git didn't). Everything from
   "What session 5 shipped" below is in the working tree. Suggested split:
   rules-screen commit, recipes-retrieval commit, UI-cleanup commit,
   docs/handoff commit.
2. **Verify Ali's generator runs** — he ran
   `generate-registry-templates.mjs` (citations-hub confirmed in
   templates.generated.ts). `generate-registry-rules.mjs` is OPTIONAL:
   rules.generated.ts was hand-synced to match its output (template
   literals instead of JSON strings; same content + the new
   `BRIGHTLOCAL_RULES_FILES` per-file export). Re-running it just
   normalises the format — safe either way.
3. **Quiglet is deliberate.** The Brightlocal-DS project's Context field
   says "The brand mascot is a purple axolotl named Quiglet" and Screen 3
   renders a Quiglet banner + stats row. It started as a rules-harness
   sentinel; Ali kept it as the works-end-to-end demo. Don't clean it up
   without asking.

## State of the tree

`main`, 16 commits ahead of origin + the uncommitted session-5 work.
Session-4 commits `5f99e6c`…`99aef53`.

## What session 5 shipped (all verified live, all uncommitted)

### Session-4 queue cleared
- Migration 0021 ran on cloud Supabase → Studio loads, no silent-Loading.
- **Rules harness verified behaviorally**: Context-field sentinel →
  generation reproduced it (stronger proof than devtools inspection).
- External-DS sub-nav gating verified BOTH ways (BL: Components+Blocks
  only; gradeui: full nav). `99aef53`'s "unverified" flag is cleared.
- `@gradeui/ui` dist rebuilt (Breadcrumb li→span fix live).

### Rules screen (Magic Patterns-style; Ali's toggle request)
- New "Rules" nav item + full-canvas page:
  `apps/docs/components/studio/rules-page.tsx`. Files list left, editor
  right.
- **Design-system section**: the registry's rules/*.md shown per-file,
  read-only, each with an on/off Switch.
- **Project section**: full CRUD — add (kebab-case presets: company.md,
  tone-of-voice.md, glossary.md, ux-rules.md — Ali's "named house files"
  — plus blank), rename, edit, delete, toggle. Char counter warns every
  char is prompt tokens per turn.
- **Persistence with ZERO migration**: `ProjectRulesFile` gained
  `enabled?: boolean` and `kind?: "project" | "registry"`. A registry
  file toggled OFF is stored as `{id: "registry:<fileId>", kind:
  "registry", enabled: false}` inside the EXISTING `rules_files` jsonb
  (absence = on). Both adapters pass the array verbatim.
- **Prompt plumbing**: `buildSystemPrompt(registry, {disabledRuleIds})`;
  `RegistryPrompt.ruleFiles` (per-file split, new `RegistryRuleFile`
  type); `generate-registry-rules.mjs` now emits
  `<ID>_RULES_FILES` + concatenated `<ID>_RULES`;
  `projectSystemPrompt` memo in page.tsx skips disabled files and
  rebuilds the base without disabled registry ids.
- URL: `?section=rules` added to the section allowlist (init parser).

### Rules vs skills — the conceptual frame (Ali's mental model, keep using it)
- **Rules** = always-on, every prompt, terse (glossary, voice, house
  style). **Skills** = load-on-demand via retrieval (recipes, templates,
  vertical playbooks). "Changes how everything looks → rule; about one
  kind of screen → skill." This is DESIGN.md decomposed into includable
  units — Ali's phrasing.
- New BL registry rules (live, individually toggleable):
  `05-product-map.md` (lazy vertical prompts → correct shell/nav/hub
  conventions; splits into per-vertical retrieved files when more
  verticals land), `10-glossary.md` (GBP, NAP, SoLV, geo-grid…),
  `20-voice.md` (reading age ~9, verb-first buttons, error tone).
- New template `templates/citations-hub.jsx` — first vertical hub
  scaffold (page-skeleton shell + citations content per product map).
  In Starters (Ali ran the generator).

### Recipes → retrieval (queue #3 — SHIPPED and verified)
- `packages/studio/src/playbook/components/recipes.ts` — parses
  `// keywords:` / `// components:` headers from registry blocks
  (group "Recipes"), scores keyword phrases against the conversation
  (word-boundary, plural-tolerant, `(?<!\.)` method-call guard, same as
  refs.ts), ranks by distinct hits, **caps at 2 per request**.
- `createScreenContext` stitches winners in as a "COMPOSITION RECIPES —
  use as the STRUCTURAL BASIS" stanza; returns new `recipes: string[]`.
- Chat route metadata suffixes them `"(recipe)"` into the refs chip.
- **Verified live**: "Add a stats row of key metrics above the location
  score" → refs chip showed `StatsGrid (recipe)` → generated a correct
  recipe-shaped stats grid, AND the copy used glossary terms unprompted
  ("Share of Local Voice (SoLV)", "NAP Consistent") — rules + retrieval
  compounding. Applied as a single edit block, 18.5s.
- Explainer for humans: `registries/brightlocal/recipes/README.md`
  (format, retrieval mechanics, curation advice, rules-vs-recipes-vs-
  templates).

### UI cleanup (Ali's live requests)
- Right panel (`project-home.tsx`): theme dropdown + Screens list
  REMOVED — Overview/People/Activity only. (`screens` prop retained for
  activity-trail name resolution.)
- Motion Studio nav row REMOVED from projects-menu ("not going to happen
  any time soon"); "motions" section id kept for URL/storage back-compat.
- **stylesSection clamp** (`stylesSectionEffective` in page.tsx): the
  persisted localStorage sub-section ("general" etc.) leaked the GRADEUI
  theme page as an external project's Design System landing. Now clamped
  to components/blocks when registry ≠ gradeui.
- DS page header copy is registry-aware (no "colours, type, shape" talk
  on external DS).

## Next queue

1. Commit (above), then push.
2. **Dedicated Project Settings screen** — Ali wants settings as its own
   screen like Rules (the sheet's textareas are cramped). Rules screen is
   the pattern to copy.
3. Recipe retrieval refinements: match against the LATEST user message
   (whole-history matching keeps re-shipping a recipe once mentioned);
   use `// components:` to pin those sidecar refs alongside the recipe;
   consider surfacing "why this recipe" in the chip tooltip.
4. **Make the registry override survive HMR** — bit us TWICE today (see
   gotchas). Likely: re-run `setActiveProjectRegistry` in a
   module-load-time replay or subscribe the override to project state
   rather than an effect.
5. Rename Blocks surface "Patterns" (offered, still undecided).
6. #17 anchored pinch zoom (deprioritised; diagnosis in prior handoff).
7. Breadcrumb click-to-select parity on external renderer (verify Fast
   Frame first).

## Gotchas that cost time (don't repeat)

- **HMR burst resets the module-scope registry override** while React
  state survives → the `activeProjectRegistryId` effect doesn't re-fire →
  BL project renders with gradeui pipeline ("renderers are all broken").
  A SOFT navigate does NOT fix it (same-page nav, state survives): only
  `location.reload()` / a real hard reload does. Happens on every edit
  to `packages/studio` (transpilePackages = source-watched).
- Cowork sandbox: the repo's bash mount can drop mid-session (file tools
  keep working via host paths; `pnpm`/`git`/`node` don't). An interrupted
  `pnpm -F @gradeui/ui build` had run `clean` first → empty dist → docs
  dev server "Can't resolve '@gradeui/ui/styles.css'". Rebuild fixes.
- Glob tool is flaky against this repo; Grep works — enumerate dirs with
  `Grep pattern:"."` when Glob returns nothing you know exists.
- esm.sh module-load still fails transiently; the session-4 retry
  ("design system fetch failed — retrying (1/3)") recovers, else reload.
- jsonb columns take extra object fields with no migration — reach for
  that before a new column (0020/0021 both caused silent-Loading when
  the SELECT ran ahead of the migration).
- Recipes/MCP harvesters OVERWRITE their files — curate by renaming.
  The new recipes/README.md documents this for BL's team too.

## Client findings ledger (upstream BrightLocal report)

Unchanged from session 4 (component-meta phantom exports; data-hook names
instances; hidden Storybook sections; recipes exist ONLY behind their MCP
— recommend one-source-two-renderers; validate_usage prefix false
positives; live product vs Storybook drift — don't overstate; their
get_component_api props metadata is excellent). NEW: their recipe
keywords proved out as retrieval vocabulary with zero rework — worth
telling them their MCP recipes are directly agent-consumable, and that
the 8/29 placeholder-slot recipes still ship uneyeballed.
