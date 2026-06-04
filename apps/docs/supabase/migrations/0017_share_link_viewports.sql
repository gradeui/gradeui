-- ──────────────────────────────────────────────────────────────────
-- 0017_share_link_viewports.sql
--
-- Replace the enum viewport model with viewport SPECS: a share
-- carries ANY number of viewports, each named, arbitrarily sized and
-- orientable — "iPhone 15 Pro 393×852 landscape", "Kiosk 1080×1920" —
-- with the classic four presets as the default set. The creator
-- toggles which specs a share exposes (lock a share to the viewports
-- the screen actually supports), and which one it opens on.
--
-- `viewports` is a jsonb document owned by ShareViewportSpec in
-- lib/studio-storage/types.ts:
--
--   {
--     "initialId": "mobile",
--     "specs": [
--       { "id": "responsive", "label": "Responsive", "responsive": true },
--       { "id": "mobile", "label": "Mobile", "w": 390, "h": 844 },
--       { "id": "custom-1", "label": "Kiosk", "w": 1080, "h": 1920,
--         "orientation": "landscape" }
--     ]
--   }
--
-- No legacy migration: shares are cheap to re-mint and none are
-- precious yet (decision 2026-06-04), so existing rows are deleted
-- and the old enum columns dropped outright. Per-share THEME
-- assignment will land as a sibling jsonb column following the same
-- pattern — see STUDIO-THEMES.md.
-- ──────────────────────────────────────────────────────────────────

delete from public.share_links;

alter table public.share_links
  drop column if exists viewport,
  drop column if exists allowed_viewports;

alter table public.share_links
  add column if not exists viewports jsonb not null
    default '{
      "initialId": "responsive",
      "specs": [
        { "id": "responsive", "label": "Responsive", "responsive": true },
        { "id": "mobile", "label": "Mobile", "w": 390, "h": 844 },
        { "id": "tablet", "label": "Tablet", "w": 768, "h": 1024 },
        { "id": "desktop", "label": "Desktop", "w": 1440, "h": 900 }
      ]
    }'::jsonb;
