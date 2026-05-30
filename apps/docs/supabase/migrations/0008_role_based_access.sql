-- ──────────────────────────────────────────────────────────────────
-- 0008_role_based_access.sql
--
-- Full read/write RBAC across the hierarchy: org → team → project →
-- (screens / chat / notes / comments). Decisions baked in:
--
--   • Project grants:   owner & editor = write,  viewer = read.
--   • Team-owned project: team MEMBERS = read-only; team ADMINS = write.
--   • Org ADMINS: implicit read + write over everything in their org.
--   • Children (designs/messages/notes) inherit the project's read/write.
--   • Comments: anyone who can READ a project may comment (feedback is a
--     viewer-friendly action); content edits still require write.
--   • Project delete + share-management require the stricter "admin"
--     level (owner / team-admin / org-admin / owner-grant) — not editors.
--
-- Everything routes through three SECURITY DEFINER resolvers so the
-- policies are simple, consistent, and recursion-free. They bypass RLS
-- internally (definer), so referencing projects/teams/memberships from
-- inside them can't loop back into a policy.
--
-- Idempotent. Builds on the helpers from 0004 (user_*_ids) and the
-- created_by columns from 0007.
-- ──────────────────────────────────────────────────────────────────

-- ═══ Resolvers ════════════════════════════════════════════════════

-- READ: can the user see this project at all?
create or replace function public.user_can_read_project(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (
      select 1 from public.projects p
      where p.id = p_id and (
        (p.owner_type = 'user' and p.owner_id = auth.uid())
        or (p.owner_type = 'team' and p.owner_id in
            (select team_id from public.memberships where user_id = auth.uid()))
        or (p.owner_type = 'team' and exists (
              select 1 from public.teams t
              join public.org_memberships om on om.org_id = t.org_id
              where t.id = p.owner_id
                and om.user_id = auth.uid() and om.role = 'admin'))
      )
    )
    or exists (
      select 1 from public.project_access a
      where a.project_id = p_id and (
        (a.subject_type = 'user' and a.subject_id = auth.uid())
        or (a.subject_type = 'team' and a.subject_id in
            (select team_id from public.memberships where user_id = auth.uid()))
      )
    );
$$;

-- EDIT: can the user change project content (and its children)?
create or replace function public.user_can_edit_project(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (
      select 1 from public.projects p
      where p.id = p_id and (
        (p.owner_type = 'user' and p.owner_id = auth.uid())
        -- team-owned: only team ADMINS write (members are read-only)
        or (p.owner_type = 'team' and p.owner_id in
            (select team_id from public.memberships where user_id = auth.uid() and role = 'admin'))
        -- org admin of the owning team's org
        or (p.owner_type = 'team' and exists (
              select 1 from public.teams t
              join public.org_memberships om on om.org_id = t.org_id
              where t.id = p.owner_id
                and om.user_id = auth.uid() and om.role = 'admin'))
      )
    )
    -- explicit write grant (owner/editor), direct or via a team I'm in
    or exists (
      select 1 from public.project_access a
      where a.project_id = p_id and a.role in ('owner', 'editor') and (
        (a.subject_type = 'user' and a.subject_id = auth.uid())
        or (a.subject_type = 'team' and a.subject_id in
            (select team_id from public.memberships where user_id = auth.uid()))
      )
    );
$$;

-- ADMIN: can the user delete the project / manage its sharing?
-- Like EDIT but editors are excluded — only owner / team-admin /
-- org-admin / an explicit OWNER grant.
create or replace function public.user_can_admin_project(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (
      select 1 from public.projects p
      where p.id = p_id and (
        (p.owner_type = 'user' and p.owner_id = auth.uid())
        or (p.owner_type = 'team' and p.owner_id in
            (select team_id from public.memberships where user_id = auth.uid() and role = 'admin'))
        or (p.owner_type = 'team' and exists (
              select 1 from public.teams t
              join public.org_memberships om on om.org_id = t.org_id
              where t.id = p.owner_id
                and om.user_id = auth.uid() and om.role = 'admin'))
      )
    )
    or exists (
      select 1 from public.project_access a
      where a.project_id = p_id and a.role = 'owner' and (
        (a.subject_type = 'user' and a.subject_id = auth.uid())
        or (a.subject_type = 'team' and a.subject_id in
            (select team_id from public.memberships where user_id = auth.uid()))
      )
    );
$$;

grant execute on function
  public.user_can_read_project(uuid),
  public.user_can_edit_project(uuid),
  public.user_can_admin_project(uuid)
to authenticated;

-- ═══ projects ════════════════════════════════════════════════════
-- SELECT keeps the inline owner branch first so INSERT ... RETURNING
-- (createProject) can read back the just-inserted row — a definer
-- function can't see it mid-statement (the 0006 lesson).

drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects for select to authenticated
  using (
    (owner_type = 'user' and owner_id = auth.uid())
    or public.user_can_read_project(id)
  );

drop policy if exists "projects_insert" on public.projects;
create policy "projects_insert" on public.projects for insert to authenticated
  with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and owner_id in (select public.user_admin_team_ids()))
  );

drop policy if exists "projects_update" on public.projects;
create policy "projects_update" on public.projects for update to authenticated
  using (
    (owner_type = 'user' and owner_id = auth.uid())
    or public.user_can_edit_project(id)
  )
  with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or public.user_can_edit_project(id)
  );

drop policy if exists "projects_delete" on public.projects;
create policy "projects_delete" on public.projects for delete to authenticated
  using (public.user_can_admin_project(id));

