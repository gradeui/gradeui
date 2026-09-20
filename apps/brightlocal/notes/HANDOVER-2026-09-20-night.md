# Handover, night of 20 September 2026

Written for Ali to read first, before any of the frames or the diff. Two
Claude sessions worked this repo tonight, in agreed lanes; this note covers
the one that owned the capture suite, the promotion patches, Review Manager,
the Reviews hub, the Tracker and the shared facet menu. The other session
owns the Showcase page, the Figma file and the screenshot runs.

## The one that nearly cost you the evening

The app was returning a 500 on every page, and had been since the audit note
landed. The note quoted a class name with an ellipsis where a ramp step
should be. Tailwind's automatic source detection reads the notes as well as
the code, so that quote compiled into an unparseable declaration and took
`globals.css` with it. The first screenshot came back blank white, which is
how it was found. Fixed two ways in `aa0a61e`: the note names a real token,
and notes plus the root scripts are excluded from scanning. **Prose is not a
source. Never quote a class name in a note in this repo without checking
that it compiles.**

## Decisions an agent made that are yours to confirm or reverse

1. **The Sources legend's grouping note moved above the Other row.** It fixed
   a tooltip painting over it and stranding the words "total are", but it
   splits the legend into two groups and the sentence now arrives before you
   have seen an Other row. Visible in `insights-01` and `insights-02`.
2. **A sidebar divider was drawn on every screen, then removed again.** An
   agent added a 1px border at the rail's edge; the investigation of that same
   finding had said the DS never drew that rule and that adding one is a new
   decision about the shell. It is out, and the ledger entry now says a rule
   was tried and withdrawn rather than claiming a workaround that exists. If
   you want the rail separated, it costs nothing to reinstate: nothing moved
   when it was there.
3. **"836 five-star reviews" became 783 wherever a sentence promises a
   website.** 836 is the location's true five-star count; 53 of those are
   Yelp, which the Showcase's own banner says can never be republished. Counts
   still say 836, claims say 783. If BrightLocal would rather promise the
   larger number, this is the one to argue about.
4. **The Review Builder hub lost the count above its campaigns table** rather
   than gaining a filtered count. It now describes the page instead. Your
   17 Sep line about pagination is what that was read against.

## Two reported defects that were not defects

Worth knowing, because both look damning in a frame and neither is real.

- **The NPS timeline is not clipped.** No hard-coded domain, the axis runs to
  8, the data max is 7, and there is 23px of headroom above the peak. What the
  frame showed was the card above it, with its own sticky header pinned over
  its own chart. The suite now parks a card under the sticky band instead.
- **The email preview's footer is not cut off.** Nothing on the chain clips
  it: the frame was a 1280x900 crop of a scroller whose content continues
  below the fold, and the run was not `--full`.

Both are fixed in the capture suite, not in the product.

## The seam, and what still has to happen there

These screens are promoted out of Studio, and every app-side edit needs an
entry in `apps/brightlocal/scripts/promotion-patches.json` or the next
promotion silently reverts it.

- Six of tonight's Manager fixes were being reverted by stale entries that
  still held the pre-fix code. Fixed tonight.
- **Fourteen Showcase entries no longer find their anchors, and that predates
  tonight.** `check:promotions` says "all current" because it hashes the
  Studio source for drift; it never tests whether a `find` still matches. So
  the check cannot see this class of rot.
- Those fourteen are deliberately NOT repaired yet: the Showcase page is
  mid-restructure in the other session, so anything written now anchors
  against source that is about to move. When it settles, they get rewritten in
  one pass.
- **A decision for you:** once the restructure lands, most of those fourteen
  will describe a screen that no longer exists. Deleting them is probably more
  honest than re-anchoring them, and anything Studio can carry should move
  into the Studio screen instead of living as a patch. That is your call, not
  an agent's.

## Where the numbers come from, since they keep being mistaken for bugs

- **1,116** is the location's all-time reviews. **836** of them are five star.
- **60** is the Review Manager's inbox window, not a review count. Its ratings
  facet averages 4.5 because it is a different, newer set.
- **4.7** is the location's all-time average. Both numbers are right and they
  will keep looking like a contradiction to anyone reading two screens.

## Still running when this was written

The reply-queue fix in `manager/page.jsx`, the Manager and hub patch entries,
and syncing `ds/facet-menu.jsx` with its Studio registry twin. One earlier fix
made the reply-sent celebration's final state unreachable: counting every
"needs action" row included four on read-only sources that offer neither Send
nor Skip, so the panel could say four still need a reply with no way to answer
any of them. That is what the reply-queue agent is settling.

## For whoever picks this up

- Two sessions on one repo means neither has the whole conversation. An
  instruction given in one is invisible to the other, and an agent reading
  only its own transcript will conclude a real quote was invented. That
  happened tonight, in a commit message, about your own words. "I cannot find
  it" is not "it does not exist".
- The screenshot suite drives every screen by `data-hook`. A hook that
  disappears does not fail a build, it fails a frame, quietly.
- Row indices in the Manager states are derived, not chosen. They moved when
  the inbox switched to the shared dataset. The comment beside them says how
  to recompute rather than guess.
