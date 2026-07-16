-- Share SCOPE (STUDIO-TAGS T2, first slice) — a share link can be
-- scoped to a SET of screens instead of the whole project:
--   { "tag": { "type": "flow", "value": "proposal-walkthrough" } }
--     → members resolve AT VIEW TIME by tag (re-tagging screens updates
--       what the link exposes — the tag IS the publish surface), or
--   { "screens": ["<designId>", …] }
--     → an explicit ad-hoc set ("share these two"), no tag ceremony.
-- NULL = today's behaviour (whole-project flow map). The share's
-- design_id remains the entry screen and is always a member.
alter table public.share_links
  add column if not exists scope jsonb;
