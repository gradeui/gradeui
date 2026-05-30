-- ──────────────────────────────────────────────────────────────────
-- 0003_fix_membership_rls_recursion.sql
--
-- Fixes Postgres error 42P17 "infinite recursion detected in policy
-- for relation memberships" (and the identical latent bug on
-- org_memberships).
--
-- Root cause: the SELECT + mutation policies on `memberships`
-- reference `memberships` INSIDE their own policy expression (to ask
-- "is the current user a member / admin of this team?"). Evaluating
-- that subquery re-applies the same policy, which re-runs the
-- subquery … → infinite recursion. `org_memberships` had the same
-- shape. Studio's bootstrap calls listMemberships() early, so this
-- killed the entire cloud path before any data could load.
--
-- Fix: hoist those self-lookups into SECURITY DEFINER helper
-- functions. A SECURITY DEFINER function runs with the function
-- owner's rights and so does NOT re-enter RLS — the recursion is
-- broken while the intended "see your team / admin your team"
-- semantics are preserved.
--
-- Idempotent: functions use CREATE OR REPLACE; policies are dropped
-- if-exists then recreated.
-- ──────────────────────────────────────────────────────────────────

-- ─── Helper functions (RLS-bypassing lookups) ─────────────────────

create or replace function public.user_team_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.user_admin_team_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select team_id from public.memberships
  where user_id = auth.uid() and role = 'admin';
$$;

create or replace function public.user_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.org_memberships where user_id = auth.uid();
$$;

create or replace function public.user_admin_org_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.org_memberships
  where user_id = auth.uid() and role = 'admin';
$$;

grant execute on function
  public.user_team_ids(),
  public.user_admin_team_ids(),
  public.user_org_ids(),
  public.user_admin_org_ids()
to authenticated;

-- ─── memberships — recreate policies without self-reference ───────

drop policy if exists "memberships select" on public.memberships;
create policy "memberships select"
  on public.memberships for select
  to authenticated using (
    user_id = auth.uid()
    or team_id in (select public.user_team_ids())
  );

drop policy if exists "memberships insert team-admins-or-self" on public.memberships;
create policy "memberships insert team-admins-or-self"
  on public.memberships for insert
  to authenticated with check (
    user_id = auth.uid()
    or team_id in (select public.user_admin_team_ids())
  );

drop policy if exists "memberships delete team-admins-or-self" on public.memberships;
create policy "memberships delete team-admins-or-self"
  on public.memberships for delete
  to authenticated using (
    user_id = auth.uid()
    or team_id in (select public.user_admin_team_ids())
  );

drop policy if exists "memberships update team-admins" on public.memberships;
create policy "memberships update team-admins"
  on public.memberships for update
  to authenticated using (
    team_id in (select public.user_admin_team_ids())
  );

-- ─── org_memberships — same treatment ─────────────────────────────

drop policy if exists "org_memberships select" on public.org_memberships;
create policy "org_memberships select"
  on public.org_memberships for select
  to authenticated using (
    user_id = auth.uid()
    or org_id in (select public.user_org_ids())
  );

drop policy if exists "org_memberships insert self-or-admin" on public.org_memberships;
create policy "org_memberships insert self-or-admin"
  on public.org_memberships for insert
  to authenticated with check (
    user_id = auth.uid()
    or org_id in (select public.user_admin_org_ids())
  );

drop policy if exists "org_memberships delete self-or-admin" on public.org_memberships;
create policy "org_memberships delete self-or-admin"
  on public.org_memberships for delete
  to authenticated using (
    user_id = auth.uid()
    or org_id in (select public.user_admin_org_ids())
  );

drop policy if exists "org_memberships update admins" on public.org_memberships;
create policy "org_memberships update admins"
  on public.org_memberships for update
  to authenticated using (
    org_id in (select public.user_admin_org_ids())
  );
