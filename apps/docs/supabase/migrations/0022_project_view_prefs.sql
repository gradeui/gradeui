-- Per-project screens-rail view preferences (STUDIO-TAGS T1) — how the
-- user organises the screens surface: grid ⇄ list, group-by tag type,
-- active filter facets. Cloud-persisted so the organisation follows the
-- user across devices (localStorage remains the local-adapter mirror).
-- Additive; jsonb of { view, groupBy, filters }.
alter table public.projects
  add column if not exists view_prefs jsonb;
