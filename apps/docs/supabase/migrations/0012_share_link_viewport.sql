-- ──────────────────────────────────────────────────────────────────
-- 0012_share_link_viewport.sql
--
-- Carry the device preset into a share. The share toolbar lets the
-- creator pick a viewport (Responsive / Mobile 390 / Tablet 768 /
-- Desktop 1440); capture it on the link so the recipient opens the
-- screen framed the way the designer intended — part of the "share
-- contract". 'responsive' = fill the canvas (current behaviour), so
-- it's the safe default for every existing link.
--
-- Project-level defaults (e.g. a project that is "a mobile app" and
-- whose new shares inherit mobile) are a deliberate follow-up — this
-- migration only adds the per-share column.
-- ──────────────────────────────────────────────────────────────────

alter table public.share_links
  add column if not exists viewport text not null default 'responsive'
    check (viewport in ('responsive', 'mobile', 'tablet', 'desktop'));
