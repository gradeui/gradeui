-- 0020 — Per-project design-system REGISTRY (BYODS).
--
-- registry_id records which DesignSystemRegistry a project's screens are
-- written against ("gradeui", "brightlocal", …). PROJECT-level on purpose:
-- a screen's JSX targets one component vocabulary and the chat context /
-- refs / allowlist / exporters are project-scoped — screens inherit.
--
-- null = the deployment default (NEXT_PUBLIC_STUDIO_REGISTRY, else
-- gradeui) — so existing rows keep today's behaviour exactly and a
-- single-registry deployment never has to set it. No check constraint /
-- FK: registries live in code (packages/studio/src/registry), and an
-- unknown id falls back to the default at resolution time
-- (getRegistryById in apps/docs/lib/active-registry.ts) rather than
-- breaking reads. Additive + safe; no backfill.

alter table public.projects
  add column if not exists registry_id text;

comment on column public.projects.registry_id is
  'DesignSystemRegistry.id the project''s screens target (gradeui, brightlocal, …). null = deployment default. See STUDIO-BYODS.md.';
