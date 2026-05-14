# Studio Skills Tab — integration plan

Companion to `STUDIO.md`. Captures the state of the right-column UI as of this plan, the integration options for the new Skills surface, and the call-out questions for Ali.

This document was written without modifying any Studio UI components — those decisions need eyes-on-screen review before they happen.

## Context

What's already built (this session, in `@gradeui/skills` + `@gradeui/media`):

- `@gradeui/media` — `generateImage()` with provider/processor/storage abstractions, content-hash cache. POST `/api/media/generate` + GET `/api/media/[file]`.
- `@gradeui/skills` — five skills: `image-describer` (generation), `fidelity-grader`, `a11y-reviewer`, `brand-reviewer`, `qa-reviewer` (review). Shared `RubricResult` primitive with `deriveVerdict()` policy. POST `/api/skills/run`, GET `/api/skills/list`.
- All skills are SKILL.md + sibling schema.ts directories — prose-first, type-safe, addable by dropping a folder.

What needs to land in Studio to make any of it visible to a user:

- A **Skills surface** in the right column.
- Per-skill input forms (mostly auto-populated from current page state).
- A `RubricResult` viewer (overall score + dimensions + issues + apply-fix affordances).
- Re-run flow that shows in-session score delta.

## The right-column problem

Studio's right column today (see `apps/docs/app/studio/page.tsx` ~line 644) is a runtime conditional, not a tabbed layout:

```tsx
{panelDocked && selection.componentName
  ? <StudioSettingsPanel variant="docked" />
  : <ThemeBuilderPanel />}
```

Memory note (`project_studio_right_panel_tabs.md`) says the planned shape is **Selection** (default: lock / name / comment) + **Settings** (theme picker, component inventory, .md files), with themes editor moving elsewhere. **That refactor hasn't happened yet.**

So adding Skills as a "third tab" can't just slot in — it has to either:

(a) **Wait for the Selection / Settings refactor** and land Skills as one of three tabs at the same time.
(b) **Skip the refactor and add Skills as a standalone surface** (modal, drawer, or fourth column).
(c) **Start the refactor now**, with Skills as the prompt for finally splitting the column.

These have very different scopes. Picking the wrong one wastes a day.

## Option A — wait for Selection/Settings refactor

**Pros**: lands the planned IA in one piece. Skills sits alongside Selection + Settings as peers from day one. No throwaway intermediate state.

**Cons**: blocks Skills until the refactor happens. The refactor itself isn't trivial — it touches the per-design state model in `page.tsx`, the docking flow, the theme builder placement (where does it go now?), and the existing settings-panel-docked code path.

**Best for**: if the Selection/Settings split is "this week" anyway. Otherwise the wait is a soft block on validating skills.

## Option B — standalone surface (modal or drawer)

A "Run Skills…" button somewhere in the Studio chrome opens a full-screen drawer or modal. Lists skills, runs them, shows results. The right column is untouched.

**Pros**: zero refactor. Quick to build. Skills can be validated end-to-end before any IA decision is made. Works fine for the "I want to test against frontier models" use case.

**Cons**: doesn't feel native to Studio's flow — the user leaves the canvas to run a skill instead of running it inline. Apply-fix interactions are awkward without the canvas visible. Re-run delta UX is harder when the drawer hides the page.

**Best for**: if you want to see skills work TODAY without committing to right-column architecture.

## Option C — start the refactor now, Skills is the catalyst

Use this work to drive the Selection/Settings split. Right column becomes a Tabs component with three tabs:

- **Selection** — lock / name / comment (per existing memory, deferred work)
- **Settings** — current `StudioSettingsPanel` content + component inventory + `.md` files
- **Skills** — the new surface

Theme builder gets a new home — possibly its own page (`/themes`), or a docked drawer triggered from the header, or a "Themes" tab if we go to four.

**Pros**: lands the planned IA. Forces the theme-builder relocation decision (which is overdue anyway). Skills + the rest of the planned right-column inventory ship together.

**Cons**: largest scope. Requires deciding the theme-builder relocation. Multiple components to touch.

**Best for**: if Selection/Settings is a known-coming refactor and you want to bundle.

## Recommendation

**Option B → Option C path.**

Build Option B first (standalone modal) because it unblocks skill validation immediately and is reversible. Use what we learn about the panel-result-apply-fix flow to inform the Option C tab design. Then do Option C as a focused refactor when the IA is decided.

This sequencing also means **Option A is dead** — there's no reason to gate skill validation on a refactor of unknown timing.

## Concrete v0 (Option B) build plan

If you sign off on Option B, the work breaks down as:

