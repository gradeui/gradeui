-- ──────────────────────────────────────────────────────────────────
-- 0004_fix_all_rls_recursion.sql
--
-- Comprehensive fix for Postgres 42P17 "infinite recursion detected
-- in policy" across EVERY table whose RLS policy referenced another
-- (or the same) RLS-protected table inside its own USING/WITH CHECK:
--
--   memberships        → referenced memberships     (self)
--   org_memberships    → referenced org_memberships (self)
--   projects           → referenced project_access  ┐ mutual
--   project_access     → referenced projects         ┘ recursion
--
-- The projects↔project_access loop is what 500s `listProjects()` once
-- any project rows exist — which is the current blocker.
--
-- Fix pattern (same as 0003, applied everywhere): hoist every
-- cross-/self-table lookup into a SECURITY DEFINER function. Those run
-- with the owner's rights and so DON'T re-enter RLS, breaking the
-- cycle while preserving the intended visibility rules.
--
-- This migration SUPERSEDES 0003 — it redefines the same membership
-- helpers/policies idempotently, so running 0004 alone is sufficient.
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────────

-- ═══ Helper functions (all SECURITY DEFINER → bypass RLS) ═════════

create or replace function public.user_team_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select team_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.user_admin_team_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select team_id from public.memberships where user_id = auth.uid() and role = 'admin';
$$;

create or replace function public.user_org_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select org_id from public.org_memberships where user_id = auth.uid();
$$;

create or replace function public.user_admin_org_ids()
returns setof uuid language sql security definer stable set search_path = public as $$
  select org_id from public.org_memberships where user_id = auth.uid() and role = 'admin';
$$;

-- True when the current user owns project p_id — directly (user-owned)
-- or via membership of the owning team.
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

-- True when the current user has an explicit access grant on p_id —
-- a direct user grant, or via a team they belong to.
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
  public.user_admin_team_ids(),
  public.user_org_ids(),
  public.user_admin_org_ids(),
  public.user_owns_project(uuid),
  public.user_has_project_access(uuid)
to authenticated;

-- ═══ memberships ═════════════════════════════════════════════════

drop policy if exists "memberships select" on public.memberships;
create policy "memberships select" on public.memberships for select to authenticated
  using (user_id = auth.uid() or team_id in (select public.user_team_ids()));

drop policy if exists "memberships insert team-admins-or-self" on public.memberships;
create policy "memberships insert team-admins-or-self" on public.memberships for insert to authenticated
  with check (user_id = auth.uid() or team_id in (select public.user_admin_team_ids()));

drop policy if exists "memberships delete team-admins-or-self" on public.memberships;
create policy "memberships delete team-admins-or-self" on public.memberships for delete to authenticated
  using (user_id = auth.uid() or team_id in (select public.user_admin_team_ids()));

drop policy if exists "memberships update team-admins" on public.memberships;
create policy "memberships update team-admins" on public.memberships for update to authenticated
  using (team_id in (select public.user_admin_team_ids()));

-- ═══ org_memberships ═════════════════════════════════════════════

drop policy if exists "org_memberships select" on public.org_memberships;
create policy "org_memberships select" on public.org_memberships for select to authenticated
  using (user_id = auth.uid() or org_id in (select public.user_org_ids()));

drop policy if exists "org_memberships insert self-or-admin" on public.org_memberships;
create policy "org_memberships insert self-or-admin" on public.org_memberships for insert to authenticated
  with check (user_id = auth.uid() or org_id in (select public.user_admin_org_ids()));

drop policy if exists "org_memberships delete self-or-admin" on public.org_memberships;
create policy "org_memberships delete self-or-admin" on public.org_memberships for delete to authenticated
  using (user_id = auth.uid() or org_id in (select public.user_admin_org_ids()));

drop policy if exists "org_memberships update admins" on public.org_memberships;
create policy "org_memberships update admins" on public.org_memberships for update to authenticated
  using (org_id in (select public.user_admin_org_ids()));

-- ═══ projects (no longer references project_access directly) ═════

drop policy if exists "projects select via owner or access" on public.projects;
create policy "projects select via owner or access" on public.projects for select to authenticated
  using (public.user_owns_project(id) or public.user_has_project_access(id));

drop policy if exists "projects insert any signed-in" on public.projects;
create policy "projects insert any signed-in" on public.projects for insert to authenticated
  with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
  );

drop policy if exists "projects update owner-or-editor" on public.projects;
create policy "projects update owner-or-editor" on public.projects for update to authenticated
  using (public.user_owns_project(id) or public.user_has_project_access(id));

drop policy if exists "projects delete owner" on public.projects;
create policy "projects delete owner" on public.projects for delete to authenticated
  using (public.user_owns_project(id));

-- ═══ project_access (no longer references projects directly) ═════

drop policy if exists "project_access select via project" on public.project_access;
create policy "project_access select via project" on public.project_access for select to authenticated
  using (
    public.user_owns_project(project_id)
    or (subject_type = 'user' and subject_id = auth.uid())
  );

drop policy if exists "project_access mutate owner" on public.project_access;
create policy "project_access mutate owner" on public.project_access for all to authenticated
  using (public.user_owns_project(project_id))
  with check (public.user_owns_project(project_id));
