# Narratives (12 Sep 2026)

Ali: "come up with a few interesting narratives separately, and splice
some videos together."

The overview walks the product. These three walk a *story*, and each one
answers a different question. Same components, same rows, different cut.
Each runs 60 to 90 seconds and works as a video or as a PDF deck.

---

## 1. The gap

**The question:** why is one branch behind, and would you have noticed?

Harbour & Co has three branches. Hove's lifetime rating looks fine at
4.4, which is exactly the problem: the lifetime number cannot move, so
nothing looks wrong. Insights reads the last thirty days at 4.0, then reads
the review text and finds two customers naming Brighton as the standard.
That is the whole insight: not "your rating dropped", but "your own
customers are telling you which branch to copy."

The arc: the hub summary, the comparison line, the plan on Manager, then
the Tracker showing the recent window against all time. Ends on the visit
to Brighton, not on a dashboard.

**Why it lands:** it is the one insight a human would take a week to
find, and it is true of the underlying rows.

---

## 2. The trial

**The question:** does the product earn the subscription?

Three days left. The trial has found four Google reviews, three of them
five stars, and nobody has replied to any of them. Insights shows what
auto-reply would have written on one of their own reviews, in their tone.
Then the trial ends, nine days pass, four more reviews arrive, nobody is
watching, and the win-back says exactly that.

The arc: the recap modal, the plan with the auto-reply example, the
subscription page and its upgrade ladder, then the lapsed account and the
win-back. Ends on the offer.

**Why it lands:** it is the commercial story told with the customer's own
data rather than a feature list, and the gated feature is demonstrated
before it is sold.

---

## 3. Day one to habit

**The question:** what does the product say to someone with nothing?

An empty account has no reviews, no sites connected, no campaigns. Every
page has to say something true anyway, so it says why it matters, with a
sourced number, and one thing to do. Then the same business a week in,
then eight months in with campaigns running and a spike Insights can
explain.

The arc: the empty hub's stat band, the QR code you can print today, the
starter's first reviews, the engaged account's six-month tabs, the
roadmap's three stages. Ends on "make reviews a habit, not a project".

**Why it lands:** it shows the product being useful before it has any
data, which is the hardest part and the one most prototypes skip.

---

## Splicing

Each narrative is its own flow file, so they render alone and cut
together. The stitched master runs: overview, then gap, then trial, then
day one, then the end card. `scripts/join-sections.mjs` at the repo root
does the concatenation.
