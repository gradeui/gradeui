-- ──────────────────────────────────────────────────────────────────
-- 0006_fix_projects_select_returning.sql
--
-- Symptom: createProject (INSERT ... RETURNING / PostgREST
-- `return=representation`) fails with 42501, even though the bare
-- INSERT (`return=minimal`) succeeds and the row is created.
--
-- Cause: the projects SELECT/UPDATE policies checked ownership via
-- public.user_owns_project(id) — a STABLE SECURITY DEFINER function.
-- STABLE functions evaluate against the snapshot taken at the START
-- of the calling statement, so during INSERT ... RETURNING they do
-- NOT see the row being inserted. The read-back is therefore denied
-- and the whole statement rolls back.
--
-- Fix: for the OWNER check on `projects`, read the candidate row's own
-- columns inline (owner_type / owner_id) instead of re-querying the
-- table through a function. Inline column refs are visible to the
-- RETURNING check, and — crucially — they don't reference projects or
-- project_access, so there's no recursion either.
--
-- The cross-table grant check (user_has_project_access) stays as a
-- definer function — it queries project_access, not projects, so it's
-- both recursion-safe AND fine for already-committed rows. Likewise
-- project_access's policies keep using user_owns_project (they query
-- committed projects rows, never the row mid-insert).
--
-- Idempotent.
-- ──────────────────────────────────────────────────────────────────

drop policy if exists "projects_select" on public.projects;
create policy "projects_select"
  on public.projects for select to authenticated
  using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
    or public.user_has_project_access(id)
  );

drop policy if exists "projects_update" on public.projects;
create policy "projects_update"
  on public.projects for update to authenticated
  using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
    or public.user_has_project_access(id)
  )
  with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
    or public.user_has_project_access(id)
  );

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete"
  on public.projects for delete to authenticated
  using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_team_ids()))
  );

-- projects_insert is unchanged (its WITH CHECK already reads the
-- candidate row's columns inline and worked all along).
