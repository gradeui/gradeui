-- ──────────────────────────────────────────────────────────────────
-- 0013_project_theme_variants.sql
--
-- Remix: per-project saved theme variants. A variant is a named
-- ThemeInput the designer derived by tweaking the project theme; the
-- generator is deterministic, so storing the INPUT (not the generated
-- output) is enough to reproduce the exact theme. Variants flagged for
-- the share become the curated A/B set the share toolbar offers.
--
-- Stored as a JSON array on the project (alongside theme_draft_json) —
-- no separate themes table for now. Shape per entry:
--   { id, name, input: <ThemeInput>, includeInShare: boolean, createdAt }
--
-- NULL = no variants yet (every existing project). Safe default.
-- ──────────────────────────────────────────────────────────────────

alter table public.projects
  add column if not exists theme_variants_json text;
