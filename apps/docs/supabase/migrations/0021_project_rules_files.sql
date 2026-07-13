-- Per-project rules files — named .md-style documents whose content
-- rides into the generation prompt (Project Settings > Rules files).
-- Additive; jsonb array of { id, name, content }.
alter table public.projects
  add column if not exists rules_files jsonb;