-- ═══ project_access (sharing) ════════════════════════════════════
drop policy if exists "project_access_select" on public.project_access;
create policy "project_access_select" on public.project_access for select to authenticated
  using (
    (subject_type = 'user' and subject_id = auth.uid())
    or public.user_can_read_project(project_id)
  );

drop policy if exists "project_access_mutate" on public.project_access;
create policy "project_access_mutate" on public.project_access for all to authenticated
  using (public.user_can_admin_project(project_id))
  with check (public.user_can_admin_project(project_id));

-- ═══ designs / messages / notes — split read vs write ════════════
-- Replace the old "for all" policies with explicit per-command ones so
-- read (viewers) and write (editors) diverge.

drop policy if exists "designs all via project" on public.designs;
drop policy if exists "designs_select" on public.designs;
drop policy if exists "designs_write"  on public.designs;
create policy "designs_select" on public.designs for select to authenticated
  using (public.user_can_read_project(project_id));
create policy "designs_insert" on public.designs for insert to authenticated
  with check (public.user_can_edit_project(project_id));
create policy "designs_update" on public.designs for update to authenticated
  using (public.user_can_edit_project(project_id))
  with check (public.user_can_edit_project(project_id));
create policy "designs_delete" on public.designs for delete to authenticated
  using (public.user_can_edit_project(project_id));

drop policy if exists "messages all via project" on public.messages;
create policy "messages_select" on public.messages for select to authenticated
  using (public.user_can_read_project(project_id));
create policy "messages_insert" on public.messages for insert to authenticated
  with check (public.user_can_edit_project(project_id));
create policy "messages_delete" on public.messages for delete to authenticated
  using (public.user_can_edit_project(project_id));

drop policy if exists "notes all via project" on public.notes;
create policy "notes_select" on public.notes for select to authenticated
  using (public.user_can_read_project(project_id));
create policy "notes_insert" on public.notes for insert to authenticated
  with check (public.user_can_edit_project(project_id));
create policy "notes_update" on public.notes for update to authenticated
  using (public.user_can_edit_project(project_id))
  with check (public.user_can_edit_project(project_id));
create policy "notes_delete" on public.notes for delete to authenticated
  using (public.user_can_edit_project(project_id));

-- ═══ comments — readable + commentable by anyone who can READ ════
drop policy if exists "comment_threads all via project" on public.comment_threads;
create policy "comment_threads_rw" on public.comment_threads for all to authenticated
  using (public.user_can_read_project(project_id))
  with check (public.user_can_read_project(project_id));

drop policy if exists "comments all via project" on public.comments;
create policy "comments_rw" on public.comments for all to authenticated
  using (exists (
    select 1 from public.comment_threads t
    where t.id = comments.thread_id and public.user_can_read_project(t.project_id)
  ))
  with check (exists (
    select 1 from public.comment_threads t
    where t.id = comments.thread_id and public.user_can_read_project(t.project_id)
  ));

-- ═══ orgs — write gated to org admins ════════════════════════════
drop policy if exists "orgs insert any signed-in" on public.orgs;
create policy "orgs_insert" on public.orgs for insert to authenticated
  with check (true);

drop policy if exists "orgs update admins" on public.orgs;
drop policy if exists "orgs_update" on public.orgs;
create policy "orgs_update" on public.orgs for update to authenticated
  using (id in (select public.user_admin_org_ids()))
  with check (id in (select public.user_admin_org_ids()));

drop policy if exists "orgs delete admins" on public.orgs;
drop policy if exists "orgs_delete" on public.orgs;
create policy "orgs_delete" on public.orgs for delete to authenticated
  using (id in (select public.user_admin_org_ids()));

-- ═══ teams — write gated to team admins OR org admins ════════════
drop policy if exists "teams insert org-members" on public.teams;
create policy "teams_insert" on public.teams for insert to authenticated
  with check (org_id in (select public.user_org_ids()));

drop policy if exists "teams update team-admins" on public.teams;
drop policy if exists "teams_update" on public.teams;
create policy "teams_update" on public.teams for update to authenticated
  using (
    id in (select public.user_admin_team_ids())
    or org_id in (select public.user_admin_org_ids())
  )
  with check (
    id in (select public.user_admin_team_ids())
    or org_id in (select public.user_admin_org_ids())
  );

drop policy if exists "teams delete team-admins" on public.teams;
drop policy if exists "teams_delete" on public.teams;
create policy "teams_delete" on public.teams for delete to authenticated
  using (
    id in (select public.user_admin_team_ids())
    or org_id in (select public.user_admin_org_ids())
  );

-- ═══ memberships — let org admins manage their org's team rosters ═
-- (self-service + team-admin already covered in 0004; this adds the
-- org-admin reach so an org admin isn't locked out of team rosters.)
drop policy if exists "memberships insert team-admins-or-self" on public.memberships;
create policy "memberships insert team-admins-or-self" on public.memberships for insert to authenticated
  with check (
    user_id = auth.uid()
    or team_id in (select public.user_admin_team_ids())
    or team_id in (select id from public.teams where org_id in (select public.user_admin_org_ids()))
  );

drop policy if exists "memberships delete team-admins-or-self" on public.memberships;
create policy "memberships delete team-admins-or-self" on public.memberships for delete to authenticated
  using (
    user_id = auth.uid()
    or team_id in (select public.user_admin_team_ids())
    or team_id in (select id from public.teams where org_id in (select public.user_admin_org_ids()))
  );

drop policy if exists "memberships update team-admins" on public.memberships;
create policy "memberships update team-admins" on public.memberships for update to authenticated
  using (
    team_id in (select public.user_admin_team_ids())
    or team_id in (select id from public.teams where org_id in (select public.user_admin_org_ids()))
  );
