# Reviews hub

## AI summary and What to do next

The page opens with an AI summary in its own style (Poppins narrative,
numbers set as metrics, bad news first with the why, a "Did you know"
that softens and instructs) and then the plan: a goal, key tactics, each
opening the tool that does it. Both are computed from ONE generated
review dataset per location (`lib/reviews-data.ts`), which the Review
Manager rows and the Review Tracker charts also read. So "out of your
last 10 reviews, 4 were 2 stars" is literally the top of the Manager.
The authored inputs live in `lib/location-profiles.ts` (`recent`:
last-N lows, month-on-month change, the spike and its campaign, the
theme customers mention).

The landing page for the Reviews area. Four cards, one per tool, each
with a headline number and a breakdown capped at three parts.

## What is proposed

- Cards are signposts, not stat tiles: one headline that implies an
  action ("26 need a reply"), then a breakdown that stops it being
  ambiguous.
- Every figure was read off the page the card links to. Nothing is made
  up, and there is no store shared across the four tools, so the numbers
  are static and must be changed here when a seed changes.

## Layout options

Three trends treatments explore putting movement on the hub: a sparkline
per card, an arrow only, and a range toggle. Pick one under Cmd+K,
Layout options.

## Open

- The Manager card says 60 all time while the Tracker card says 1,116
  reviews for the same location. Both are honest to their own page; side
  by side they read as a contradiction. Cheapest fix is relabelling the
  Manager part "In your inbox".
