# Studio right panel — layout-first redesign

Short plan for moving the Studio right column away from the always-on theme builder.

**What actually shipped (v1):** the right column is now a TABBED shell — `Layout` (default, stage-aware), `Theme` (existing builder, scoped to its own provider so it reseeds on chrome theme switches), `Notes` (per-design free-form text). The popover-based theme editing direction below was an earlier iteration and is preserved here only for context — the tabs design supersedes it. See `apps/docs/components/studio/studio-right-tabs.tsx`.

## Problem

The right column currently always shows `ThemeBuilderPanel` (apps/docs/components/theme-builder/theme-builder-panel.tsx), bound to `bindTo="draft"`, seeded once from the active site theme. It's the wrong default — most of a designer's time in Studio is spent shaping the page, not nudging hues. Theme switching is also only available from the chrome popover, so the panel feels like a fixed editor of one theme rather than a workspace tool.

## Direction

1. **Right panel becomes layout-first and stage-aware.** Content adapts to where the user is in the workflow.
2. **Themes get pushed back into the chrome popover.** `GradeThemeSwitcher` stays as the entry point; we expand it to allow inline editing of the active theme (a per-row "Edit…" affordance that surfaces the existing hue/typography/shape controls inside the popover).
3. **`ThemeBuilderPanel` is retired from the page shell** but the underlying primitives stay — the popover reuses `ThemeBuilderControls` (and the rest of the composable set) so we don't reimplement the form.

## Stage routing

The panel renders one of four stages based on the active design's source + the current selection. Routing logic lives in a new `apps/docs/components/studio/studio-right-panel.tsx`; existing `StudioSettingsPanel` is composed inside it (not replaced).

| Stage | Trigger | What renders |
|---|---|---|
| A | `appSource` is empty/trivial (no JSX, only whitespace, or matches the blank-design template) | **Reference layout starters** — thumbnails of `REFERENCE_LAYOUTS` from `@gradeui/studio/playbook`. Click → seeds `appSource` with the scaffold via `handleSourceMutation`. |
| B | Has source, no selection | **Page-level structure** — AppShell on/off, container width, sidebar position, page padding. Edits via the source mutator's tag-locator. |
| C | Selection has `componentName`, component is NOT a layout primitive | **`StudioSettingsPanel`** (existing). No change to how this stage works; the right panel just delegates. |
| D | Selection has `componentName`, component IS a layout primitive (Stack/Row/Grid/Flex/AppShell) | Same `StudioSettingsPanel` shell, but with the layout-relevant props (`gap`, `cols`, `align`, `justify`) lifted into a "Layout" group at the top. |

Stage detection is a pure function — `resolveRightPanelStage({ appSource, selection })` — colocated with the router component so it's easy to unit-test.

### Empty-design heuristic

Stage A trigger needs to be conservative — we don't want the starter picker reappearing every time the user deletes a heading. Proposed test (in order):

1. `appSource` is `""` or whitespace-only → A.
2. `appSource` matches the canned blank-template string verbatim → A.
3. AST-free token count of JSX opening tags is ≤ 3 AND no `<AppShell>` / `<Stack>` / `<Grid>` / `<Row>` / `<Flex>` present → A.
4. Otherwise → not A.

Cheap regex token count is fine; we don't need real parsing here. The "elevate stage A back" affordance is a small icon button in the Stage B header ("Swap starter…") so users can get back to A explicitly without deleting their work.

## File changes

New files:

- `apps/docs/components/studio/studio-right-panel.tsx` — the stage router. ~120 lines.
- `apps/docs/components/studio/layout-starters-panel.tsx` — Stage A.
- `apps/docs/components/studio/page-structure-panel.tsx` — Stage B.
- `apps/docs/lib/studio-right-panel-stage.ts` — the pure `resolveRightPanelStage()` + heuristic.
- `apps/docs/lib/studio-layout-primitives.ts` — the kebab-set of "layout primitive" component names (`stack`, `row`, `grid`, `flex`, `app-shell`).

Existing files touched:

- `apps/docs/app/studio/page.tsx` — replace the right-column `<ThemeBuilderPanel />` mount with `<StudioRightPanel … />`. Drop the import of `ThemeBuilderPanel` from the page (keep it exported from the theme-builder index — the popover will still use it).
- `apps/docs/components/grade-theme-switcher.tsx` — add the per-row "Edit…" affordance + inline render of `ThemeBuilderProvider` + `ThemeBuilderControls` for the row in edit mode. Separate work-item from the right panel; tracked here so the two halves stay coherent.

Retired (but kept in source for now):

- `ThemeBuilderPanel` mount on the studio page. The component itself stays exported — the popover and any future "open in full editor" affordance can still use it.
- `apps/docs/components/theme-builder/theme-picker.tsx` — stub written in the abandoned in-panel-picker direction; delete.

