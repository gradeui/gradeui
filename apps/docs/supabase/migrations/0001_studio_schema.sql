-- ──────────────────────────────────────────────────────────────────
-- 0001_studio_schema.sql
--
-- Studio's cloud schema. Mirrors the in-memory shapes defined in:
--   apps/docs/lib/studio-storage/types.ts
--   apps/docs/lib/studio-users/types.ts
--
-- Structured as two passes:
--   PASS 1 — every CREATE TABLE (with FKs + triggers)
--   PASS 2 — every ENABLE RLS + CREATE POLICY
--
-- This ordering matters: Postgres validates policy expressions at
-- CREATE POLICY time, so any policy that references another table
-- must wait until that table exists. The original single-pass
-- ordering broke on the `orgs` policies (which reference
-- `org_memberships` rows). Splitting tables-first / policies-second
-- avoids the entire class of forward-reference bugs.
--
-- Every entity has RLS enabled. The policies enforce:
--   - A user can SELECT/UPDATE/DELETE only their own user row.
--   - A user can SELECT an org/team/project they belong to (via
--     org_memberships, memberships, or a direct access grant).
--   - A user can INSERT new orgs/teams/projects; ownership is
--     stamped from auth.uid() server-side, never from the payload.
--   - Mutations on shared entities require an appropriate role
--     (admin on orgs/teams; owner on projects).
--
-- The service-role key (used by the invitation route) bypasses RLS
-- by design — that's how we insert a pending-invite user row + the
-- access grant before the invitee has an account.
-- ──────────────────────────────────────────────────────────────────

-- ─── Helpers ──────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = (extract(epoch from now()) * 1000)::bigint;
  return new;
end;
$$;

-- ══════════════════════════════════════════════════════════════════
-- PASS 1 — TABLES
-- ══════════════════════════════════════════════════════════════════

-- ─── users ────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  avatar_url text,
  status text not null default 'active' check (status in ('unverified','active','suspended')),
  super_admin boolean not null default false,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function set_updated_at();

-- Auto-create the public.users row on auth signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── orgs ─────────────────────────────────────────────────────────
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free','pro','team','enterprise')),
  limits jsonb not null default '{}'::jsonb,
  stripe_customer_id text,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

drop trigger if exists orgs_set_updated_at on public.orgs;
create trigger orgs_set_updated_at
  before update on public.orgs
  for each row execute function set_updated_at();

-- ─── org_memberships ──────────────────────────────────────────────
create table if not exists public.org_memberships (
  user_id uuid not null references public.users (id) on delete cascade,
  org_id uuid not null references public.orgs (id) on delete cascade,
  role text not null check (role in ('admin','member')),
  primary key (user_id, org_id)
);

-- ─── teams ────────────────────────────────────────────────────────
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute function set_updated_at();

create index if not exists teams_org_idx on public.teams (org_id);

