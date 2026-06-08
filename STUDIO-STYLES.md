# Studio Styles — the per-project theme configurator (T1) + project-scoped assets

How a project gets its own **Styles** surface (save / apply / curate theme variants) and its own **asset library** view — both built on substrate that already shipped, no new migrations.

> Status: implementation record. Landed 2026-06-08.
> Sibling of [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) (the theme contract + the T0–T5 rollout this advances) and [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) (the asset pillar this scopes). Read those for the *why*; this doc is the *what shipped and what's next*.

---

## What shipped

### 1. Assets scoped to the active project

`0014` already stores assets as **user-owned with an optional `project_id` tag**, and its RLS already lets project members read project-tagged assets — but the browser ignored the tag and listed the whole library. This pass wires the scope through, keeping the personal library as a deliberate escape hatch (the model `STUDIO-STORAGE.md` settled on; *not* a strict ownership change).

- `apps/docs/components/studio/asset-browser.tsx` — takes a `projectId` prop, defaults to a **This project / All assets** toggle. "This project" → `listAssets({ type, projectId })`; "All assets" → the unfiltered personal library. Uploads (drag/drop + picker) tag the active project when the project view is showing, untagged from the personal view.
- `apps/docs/app/studio/page.tsx` — passes `projectId={activeProjectId}` into the mounted `<AssetBrowser>`.

No migration, no RLS change.

### 2. The Styles tab — Themes configurator, Phase T1

A new always-visible **Styles** tab in the Studio right column, distinct from the hidden full theme builder (`SHOW_THEME_TAB`, still not demo-quality). It is the [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) **T1** slice: per-project variant authoring on top of the `0013` `theme_variants_json` storage + the deterministic `ThemeInput` → `generateTheme` contract.

- `apps/docs/components/studio/studio-right-tabs.tsx` — new `"styles"` `TabId`; `StylesTabContent` + `VariantRow`. Save the current screen theme as a named variant; **apply** a variant non-destructively (it `rebase`s the builder draft — the same path as the theme dropdown, so the preview re-skins without committing elsewhere, undo as the safety net); rename; delete; toggle `includeInShare`. Per-variant swatch derives from the variant's own input via `generateTheme`.
- `apps/docs/app/studio/page.tsx` — `themeVariantsJsonByProject` state, loaded on bootstrap (single + bulk), dirty-tracked in the save signature (`v:`), and written through `saveProject` — wired exactly parallel to `themeDraftJson`. `projectThemeVariants` (parsed) + `handleThemeVariantsChange` (serialise + persist) thread into `StudioRightTabs`.

Both adapters already round-trip `theme_variants_json` (`supabase-adapter.ts`, `local-adapter.ts`), so storage needed no change.

## What's deliberately deferred

- **B3 — true non-destructive preview-override.** Today "apply variant" `rebase`s the draft (consistent with the existing dropdown; undo recovers it). `STUDIO-THEMES.md` T1 wants a preview-override channel in `ThemeBuilderProvider` that previews *without* touching the working draft. Refinement, not a blocker.
- **A3 — inspector image picker → project library.** Point the selection inspector's MediaSurface fill affordance at the scoped library (`STUDIO-STORAGE.md` S1), so picking an image for a slot pulls from "this project" first.
- **T2 — curated share set.** The `includeInShare` flag is already captured per variant. T2 is just teaching the `/s/<token>` share route + toolbar to read the flagged subset. No rework — the data is ready.
- **Themes via MCP — a questionnaire.** A future `askQuestions`-style tool ("Primary colour? Grey/neutral? Radius? …") that collects a few role answers and emits a `ThemeInput`, dropped straight into this same variant store as a saved variant. Pairs with T1 (questionnaire output = a variant) and keeps provider/runtime knowledge where it belongs. Spec when wanted.

## Constraints carried over

- **Deterministic generator is load-bearing.** Variants store the `ThemeInput`, never the generated output; `generateTheme` must stay pure or published/saved variants drift (see `STUDIO-THEMES.md` → "The seed must stay deterministic").
- **Local-only has no bucket.** The asset browser degrades to an empty list / "sign in" in local mode, unchanged.
- **No new `grade:*` protocol.** Apply-as-preview reuses the existing `grade:fast-theme` channel, so there's no two-renderer parity work.

## See also

- [`STUDIO-THEMES.md`](./STUDIO-THEMES.md) — the contract + T0–T5. This is T1.
- [`STUDIO-STORAGE.md`](./STUDIO-STORAGE.md) — the asset pillar; the scoping here is a UI layer over its `project_id` tag.
- `apps/docs/supabase/migrations/0013_project_theme_variants.sql`, `0014_user_assets.sql` — the substrate.
