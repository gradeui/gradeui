# Walkthrough videos (queued 12 Sep 2026)

Ali: "walkthrough videos of each section, with different user types as
cut scenes. Videos and delight galore."

## The set

One video per section, two to three minutes, each built from persona
cut scenes so the same page is seen through different eyes. Title card,
then chapters, then a closing card with the one thing to do.

| # | Video | Chapters (persona cut scenes) | Delight beats |
|---|---|---|---|
| 1 | Insights, the overview | empty (first-run band) → starter (trial recap, the plan) → engaged (summary, Tell me more) → multi (Hove vs Brighton) → lapsed (win-back) | dialog reveal, tab cycle, hover an author, click for the next voice |
| 2 | Reviews hub | empty → starter (steps in the cards) → engaged (trend footers, chips) → agency (switching locations) | QR banner tap, generator sizes |
| 3 | Review Manager | starter (Google only, first reply) → engaged (backlog, plan dialog with the auto-reply example) → multi (comparison line) | Fix it for me, the sell column, See Pro into the account page |
| 4 | Review Tracker | starter (one site, connection list) → engaged (six-month tabs, values on bars) → multi (branch comparison) | auto-cycling tabs, connect a site |
| 5 | Review Builder | empty (first ask) → starter (QR card, print) → engaged (campaign spike, "why 3 Sep spiked") | QR generator A6/A5/A4 |
| 6 | Review Showcase | starter (three ready, none placed) → engaged (836 five-star, social-proof fact) | quote band |
| 7 | Insights & Actions: the roadmap | starter → engaged | stage rail, quote bands, help card |
| 8 | Account and pricing | starter (3 days left) → lapsed (win-back) → engaged (upgrade ladder) | recap modal on switch |
| 9 | Tones and dark | engaged in neutral → tinted → families → super bright → dark | the settings switch, Cmd+K |

## The cast

Three personas carry the section videos (Ali, 12 Sep): the trial
(`starter`), the engaged single location (`engaged`) and the
multi-location brand (`multi`). That is the trial story, the everyday
story and the comparison story, and it keeps each render short. The
overview alone runs all six, because the empty account, the agency and
the lapsed trial are each one scene there and nowhere else.

## The capture stage

`/meta/capture` loads any app path in an iframe at a fixed logical size
and scales it to fit the recorder's viewport, so a 1920x1080 video shows
a real 1280x900 page rather than a stretched one. Params:

    /meta/capture?url=<path>&w=1280&h=900&bg=violet&pad=88&radius=20&caption=...

`bg` is one of neutral, green, sky, violet, yellow, black, white, so the
canvas colour is chosen per shot in the flow file. No separate stitching
pass for the background. The recorder clicks inside with a frame
locator, and localStorage seeding reaches the iframe because it is the
same origin.

## Production

- Recorder: a flow runner for the standalone app, not the Studio share
  recorder. Same choreography format as scripts/flows/*.json (goto,
  wait, click, scroll, caption), plus two new steps: `persona` (seeds
  grade-bl-demo-v2 in localStorage and reloads, which is the cut) and
  `title` (a full-frame card: persona name, one line, the DS illustration).
  Base URL is the live site, so custom.css and fonts are the real ones.
- 2x native, 30 fps, lossless, then the existing join-sections and
  brand-video steps for the title cards and the end card.
- Captions in Bea's voice, one line per beat, from the same copy the
  page shows (no new claims).
- Stills first (the reshoot set) so the choreography can be checked
  before any render, per the house rule.

## Order

Overview first (it sells the rest), then Manager, then the hub, then the
others. Each video is its own flow file so one can be re-rendered
without the set.

## Cut-scene cards

`/meta/cards/<slug>` renders a full-frame 16:9 card with no chrome, on the
super-bright palette: persona cards (`persona-empty`, `persona-starter`,
`persona-engaged`, `persona-multi`, `persona-agency`, `persona-lapsed`)
and section cards (`beacon`, `hub`, `manager`, `tracker`, `builder`,
`showcase`, `roadmap`, `account`, `tones`, `end`). `/meta/cards` lists them.
The recorder's `title` step navigates there; the same URL screenshotted
at 1920x1080 is the Figma Slides frame. Content lives in lib/cards.ts.

## The stitched master

BUILT 10 Sep: `~/Desktop/brightlocal-videos/insights-master-2026-09-10/`
holds `insights-master.mp4` (7:50) and the `order.txt` it was cut from.
All six clips are 1920x1080 at 30fps, so it is a straight
`ffmpeg -f concat -c copy`, no re-encode and no quality loss. Re-cut it by
editing order.txt and running that command again.


One long cut of everything, in the order above: overview, hub, Manager,
Tracker, Builder, Showcase, roadmap, account, tones, end card. Built
with join-sections from the nine renders so any one can be re-rendered
alone. Chapters marked so Figma Slides can take it in pieces too.

## Where the videos live

`~/Desktop/brightlocal-videos/<flow-name>-<stamp>/` holds the mp4, the raw
webm Playwright wrote, and a copy of the flow file that produced it. Same
pattern as the screenshot drops: dated folders on the Desktop, nothing in
git (a two-minute 1080p cut is 10 to 30 MB and the repo is not the place).

Finals to share go wherever Ali wants them: Figma Slides takes the mp4
directly, and the prototype could serve them from `apps/brightlocal/public`
if a link is easier, at the cost of the repo size.

## In Figma

`Brightlocal - Reviews` has a **Beacon collateral** page (12 Sep):

- **Cut-scene cards** — all sixteen, laid out as a board, exactly as the
  app renders them.
- **Templates** — two components:
  - `Cut-scene card`, with Kicker, Title and Line as text properties and
    toggles for the illustration and the logotype. Change the frame fill
    for the surface colour.
  - `Scene card`, the recorder's own framing: a 1280x900 page scaled to
    0.796 with a 220px caption band under it, plus a Caption property.
    Drop a screenshot into the screen slot and lay out your own scenes.
- **Banners and popovers** — a named, correctly sized frame for every
  banner at 1440, 1180, 900 and 430, so the PNGs from the Figma export
  drop straight in. Each frame's hint says which file it wants.

The bridge cannot place images, so illustrations, logotypes and
screenshots are slots for a person to drop into. Everything else is
native Figma layers.
