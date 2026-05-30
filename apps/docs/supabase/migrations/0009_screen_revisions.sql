-- ──────────────────────────────────────────────────────────────────
-- 0009_screen_revisions.sql
--
-- The revision spine. Each sealed change to a screen (a generation, an
-- accepted edit) writes ONE immutable snapshot row. "Current screen" =
-- the latest revision. This is what makes comments durable: a comment
-- binds to the revision it was made on, whose source ids are frozen,
-- so it can never orphan when the model regenerates the screen.
--
-- Also adds comment_threads.revision_id so each thread records which
-- revision it was anchored to. Nullable + ON DELETE SET NULL so pruning
-- a revision never deletes the feedback.
--
-- Immutable by design: SELECT for readers, INSERT for editors, DELETE
-- for admins (pruning) — no UPDATE.
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.screen_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  design_id text not null references public.designs (id) on delete cascade,
  app_source text,
  label text,
  created_by uuid references public.users (id),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists screen_revisions_design_idx
  on public.screen_revisions (design_id, created_at desc);

alter table public.comment_threads
  add column if not exists revision_id uuid
    references public.screen_revisions (id) on delete set null;

-- ─── RLS ──────────────────────────────────────────────────────────
alter table public.screen_revisions enable row level security;

drop policy if exists "screen_revisions_select" on public.screen_revisions;
create policy "screen_revisions_select"
  on public.screen_revisions for select
  to authenticated using (public.user_can_read_project(project_id));

drop policy if exists "screen_revisions_insert" on public.screen_revisions;
create policy "screen_revisions_insert"
  on public.screen_revisions for insert
  to authenticated with check (public.user_can_edit_project(project_id));

drop policy if exists "screen_revisions_delete" on public.screen_revisions;
create policy "screen_revisions_delete"
  on public.screen_revisions for delete
  to authenticated using (public.user_can_admin_project(project_id));
