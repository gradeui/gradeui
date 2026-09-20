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
- The Showcase key was broken and is now rewritten, after the restructure
  settled: seventeen entries kept, twenty two deleted, nineteen added. Most of
  the deletions are not repairs declined, their subject is gone.
- One of those entries had been failing to match at all, which means the
  promoter would have exited there and the thirteen entries behind it had
  never run once. All thirteen produced text that does not survive into the
  app file anyway.
- **`check:promotions` cannot see any of this.** It hashes the Studio source
  against the stamp in the page header for drift. It never asks whether a
  `find` still matches, which is how one broken entry sat there with thirteen
  dead ones behind it while the guard stayed green. The real audit is to dump
  the Studio source, replay every entry, and report each one's match count
  instead of exiting at the first miss.

## The decision waiting for you: Showcase and Studio

Showcase was rebuilt into two pages tonight (a full bleed Select reviews, and
a preview-led Widget design with a card per part). Its promotion key has been
rewritten to match, and it is provably correct: every entry matches exactly
once, and the real promoter reproduces the app file byte for byte.

But look at what carrying it costs. The find and replace payload for this one
screen is **246,612 bytes, to produce a file of 188,914**. The patch is bigger
than the thing it patches. Only 10,801 bytes of that is genuinely app-side
work; the other 235,811 is the restructure itself, which is plain JSX that
Studio could hold. Roughly 23 to 1, against a file whose own `_why` says to
keep these minimal because anything Studio can carry belongs in Studio.

**My recommendation: promote the app copy back into Studio**, drop the
Showcase key to the dozen or so genuinely app-side entries, and stop carrying
the screen twice.

The sharp end is not tidiness, it is the embed. The `/e/` embed and the flow
videos render the STUDIO screen, not the app, so today they still show the
old rail and drawer. Every video recorded from here demonstrates a screen
that no longer exists, and `check:promotions` will keep saying "all current"
while that is true, because it hashes for drift and never asks whether a find
still matches.

I did not do it tonight on purpose: it writes to your Studio project, the
canvas clobbers MCP saves if it is open, and if it went wrong the embed and
the videos would break with nobody awake to notice. It wants you there.

## Where the numbers come from, since they keep being mistaken for bugs

- **1,116** is the location's all-time reviews. **836** of them are five star.
- **60** is the Review Manager's inbox window, not a review count. Its ratings
  facet averages 4.5 because it is a different, newer set.
- **4.7** is the location's all-time average. Both numbers are right and they
  will keep looking like a contradiction to anyone reading two screens.

## The reply queue, which one of tonight's own fixes broke

Making the celebration's count agree with the tab behind it meant counting
every "needs action" row, including four on read-only sources that offer
neither Send nor Skip. So the count floored at four, the panel could say four
still need a reply with no way to answer any of them, and the designed "that
was the last one" ending became dead code.

It now has three endings. The count still counts everything, so it still
agrees with the tab and the hub card, but "that was the last one" is decided
on the reviews this screen can actually post to. When that queue empties with
read-only rows left it says so, and the button becomes "See the ones left",
which opens the first of them where the alert offers Open in Apple Maps.
Proved by driving all 22 repliable reviews to done, and the true-empty ending
proved separately on the starter persona.

One judgement call in it is yours: the celebration now fires when there is
nothing left this screen can write, so on the engaged account you get the
confetti with four still sitting in the tab. Holding it back for a literally
empty inbox is a one line change.

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
