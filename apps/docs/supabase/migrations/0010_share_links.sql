-- ──────────────────────────────────────────────────────────────────
-- 0010_share_links.sql
--
-- Public, obfuscated share links for a screen. The `token` is a random
-- UUID that goes in the URL (/s/<token>) — a separate capability key,
-- NOT the screen's real id, so internal ids never leak.
--
--   mode 'view'    → read-only
--   mode 'comment' → read + comment (future)
--   revision_id    → pin to a specific snapshot; NULL = always latest (live)
--
-- Access model:
--   • Owners/editors of the project manage their links (RLS below).
--   • PUBLIC viewers are NOT given any RLS grant here. The /s/<token>
--     route reads the link + screen via the service role (server-side),
--     returning ONLY that one screen — so anon never touches the tables
--     directly and tenant isolation holds.
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.share_links (
  token uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  design_id text references public.designs (id) on delete cascade,
  revision_id uuid references public.screen_revisions (id) on delete set null,
  mode text not null default 'view' check (mode in ('view', 'comment')),
  created_by uuid references public.users (id) default auth.uid(),
  revoked boolean not null default false,
  expires_at bigint,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists share_links_project_idx
  on public.share_links (project_id);

alter table public.share_links enable row level security;

-- Manage own / project-admin links. No anon policy on purpose.
drop policy if exists "share_links_manage" on public.share_links;
create policy "share_links_manage"
  on public.share_links for all
  to authenticated
  using (
    created_by = auth.uid()
    or public.user_can_admin_project(project_id)
  )
  with check (
    created_by = auth.uid()
    or public.user_can_admin_project(project_id)
  );
