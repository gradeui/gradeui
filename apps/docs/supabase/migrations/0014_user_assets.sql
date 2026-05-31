-- ──────────────────────────────────────────────────────────────────
-- 0014_user_assets.sql
--
-- User-owned assets — the bytes that make a prototype theirs (their
-- images, fonts, documents). See STUDIO-STORAGE.md.
--
-- Scope decision: assets are owned by a USER, not a project. Most users
-- end up with one project, and a logo / typeface / brand photo is theirs
-- to reuse across whatever projects they have. `project_id` is an
-- OPTIONAL tag (null = lives in the user's general library).
--
-- Types: 'media' (images/video), 'font', 'document' (pdf etc). The
-- column is an enum-style check so the browser can tab by type.
--
-- Bytes live in a PRIVATE Supabase Storage bucket; we mint short-lived
-- signed URLs on read (never expose a durable public URL to someone's
-- unreleased product art). Object path convention:  {owner_id}/{id}.{ext}
-- — owner-scoped at the object level so storage RLS is a folder check.
--
-- RLS mirrors the project model where it overlaps: you manage your own
-- assets; project members can READ an asset you've tagged to a project
-- they can read (via user_can_read_project from 0008).
-- ──────────────────────────────────────────────────────────────────

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) default auth.uid(),
  project_id uuid references public.projects (id) on delete set null,
  type text not null default 'media' check (type in ('media', 'font', 'document')),
  -- Object path inside the bucket: {owner_id}/{id}.{ext}
  path text not null,
  name text not null,
  content_type text not null,
  width int,
  height int,
  bytes bigint not null default 0,
  -- ── Provenance + enrichment ──────────────────────────────────────
  -- How the asset came to be. owner_id is already the *creator* (whoever
  -- pressed upload / "fill images" / "create image"); origin records the
  -- mechanism, source_prompt the description that produced it. This is
  -- the audit trail — and, for generated art, the bit that makes the
  -- asset feel alive (you can see/re-run the prompt that made it).
  origin text not null default 'upload'
    check (origin in ('upload', 'generated', 'filled', 'stock')),
  -- The description used to generate/fill it (null for plain uploads).
  source_prompt text,
  -- Accessibility + searchability; also the seed for enrichment.
  alt_text text,
  -- Open bag for derived metadata: alt-text suggestions, tags, dominant
  -- colours, detected objects, etc. JSONB so enrichment can grow without
  -- a migration per signal.
  enrichment jsonb,
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create index if not exists assets_owner_idx
  on public.assets (owner_id, type, created_at desc);
create index if not exists assets_project_idx
  on public.assets (project_id);

alter table public.assets enable row level security;

-- Owner manages their own library; project members may READ assets the
-- owner tagged to a project they can read.
drop policy if exists "assets_select" on public.assets;
create policy "assets_select" on public.assets for select to authenticated
  using (
    owner_id = auth.uid()
    or (project_id is not null and public.user_can_read_project(project_id))
  );

drop policy if exists "assets_insert" on public.assets;
create policy "assets_insert" on public.assets for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "assets_update" on public.assets;
create policy "assets_update" on public.assets for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "assets_delete" on public.assets;
create policy "assets_delete" on public.assets for delete to authenticated
  using (owner_id = auth.uid());

-- ─── Storage bucket (private) ───────────────────────────────────────
-- 25 MB per-object cap; tune later. `public=false` → all delivery is via
-- signed URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('user-assets', 'user-assets', false, 26214400)
on conflict (id) do nothing;

-- Object-level RLS: an object lives under its owner's folder, so the
-- gate is "the first path segment is my uid". Signed URLs (minted by the
-- owner's session, or server-side for shares) bypass this for delivery
-- to other viewers.
drop policy if exists "user-assets read own" on storage.objects;
create policy "user-assets read own" on storage.objects for select to authenticated
  using (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user-assets insert own" on storage.objects;
create policy "user-assets insert own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user-assets update own" on storage.objects;
create policy "user-assets update own" on storage.objects for update to authenticated
  using (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "user-assets delete own" on storage.objects;
create policy "user-assets delete own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