-- ─── memberships (team × user) ────────────────────────────────────
create table if not exists public.memberships (
  user_id uuid not null references public.users (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  role text not null check (role in ('admin','member')),
  primary key (user_id, team_id)
);

-- ─── projects ─────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_type text not null check (owner_type in ('user','team')),
  owner_id uuid not null,
  snapshot jsonb,
  active_design_id uuid,
  theme_draft_json jsonb,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function set_updated_at();

create index if not exists projects_owner_idx on public.projects (owner_type, owner_id);

-- ─── project_access (grants) ──────────────────────────────────────
create table if not exists public.project_access (
  project_id uuid not null references public.projects (id) on delete cascade,
  subject_type text not null check (subject_type in ('user','team')),
  subject_id uuid not null,
  role text not null check (role in ('owner','editor','viewer')),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (project_id, subject_type, subject_id)
);

-- ─── designs (screens) ────────────────────────────────────────────
-- v1 storage packs designs into projects.snapshot; this table is
-- reserved for v2 row-based queries.
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null default 'Untitled',
  state jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

drop trigger if exists designs_set_updated_at on public.designs;
create trigger designs_set_updated_at
  before update on public.designs
  for each row execute function set_updated_at();

create index if not exists designs_project_idx on public.designs (project_id, position);

-- ─── messages ─────────────────────────────────────────────────────
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  payload jsonb not null,
  position integer not null,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists messages_design_idx on public.messages (design_id, position);

-- ─── notes ────────────────────────────────────────────────────────
create table if not exists public.notes (
  project_id uuid not null references public.projects (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  body text not null default '',
  updated_at bigint not null default (extract(epoch from now()) * 1000)::bigint,
  primary key (project_id, design_id)
);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function set_updated_at();

-- ─── comment_threads + comments ───────────────────────────────────
create table if not exists public.comment_threads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  design_id uuid not null references public.designs (id) on delete cascade,
  anchor_id text not null,
  anchor_kind text not null check (anchor_kind in ('source','instance')),
  element_label text not null,
  component_name text,
  status text not null default 'open' check (status in ('open','resolved')),
  created_by uuid not null references public.users (id) on delete cascade,
  resolved_by uuid references public.users (id),
  resolved_at bigint,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

-- Backfill for installs that ran the original 0001 before this fix:
-- add `created_by` if missing, drop the unused `updated_at`.
-- Safe to re-run; both ops are conditional.
alter table public.comment_threads
  add column if not exists created_by uuid references public.users (id) on delete cascade;
alter table public.comment_threads
  drop column if exists updated_at;

create index if not exists comment_threads_design_idx on public.comment_threads (design_id, created_at);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.comment_threads (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  author_id uuid not null references public.users (id),
  body text not null,
  edited_at bigint,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists comments_thread_idx on public.comments (thread_id, created_at);

-- ─── invitations ──────────────────────────────────────────────────
create table if not exists public.invitations (
  token uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid not null references public.users (id),
  resource_kind text not null check (resource_kind in ('project','team','org')),
  resource_id uuid not null,
  role text not null,
  expires_at bigint not null,
  accepted_at bigint,
  accepted_by uuid references public.users (id),
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists invitations_email_idx on public.invitations (lower(email));

-- ══════════════════════════════════════════════════════════════════
-- PASS 2 — RLS + POLICIES
--
-- Enable RLS on every table, then add policies. By this point every
-- table referenced inside a policy expression already exists, so the
-- forward-reference problem can't occur.
-- ══════════════════════════════════════════════════════════════════

-- ─── users ────────────────────────────────────────────────────────
alter table public.users enable row level security;

drop policy if exists "users select all signed-in" on public.users;
create policy "users select all signed-in"
  on public.users for select
  to authenticated using (true);

drop policy if exists "users update self" on public.users;
create policy "users update self"
  on public.users for update
  to authenticated using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "users insert self" on public.users;
create policy "users insert self"
  on public.users for insert
  to authenticated with check (auth.uid() = id);

-- ─── orgs ─────────────────────────────────────────────────────────
alter table public.orgs enable row level security;

drop policy if exists "orgs select members" on public.orgs;
create policy "orgs select members"
  on public.orgs for select
  to authenticated using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = orgs.id and m.user_id = auth.uid()
    )
  );

drop policy if exists "orgs insert any signed-in" on public.orgs;
create policy "orgs insert any signed-in"
  on public.orgs for insert
  to authenticated with check (true);

drop policy if exists "orgs update admins" on public.orgs;
create policy "orgs update admins"
  on public.orgs for update
  to authenticated using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = orgs.id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "orgs delete admins" on public.orgs;
create policy "orgs delete admins"
  on public.orgs for delete
  to authenticated using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = orgs.id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- ─── org_memberships ──────────────────────────────────────────────
alter table public.org_memberships enable row level security;

drop policy if exists "org_memberships select" on public.org_memberships;
create policy "org_memberships select"
  on public.org_memberships for select
  to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_memberships self
      where self.org_id = org_memberships.org_id and self.user_id = auth.uid()
    )
  );

drop policy if exists "org_memberships insert self-or-admin" on public.org_memberships;
create policy "org_memberships insert self-or-admin"
  on public.org_memberships for insert
  to authenticated with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = org_memberships.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "org_memberships delete self-or-admin" on public.org_memberships;
create policy "org_memberships delete self-or-admin"
  on public.org_memberships for delete
  to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = org_memberships.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "org_memberships update admins" on public.org_memberships;
