-- ──────────────────────────────────────────────────────────────────
-- 0002_normalise_screen_ids.sql
--
-- Studio moves from the v1 "everything in projects.snapshot JSONB"
-- model to fully-normalised rows: one row per screen (designs), one
-- row per chat message (messages), one row per screen-note (notes).
-- Comments were already normalised.
--
-- The blocker this migration clears: screen ids are minted CLIENT-side
-- (`d1a2b3…`, see apps/docs/lib/studio-designs.ts `nextId`), not as
-- UUIDs. The 0001 schema typed `designs.id` and every `design_id` FK
-- as `uuid`, so those client ids can't be stored. We retype them to
-- `text`.
--
-- Project ids stay `uuid` — those ARE server-generated (the page
-- adopts the id returned by createProject), so no change there.
--
-- Safe to run on the live project: it's in-flux with a single user
-- and (per design) no production data. The retype on empty/near-empty
-- tables is trivial. Every step is guarded so a re-run is a no-op.
-- ──────────────────────────────────────────────────────────────────

-- Drop the FKs that reference designs(id) so the PK column can be
-- retyped. They're re-added at the bottom against the new text type.
alter table public.messages          drop constraint if exists messages_design_id_fkey;
alter table public.notes             drop constraint if exists notes_design_id_fkey;
alter table public.comment_threads   drop constraint if exists comment_threads_design_id_fkey;

-- Retype the screen primary key + drop its uuid default. Screens are
-- created with a client-minted id passed straight into the insert, so
-- the column no longer auto-generates.
alter table public.designs  alter column id drop default;
alter table public.designs  alter column id type text using id::text;

-- The active-screen pointer on projects holds a screen id too — it
-- must follow designs.id to text. It's a soft pointer (no FK), so a
-- plain type change is enough.
alter table public.projects alter column active_design_id type text using active_design_id::text;

-- Retype every referencing column to match.
alter table public.messages          alter column design_id type text using design_id::text;
alter table public.notes             alter column design_id type text using design_id::text;
alter table public.comment_threads   alter column design_id type text using design_id::text;

-- Re-add the FKs (now text → text) with the same cascade behaviour
-- 0001 declared.
alter table public.messages
  add constraint messages_design_id_fkey
  foreign key (design_id) references public.designs (id) on delete cascade;

alter table public.notes
  add constraint notes_design_id_fkey
  foreign key (design_id) references public.designs (id) on delete cascade;

alter table public.comment_threads
  add constraint comment_threads_design_id_fkey
  foreign key (design_id) references public.designs (id) on delete cascade;

-- The v1 snapshot blob is no longer the source of truth — designs /
-- messages / notes are read from their own tables. Keep the column
-- around (nullable, unused) for now so any stray reader doesn't 500;
-- a later migration can drop it once nothing references it.
--   alter table public.projects drop column snapshot;
