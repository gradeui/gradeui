-- Comment PROVENANCE (18 Jul, Ali: "comments added within a flow
-- should be marked as such") — which share link a thread was created
-- through. NULL = authored in Studio. A flow/tag share can present a
-- screen in a specific visual context (variant knobs, datasets), so
-- feedback collected there carries that context; this column is the
-- mark. Display/filtering ("what did the Friday link say?") lands with
-- the F2 comments pass. Additive; FK clears on link deletion so
-- revoking/erasing a share never strands threads.
alter table public.comment_threads
  add column if not exists share_token uuid
    references public.share_links (token) on delete set null;