1. **`SkillsModal` component** (`components/studio/skills-modal.tsx`)
   - Trigger: a "Run Skills" button in the Studio header (next to the existing chrome).
   - Modal layout: left pane = skill cards (from `/api/skills/list`), right pane = selected skill's input form + run button + result.
   - Per-skill input forms: auto-populate `markup` from `activeDesign.appSource`; require URL inputs for `outputImage` (Playwright capture is a follow-up); require `designMd` from a textarea or future design.md loader.

2. **`RubricResultView` component** (`components/studio/rubric-result-view.tsx`)
   - Overall score (large), threshold pill, pass/fail badge.
   - Dimension bars with weights.
   - Issue list grouped by severity, each with description + suggestedFix + Apply button (when `autoFixable`).
   - Re-run button at the bottom; second run shows delta inline.

3. **Apply-fix path**
   - For `autoFixable` issues, the orchestrator (lightweight here — just a switch in the component) deterministically applies the fix to `activeDesign.appSource` via `studio-source-mutator` (already exists, used by SettingsPanel).
   - For non-auto-fixable, copy the suggestedFix to clipboard or open a chat-prefilled message.

4. **In-session run history**
   - `runHistoryByDesign: Record<designId, Array<{ skillId, result, runAt }>>` in `page.tsx`.
   - Used by the modal to compute deltas on re-run.
   - Cleared on tab close. No persistence (per Ali's call).

## Open questions for morning review

1. **Option A vs B vs C?** Recommendation is B → C. Confirm or pick differently.
2. **Output image source.** Skills like `fidelity-grader` and `qa-reviewer` need a screenshot of the rendered page. Options:
   - User pastes an image URL manually (v0).
   - Wire Playwright to capture the Sandpack iframe (proper but non-trivial — Sandpack sandboxing complicates this).
   - Use `html2canvas` from inside the iframe (works for visible viewport, may miss off-screen content).
   - Skip vision-required skills until capture is solved; ship `a11y-reviewer` + `qa-reviewer` (markup-only) first.
3. **Modal vs drawer for Option B.** Modal is simpler; drawer keeps the canvas visible during result review (better for apply-fix UX).
4. **Where does `design.md` come from?** Brand-reviewer needs it. Does the Studio session already have one (per the `project_compose_pipeline.md` memory, design.md sits alongside the page)? If not, where does the user paste/load it?
5. **MCP server scope.** Captured in `project_three_deployment_modes.md` as a deferred next step. If the priority is "test skills against frontier models from Claude Desktop today", that might leapfrog the Studio UI entirely. Worth a quick gut-check.

## What's NOT being built tonight

- Studio UI components (modal, drawer, result view, input forms). All decisions above need confirmation first.
- The `@gradeui/mcp` package. Same reason — naming, exports, transport choice need input.
- Playwright capture path. Non-trivial; needs a side discussion about Sandpack sandboxing.
- Authentication flow changes for BYOT. Future.

## Files touched in this session (for context)

```
gradeui/
├── packages/
│   ├── media/                        (new)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── cache.ts
│   │       ├── providers/gemini.ts
│   │       ├── process/sharp-pipeline.ts
│   │       └── storage/{index,local-tmp,vercel-blob}.ts
│   └── skills/                       (new)
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── src/
│           ├── index.ts
│           ├── types.ts
│           ├── loader.ts
│           ├── runner.ts
│           ├── rubric.ts
│           └── skills/
│               ├── image-describer/{SKILL.md,schema.ts,index.ts}
│               ├── fidelity-grader/{SKILL.md,schema.ts,index.ts}
│               ├── a11y-reviewer/{SKILL.md,schema.ts,index.ts}
│               ├── brand-reviewer/{SKILL.md,schema.ts,index.ts}
│               └── qa-reviewer/{SKILL.md,schema.ts,index.ts}
└── apps/docs/
    ├── package.json                  (added @gradeui/media + @gradeui/skills)
    ├── .env.example                  (added GEMINI_API_KEY, MEDIA_STORAGE_DRIVER, ANTHROPIC/GOOGLE/OPENAI keys)
    └── app/api/
        ├── media/
        │   ├── generate/route.ts     (new — POST)
        │   └── [file]/route.ts       (new — GET, dev-only)
        └── skills/
            ├── list/route.ts         (new — GET)
            └── run/route.ts          (new — POST)
```

To verify the build: `pnpm install` from `gradeui/`, then `pnpm --filter @gradeui/media typecheck && pnpm --filter @gradeui/skills typecheck`. (Media has been verified; skills hasn't been run on your machine yet — it adds new deps so install is needed first.)
