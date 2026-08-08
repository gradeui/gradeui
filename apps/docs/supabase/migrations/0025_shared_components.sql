-- 0025_shared_components.sql
--
-- Project-scoped SHARED COMPONENTS: reusable JSX modules (an AppLayout,
-- a Stepper, a chart wrapper) that screens import via the stable
-- specifier "@project/components" instead of copy-pasting per screen.
-- One row = one module exporting one named component (compound
-- sub-parts like AppLayout.Header live inside the module and ride the
-- same export). Stored as raw JSX source — the same substance as
-- designs.state.appSource — compiled at render time by the same
-- kernels that compile screens.
--
-- Applied manually via the Supabase SQL editor (see SETUP-AUTH.md).
-- Idempotent: safe to run repeatedly.

create table if not exists public.shared_components (
  -- Client-minted text id, matching the designs.id convention
  -- ("c" + epoch base36 + random suffix, minted by the writer).
  id text primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  -- PascalCase export name; also the import name in screens
  -- (import { AppLayout } from "@project/components").
  name text not null,
  -- Raw JSX module source. Must `export` the component named above.
  source text not null,
  -- One-line human/model-facing description of what it is for.
  description text,
  created_by uuid references public.users (id),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  -- Soft delete ("mark, don't destroy" — 0016 convention).
  deleted_at bigint
);

-- One LIVE component per name per project (soft-deleted rows free the name).
create unique index if not exists shared_components_project_name_live_idx
  on public.shared_components (project_id, name)
  where deleted_at is null;

create index if not exists shared_components_project_idx
  on public.shared_components (project_id, updated_at desc);

drop trigger if exists shared_components_set_updated_at on public.shared_components;
create trigger shared_components_set_updated_at
  before update on public.shared_components
  for each row execute function set_updated_at();

alter table public.shared_components enable row level security;

-- Four-policy split per the designs convention (0008): read follows
-- project read access; writes require edit access.
drop policy if exists "shared_components_select" on public.shared_components;
create policy "shared_components_select" on public.shared_components for select
  to authenticated using (public.user_can_read_project(project_id));

drop policy if exists "shared_components_insert" on public.shared_components;
create policy "shared_components_insert" on public.shared_components for insert
  to authenticated with check (public.user_can_edit_project(project_id));

drop policy if exists "shared_components_update" on public.shared_components;
create policy "shared_components_update" on public.shared_components for update
  to authenticated using (public.user_can_edit_project(project_id))
  with check (public.user_can_edit_project(project_id));

drop policy if exists "shared_components_delete" on public.shared_components;
create policy "shared_components_delete" on public.shared_components for delete
  to authenticated using (public.user_can_edit_project(project_id));
