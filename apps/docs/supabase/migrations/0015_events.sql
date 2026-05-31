-- ──────────────────────────────────────────────────────────────────
-- 0015_events.sql
--
-- The cross-cutting activity trail. One append-only table every feature
-- writes into via logEvent(). See STUDIO-AUDIT.md.
--
--   "Ali created an image on {design_id} inside {project_id} at {created_at}"
--    actor_id ──┘            action ┘   target ┘
--
-- design_id is deliberately NOT a foreign key: an event must survive the
-- screen it describes (the "Ali deleted screen X" event outlives screen
-- X). project_id IS an FK + cascade — when a project is deleted its whole
-- trail goes with it, which is the only removal the trail allows.
--
-- Append-only by construction: SELECT + INSERT policies only, no UPDATE
-- or DELETE. History can't be rewritten or quietly erased.
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: a `share.view` by an anonymous, non-member viewer has no
  -- user. Those events are written server-side (service role) from the
  -- /s/<token> route, which bypasses the insert policy below. Member
  -- actions still stamp actor_id = auth.uid().
  actor_id uuid references public.users (id) default auth.uid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- The screen/variant. Plain text (no FK) so the event survives screen
  -- deletion. NULL = a project-level event.
  design_id text,
  -- Namespaced verb: "asset.generate", "comment.add", "screen.rename", …
  action text not null,
  target_kind text,
  target_id text,
  -- Human-facing context: { model, prompt, from, to, … }. No secrets.
  metadata jsonb,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists events_project_idx
  on public.events (project_id, created_at desc);
create index if not exists events_design_idx
  on public.events (design_id, created_at desc);

alter table public.events enable row level security;

-- Read the trail of any project you can read.
drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events for select to authenticated
  using (public.user_can_read_project(project_id));

-- Insert is gated on READ (commenting is a read-level action that should
-- be logged), and the actor must be yourself — you can't forge events as
-- someone else. The action's OWN permission is enforced by the action.
drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events for insert to authenticated
  with check (
    actor_id = auth.uid()
    and public.user_can_read_project(project_id)
  );

-- No UPDATE / DELETE policies on purpose → append-only.
