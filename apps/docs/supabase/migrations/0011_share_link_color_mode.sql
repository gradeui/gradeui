-- ──────────────────────────────────────────────────────────────────
-- 0011_share_link_color_mode.sql
--
-- Carry the light/dark mode into a share. The theme COLOURS already
-- travel (projects.theme_draft_json), but the mode didn't — the share
-- view was hardcoded to light, so a dark-mode project rendered as the
-- light variant ("a different theme"). Capture the creator's mode at
-- share time and apply it in /s/<token>.
-- ──────────────────────────────────────────────────────────────────

alter table public.share_links
  add column if not exists color_mode text not null default 'light'
    check (color_mode in ('light', 'dark'));
