-- ──────────────────────────────────────────────────────────────────
-- 0005_reset_project_write_policies.sql
--
-- Symptom: inserting a project fails with 42501 "new row violates row
-- level security policy for table projects" — even though auth.uid()
-- resolves correctly and owner_id is set to it. That means the
-- projects INSERT policy is either missing (a drop without its
-- recreate, from a partial run of an earlier migration) or a stray
-- policy is interfering.
--
-- Fix: deterministically DROP every existing policy on `projects` and
-- `project_access` (via a catalog loop, so we don't have to know
-- their names), then rebuild the correct owner-scoped set on top of
-- the SECURITY DEFINER helpers from 0004. Idempotent + self-healing —
-- whatever state the table is in, after this it's known-good.
--
-- Per-user isolation is preserved: a user sees / mutates only projects
-- they own (user-owned by auth.uid, or team-owned via membership) or
-- have an explicit grant on. That's exactly what a second-email test
-- should confirm.
--
-- Depends on 0004's helpers (user_owns_project, user_has_project_access,
-- user_team_ids). They're recreated here too so 0005 stands alone.
-- ──────────────────────────────────────────────────────────────────

-- Helpers (idempotent; identical to 0004) ─────────────────────────
create or replace function public.user_team_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select team_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.user_owns_project(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_id and (
      (p.owner_type = 'user' and p.owner_id = auth.uid())
      or (p.owner_type = 'team' and p.owner_id in
          (select team_id from public.memberships where user_id = auth.uid()))
    )
  );
$$;

create or replace function public.user_has_project_access(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.project_access a
    where a.project_id = p_id and (
      (a.subject_type = 'user' and a.subject_id = auth.uid())
      or (a.subject_type = 'team' and a.subject_id in
          (select team_id from public.memberships where user_id = auth.uid()))
    )
  );
$$;

grant execute on function
  public.user_team_ids(),
  public.user_owns_project(uuid),
  public.user_has_project_access(uuid)
to authenticated;

-- Wipe ALL existing policies on the two tables ────────────────────
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('projects', 'project_access')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Make sure RLS is on (it should already be) ──────────────────────
alter table public.projects        enable row level security;
alter table public.project_access  enable row level security;

-- projects — rebuild the four policies ────────────────────────────
create policy "projects_select"
  on public.projects for select to authenticated
  using (public.user_owns_project(id) or public.user_has_project_access(id));

create policy "projects_insert"
  on public.projects for insert to authenticated
  with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
  );

create policy "projects_update"
  on public.projects for update to authenticated
  using (public.user_owns_project(id) or public.user_has_project_access(id))
  with check (public.user_owns_project(id) or public.user_has_project_access(id));

create policy "projects_delete"
  on public.projects for delete to authenticated
  using (public.user_owns_project(id));

-- project_access — rebuild select + mutate ────────────────────────
create policy "project_access_select"
  on public.project_access for select to authenticated
  using (
    public.user_owns_project(project_id)
    or (subject_type = 'user' and subject_id = auth.uid())
  );

create policy "project_access_mutate"
  on public.project_access for all to authenticated
  using (public.user_owns_project(project_id))
  with check (public.user_owns_project(project_id));