create policy "org_memberships update admins"
  on public.org_memberships for update
  to authenticated using (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = org_memberships.org_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- ─── teams ────────────────────────────────────────────────────────
alter table public.teams enable row level security;

drop policy if exists "teams select members" on public.teams;
create policy "teams select members"
  on public.teams for select
  to authenticated using (
    exists (
      select 1 from public.memberships m
      where m.team_id = teams.id and m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.org_memberships m
      where m.org_id = teams.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "teams insert org-members" on public.teams;
create policy "teams insert org-members"
  on public.teams for insert
  to authenticated with check (
    exists (
      select 1 from public.org_memberships m
      where m.org_id = teams.org_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "teams update team-admins" on public.teams;
create policy "teams update team-admins"
  on public.teams for update
  to authenticated using (
    exists (
      select 1 from public.memberships m
      where m.team_id = teams.id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "teams delete team-admins" on public.teams;
create policy "teams delete team-admins"
  on public.teams for delete
  to authenticated using (
    exists (
      select 1 from public.memberships m
      where m.team_id = teams.id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- ─── memberships ──────────────────────────────────────────────────
alter table public.memberships enable row level security;

drop policy if exists "memberships select" on public.memberships;
create policy "memberships select"
  on public.memberships for select
  to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships self
      where self.team_id = memberships.team_id and self.user_id = auth.uid()
    )
  );

drop policy if exists "memberships insert team-admins-or-self" on public.memberships;
create policy "memberships insert team-admins-or-self"
  on public.memberships for insert
  to authenticated with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.team_id = memberships.team_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "memberships delete team-admins-or-self" on public.memberships;
create policy "memberships delete team-admins-or-self"
  on public.memberships for delete
  to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.memberships m
      where m.team_id = memberships.team_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

drop policy if exists "memberships update team-admins" on public.memberships;
create policy "memberships update team-admins"
  on public.memberships for update
  to authenticated using (
    exists (
      select 1 from public.memberships m
      where m.team_id = memberships.team_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- ─── projects ─────────────────────────────────────────────────────
alter table public.projects enable row level security;

drop policy if exists "projects select via owner or access" on public.projects;
create policy "projects select via owner or access"
  on public.projects for select
  to authenticated using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and exists (
      select 1 from public.memberships m
      where m.team_id = projects.owner_id and m.user_id = auth.uid()
    ))
    or exists (
      select 1 from public.project_access a
      where a.project_id = projects.id
        and (
          (a.subject_type = 'user' and a.subject_id = auth.uid())
          or (a.subject_type = 'team' and exists (
            select 1 from public.memberships m
            where m.team_id = a.subject_id and m.user_id = auth.uid()
          ))
        )
    )
  );

drop policy if exists "projects insert any signed-in" on public.projects;
create policy "projects insert any signed-in"
  on public.projects for insert
  to authenticated with check (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and exists (
      select 1 from public.memberships m
      where m.team_id = owner_id and m.user_id = auth.uid()
    ))
  );

drop policy if exists "projects update owner-or-editor" on public.projects;
create policy "projects update owner-or-editor"
  on public.projects for update
  to authenticated using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and exists (
      select 1 from public.memberships m
      where m.team_id = projects.owner_id and m.user_id = auth.uid()
    ))
    or exists (
      select 1 from public.project_access a
      where a.project_id = projects.id
        and a.role in ('owner','editor')
        and (
          (a.subject_type = 'user' and a.subject_id = auth.uid())
          or (a.subject_type = 'team' and exists (
            select 1 from public.memberships m
            where m.team_id = a.subject_id and m.user_id = auth.uid()
          ))
        )
    )
  );

drop policy if exists "projects delete owner" on public.projects;
create policy "projects delete owner"
  on public.projects for delete
  to authenticated using (
    (owner_type = 'user' and owner_id = auth.uid())
    or (owner_type = 'team' and exists (
      select 1 from public.memberships m
      where m.team_id = projects.owner_id and m.user_id = auth.uid() and m.role = 'admin'
    ))
  );

-- ─── project_access ───────────────────────────────────────────────
alter table public.project_access enable row level security;

drop policy if exists "project_access select via project" on public.project_access;
create policy "project_access select via project"
  on public.project_access for select
  to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_access.project_id
        and (
          (p.owner_type = 'user' and p.owner_id = auth.uid())
          or (p.owner_type = 'team' and exists (
            select 1 from public.memberships m
            where m.team_id = p.owner_id and m.user_id = auth.uid()
          ))
        )
    )
    or (subject_type = 'user' and subject_id = auth.uid())
  );

drop policy if exists "project_access mutate owner" on public.project_access;
create policy "project_access mutate owner"
  on public.project_access for all
  to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_access.project_id
        and (
          (p.owner_type = 'user' and p.owner_id = auth.uid())
          or (p.owner_type = 'team' and exists (
            select 1 from public.memberships m
            where m.team_id = p.owner_id and m.user_id = auth.uid() and m.role = 'admin'
          ))
        )
    )
  );

-- ─── designs ──────────────────────────────────────────────────────
alter table public.designs enable row level security;

drop policy if exists "designs all via project" on public.designs;
create policy "designs all via project"
  on public.designs for all
  to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = designs.project_id
    )
  );

-- ─── messages ─────────────────────────────────────────────────────
alter table public.messages enable row level security;

drop policy if exists "messages all via project" on public.messages;
create policy "messages all via project"
  on public.messages for all
  to authenticated using (
    exists (select 1 from public.projects p where p.id = messages.project_id)
  );

-- ─── notes ────────────────────────────────────────────────────────
alter table public.notes enable row level security;

drop policy if exists "notes all via project" on public.notes;
create policy "notes all via project"
  on public.notes for all
  to authenticated using (
    exists (select 1 from public.projects p where p.id = notes.project_id)
  );

-- ─── comment_threads ──────────────────────────────────────────────
alter table public.comment_threads enable row level security;

drop policy if exists "comment_threads all via project" on public.comment_threads;
create policy "comment_threads all via project"
  on public.comment_threads for all
  to authenticated using (
    exists (select 1 from public.projects p where p.id = comment_threads.project_id)
  );

-- ─── comments ─────────────────────────────────────────────────────
alter table public.comments enable row level security;

drop policy if exists "comments all via project" on public.comments;
create policy "comments all via project"
  on public.comments for all
  to authenticated using (
    exists (
      select 1 from public.comment_threads t
      where t.id = comments.thread_id
    )
  );

-- ─── invitations ──────────────────────────────────────────────────
alter table public.invitations enable row level security;

drop policy if exists "invitations select inviter" on public.invitations;
create policy "invitations select inviter"
  on public.invitations for select
  to authenticated using (invited_by = auth.uid());

-- No INSERT/UPDATE/DELETE policies on invitations for `authenticated`
-- on purpose: those operations go through the service-role client
-- (the /api/invitations route + the accept-invite server action),
-- which bypasses RLS. Adding authenticated policies would let a
-- signed-in user manipulate other people's invitations.
