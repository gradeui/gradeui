-- ──────────────────────────────────────────────────────────────────
-- 0007_fix_org_team_readback.sql
--
-- Same class of bug 0006 fixed for projects, but for orgs + teams.
--
-- createOrg / createTeam do INSERT ... RETURNING (PostgREST
-- `return=representation`). The SELECT policy that gates the read-back
-- asks "is the current user a member of this org/team?" — but the
-- membership row is created AFTER the insert, so at read-back time
-- there's no membership yet → the row is invisible → 42501 / rollback,
-- and creation fails.
--
-- Fix: give orgs + teams a `created_by` column, auto-stamped to the
-- creator via `default auth.uid()`, and add a `created_by = auth.uid()`
-- branch to their SELECT policies. That branch reads the candidate
-- row's own column, so it's visible to the RETURNING check (and to
-- any later "things I made" query) without depending on a membership
-- row that doesn't exist yet.
--
-- Existing rows get created_by = NULL (they remain visible via
-- membership, which is unchanged). Idempotent.
-- ──────────────────────────────────────────────────────────────────

-- ─── columns ──────────────────────────────────────────────────────
alter table public.orgs
  add column if not exists created_by uuid references public.users (id);
alter table public.orgs
  alter column created_by set default auth.uid();

alter table public.teams
  add column if not exists created_by uuid references public.users (id);
alter table public.teams
  alter column created_by set default auth.uid();

-- ─── orgs SELECT — add the creator branch ─────────────────────────
drop policy if exists "orgs select members" on public.orgs;
create policy "orgs select members"
  on public.orgs for select
  to authenticated using (
    created_by = auth.uid()
    or id in (select public.user_org_ids())
  );

-- ─── teams SELECT — add the creator branch ────────────────────────
-- Uses the definer helpers from 0004 for the membership lookups so it
-- stays recursion-free; adds created_by for the read-back path.
drop policy if exists "teams select members" on public.teams;
create policy "teams select members"
  on public.teams for select
  to authenticated using (
    created_by = auth.uid()
    or id in (select public.user_team_ids())
    or org_id in (select public.user_org_ids())
  );
