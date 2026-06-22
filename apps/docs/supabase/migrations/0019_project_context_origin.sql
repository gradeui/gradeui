-- 0019 — Project CONTEXT + do's/don'ts steering, and the ORIGIN surface.
--
-- context / dos / donts give a project agent-steering guidance that the
-- generation prompt reads, so output respects the project's brief and rules
-- ("STOP THE SLOP" at the project level, complementing the per-component
-- contracts). `context` is a free-form brief; `dos` / `donts` are bullet lists.
--
-- origin records WHICH interface created a project (and each screen) — Studio,
-- a separate asset/showcase app sharing the gradeui login, the MCP server, the
-- API, or an import. A multi-surface ecosystem can then distinguish and route
-- by where a thing was made. Defaults to 'studio'; no check constraint so a new
-- surface never needs a migration.
--
-- All additive + safe: existing rows get '' / '{}' / 'studio', no backfill.

alter table public.projects
  add column if not exists context text,
  add column if not exists dos text[] not null default '{}',
  add column if not exists donts text[] not null default '{}',
  add column if not exists origin text not null default 'studio',
  -- type drives the whole Studio interface/canvas (web-app | website |
  -- mobile-app | slides | social | email). viewports is an optional override
  -- of the canvas frames; null = the defaults for `type` (which live in code).
  add column if not exists type text not null default 'web-app',
  add column if not exists viewports jsonb;

alter table public.designs
  add column if not exists origin text not null default 'studio';

comment on column public.projects.context is
  'Free-form project brief fed to the generation prompt (project-level steering).';
comment on column public.projects.dos is
  'Project do-rules (bullet list) the agent should follow.';
comment on column public.projects.donts is
  'Project dont-rules (bullet list) the agent should avoid.';
comment on column public.projects.origin is
  'Surface that created the project: studio | assets | sites | mcp | api | import (open vocabulary).';
comment on column public.projects.type is
  'Project KIND — drives the Studio interface/canvas: web-app | website | mobile-app | slides | social | email (open vocabulary).';
comment on column public.projects.viewports is
  'Optional canvas viewport set; null = the defaults for `type`. e.g. ["mobile","tablet","desktop"] or [{"name":"square","w":1080,"h":1080}].';
comment on column public.designs.origin is
  'Surface that created the screen (mirrors projects.origin).';