## Stage A — reference layout starters (first to ship)

`packages/studio/src/playbook/layouts/index.ts` already exposes `REFERENCE_LAYOUTS` as a registry of `{ id, name, description, tags, scaffold }`. The starter panel iterates these and renders a card per layout. Click handler calls `onSourceChange(scaffold)` — same mutation path the chat already uses.

No thumbnails yet — the chromeless `app/layout-preview/[id]` route exists for Playwright thumbnail capture (see `scripts/capture-layout-thumbnails.mjs`) but the captured images aren't surfaced. Stage A v1 ships text-only cards; v1.1 wires the thumbnails in.

## Stage B — page-level structure

Requires reading the design's outer JSX wrapper and writing structured edits back. The existing `studio-source-mutator.ts` is regex-based and "first instance only" — fine for top-level `<AppShell>` since there's always exactly one. Controls to expose v1:

- AppShell present / absent (insert or unwrap the outermost `<AppShell>`).
- Container max-width (`sm` / `md` / `lg` / `xl` / `full`) — maps to a prop on AppShell or to the outermost container.
- Sidebar position (`left` / `right` / `none`) — only enabled if AppShell is present.
- Page padding density (`tight` / `default` / `roomy`) — maps to a className token or prop.

Open question: do AppShell / container props already exist on `@gradeui/ui` at the right granularity? Need a pass through `packages/ui/COMPONENTS.md` before locking the prop names down. If not, the cleanest path is to add them to AppShell rather than encode page padding as freeform Tailwind in the panel.

## Stage D — layout primitive props

Tiny — Stage D is Stage C with a different prop-ordering pass. `StudioSettingsPanel` already reads `ComponentManifest[]` from `/api/component-manifest`; add a `groupOrder` parameter (or a `categoryHint` field on the manifest) that bubbles `gap` / `cols` / `align` / `justify` to the top when the component is a layout primitive. Lookup uses `studio-layout-primitives.ts`.

## Chrome popover — theme editing inline (separate work-item)

Current `GradeThemeSwitcher` is a popover with a list of theme rows. Plan:

- Add a small "Edit…" button on each row (visible on hover, parallel to the existing delete button on user themes).
- Clicking expands the row inline. The expanded view renders a *scoped* `<ThemeBuilderProvider bindTo="site" initial={cloneInput(t.input)}>` plus a stripped-down `<ThemeBuilderControls hideMode />` + `<ThemeBuilderFooter />` set. So edits to a non-active theme would either need to activate it first or write into a draft user theme — leaning toward "activate first" since it matches the popover's switch-and-then-edit mental model.
- Only one row open at a time. Switching expands the new row and collapses the old.

Out of scope for this plan: making theme edits per-row without activating. If we want that later, the existing `bindTo="draft"` mode on the provider plus a "Save as new theme" footer covers it cleanly — but it's a real UX shift and not required to land the layout panel.

## Order of operations

1. Land Stage A (lowest risk, biggest immediate value — designers stop scrolling chat history for starter prompts).
2. Drop the `ThemeBuilderPanel` mount from `studio/page.tsx`. The right column shows Stage A immediately for new designs.
3. Wire the chrome popover's inline "Edit…" expansion. Themes are still fully editable, just from the popover.
4. Land Stage B (page structure). This is the bigger lift because of the AppShell-prop question above.
5. Stage D (layout-primitive prop ordering) — small, can land any time after the manifest endpoint grows the optional `groupOrder` field.

## Open questions

- **Stage A trigger sensitivity.** Token-count heuristic might be too eager — happy to revisit once we see a few real designs go through it. Worst case we add a "Show starter picker" toggle in the panel header that the user can pin open.
- **Reference-layout thumbnails.** Capture pipeline exists; what's the deploy story for the captured images — committed to `public/`, or generated on demand? Stage A v1.1 work-item.
- **AppShell prop surface.** As above — need a read of `packages/ui/COMPONENTS.md` before locking down Stage B controls.
- **Settings panel docking under the new shell.** Today `panelDockedByDesign` flips between `<ThemeBuilderPanel />` and the docked settings panel. Under the new model, "docked" is the default for Stage C and the flag becomes redundant; we can either drop it or keep it as an inline/docked preference for users who prefer the chat-column variant. Probably drop on the same PR that retires the theme panel from the page.

## See also

- `apps/docs/STUDIO.md` — Studio internals overview; the right-panel section becomes "Right panel — stage-aware layout shell" once this lands.
- `packages/studio/src/playbook/layouts/index.ts` — `REFERENCE_LAYOUTS` registry. Authoritative list for Stage A.
- `apps/docs/components/studio/settings-panel.tsx` — Stage C/D host; unchanged in v1 of this work, grows a `groupOrder` hook for Stage D later.
- `apps/docs/components/theme-builder/` — composable primitives the chrome popover will reuse for inline theme editing.
