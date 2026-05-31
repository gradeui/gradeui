-- ──────────────────────────────────────────────────────────────────
-- 0016_soft_delete.sql
--
-- Mark, don't destroy. Projects and screens get a `deleted_at` timestamp;
-- "delete" sets it, normal reads filter it out, and a restore clears it.
-- The revision spine (0009) means a restored screen comes back with its
-- full history; the activity trail (0015) logs the delete + restore.
--
-- NULL = live (every existing row). A true purge stays a separate,
-- explicit action — not wired here.
--
-- IMPORTANT behavioural change in the app layer (not SQL): saveProject
-- used to HARD-delete any screen missing from the in-memory list. With
-- soft-delete that implicit erasure is removed — screen removal becomes
-- an explicit deleteDesign() that sets deleted_at. See the adapter.
-- ──────────────────────────────────────────────────────────────────

alter table public.projects
  add column if not exists deleted_at bigint;

alter table public.designs
  add column if not exists deleted_at bigint;

-- Partial indexes keep the common "live rows only" reads fast.
create index if not exists projects_live_idx
  on public.projects (updated_at desc) where deleted_at is null;
create index if not exists designs_live_idx
  on public.designs (project_id, position) where deleted_at is null;
