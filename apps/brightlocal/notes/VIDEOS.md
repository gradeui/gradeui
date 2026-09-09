# Walkthrough videos (queued 12 Sep 2026)

Ali: "walkthrough videos of each section, with different user types as
cut scenes. Videos and delight galore."

## The set

One video per section, two to three minutes, each built from persona
cut scenes so the same page is seen through different eyes. Title card,
then chapters, then a closing card with the one thing to do.

| # | Video | Chapters (persona cut scenes) | Delight beats |
|---|---|---|---|
| 1 | Beacon, the overview | empty (first-run band) → starter (trial recap, the plan) → engaged (summary, Tell me more) → multi (Hove vs Brighton) → lapsed (win-back) | dialog reveal, tab cycle, hover an author, click for the next voice |
| 2 | Reviews hub | empty → starter (steps in the cards) → engaged (trend footers, chips) → agency (switching locations) | QR banner tap, generator sizes |
| 3 | Review Manager | starter (Google only, first reply) → engaged (backlog, plan dialog with the auto-reply example) → multi (comparison line) | Fix it for me, the sell column, See Pro into the account page |
| 4 | Review Tracker | starter (one site, connection list) → engaged (six-month tabs, values on bars) → multi (branch comparison) | auto-cycling tabs, connect a site |
| 5 | Review Builder | empty (first ask) → starter (QR card, print) → engaged (campaign spike, "why 3 Sep spiked") | QR generator A6/A5/A4 |
| 6 | Review Showcase | starter (three ready, none placed) → engaged (836 five-star, social-proof fact) | quote band |
| 7 | Insights & Actions: the roadmap | starter → engaged | stage rail, quote bands, help card |
| 8 | Account and pricing | starter (3 days left) → lapsed (win-back) → engaged (upgrade ladder) | recap modal on switch |
| 9 | Tones and dark | engaged in neutral → tinted → families → super bright → dark | the settings switch, Cmd+K |

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

`/cards/<slug>` renders a full-frame 16:9 card with no chrome, on the
super-bright palette: persona cards (`persona-empty`, `persona-starter`,
`persona-engaged`, `persona-multi`, `persona-agency`, `persona-lapsed`)
and section cards (`beacon`, `hub`, `manager`, `tracker`, `builder`,
`showcase`, `roadmap`, `account`, `tones`, `end`). `/cards` lists them.
The recorder's `title` step navigates there; the same URL screenshotted
at 1920x1080 is the Figma Slides frame. Content lives in lib/cards.ts.

## The stitched master

One long cut of everything, in the order above: overview, hub, Manager,
Tracker, Builder, Showcase, roadmap, account, tones, end card. Built
with join-sections from the nine renders so any one can be re-rendered
alone. Chapters marked so Figma Slides can take it in pieces too.
