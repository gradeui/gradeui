# RM Get Reviews + Review Widgets — build notes, findings and open questions

**Date:** 19 Aug 2026
**Package under test:** `@brightlocal/ui-components@2.25.0`, `@brightlocal/icons@2.3.1`
**Screens:**
- `RM — Get Reviews` (`dmt094j963aye`)
- `RM — Review Widgets` (`dmt094lhmpwbs`)

Both in project *Brightlocal Vision - Share*.

**Source material:** Harry Brignull's *UX Audit and Redesign Proposal for the
BrightLocal Reviews Feature* (11 Aug 2026), section 3.3 and the IA in 2.1, plus
the Claude Design clickthroughs in `BrightLocal Review Inbox - Newer.zip`
(`Get Reviews.dc.html`, `Review Widgets.dc.html`, `Get Reviews Docs.dc.html`).

**Method:** built onto real DS components against the live contracts, then walked
every branch in the running embed and fixed what the walk exposed. Nothing below
is inferred from docs.

---

## 1. What the audit asked for, and what these screens do

The audit's central move on Get Reviews is a **conceptual simplification**: one
campaign has ONE collector (channel) and ONE insights page. The legacy product
used the word "campaign" for both the container and the mailshots inside it, so a
campaign could contain campaigns. That is gone. To run the same ask again you
duplicate the campaign.

Everything on the Get Reviews screen follows from that:

- the hub is a flat grid of campaign cards, one card per campaign, plus a create tile
- each card drills into its own insights page
- "Re-use as new campaign" is on the card menu, on the insights page, and as the
  first question of the wizard, because duplication IS the repeat mechanism

Review Widgets follows the audit's two journeys: **hand-picked** (a fixed set)
and **live feed** (a filter that keeps itself current, with per-review excludes).

### Where these screens deliberately differ from the prototype

| Prototype | Here | Why |
|---|---|---|
| Customer view is a full-screen takeover with an "exit preview" bar | Right-hand **Drawer** | It is a preview OF the thing being edited. The editor should still be there when it closes. |
| Widgets auto-named by format ("List widget") | User-named, defaulted to the format | Three widgets called "List widget" is a dashboard you cannot read. One input fixes it. |
| Review picker is a bespoke list with hand-rolled checkboxes | DS `useDataTable` | Selection, select-all, keyboard model, search and paging come from the DS, and the screen then behaves exactly like Review Inbox. |
| "Step N of M" from the first step | "Step N" until the shape is known | The flow length is not knowable until the ask AND the channel are answered. Showing "3" and climbing to "12" is a promise the wizard cannot keep. |
| Legal footer editable on both the first email and the follow-up | Editable once, noted on the follow-up | It is one field on the campaign. Two editors for one value invite the belief they differ. |
| Feedback-first vs straight-to-review presented as a neutral pair | Same pair, plus a standing note that everyone reaches the review page | See section 2. |

---

## 2. Review gating (audit section 3.3.X) is designed OUT, not warned about

The audit flags real exposure: the legacy feature can be configured so that low
scorers never see the public review link. That is review gating, and under the
FTC's Consumer Reviews Rule (16 CFR 465.7, effective 21 Oct 2024) suppression by
sentiment is a violation per interaction, with the Fashion Nova settlement as the
template for enforcement against tool vendors.

The design decision taken here: **there is no configuration that routes a low
score away from the review page.** Both campaign types end at the same review
page; the only difference is whether internal feedback is collected first. The
UI states this on the campaign-type step and again in the info dialog, so the
rule is legible, not just enforced.

If that decision is ever reopened, it should be reopened deliberately. It is the
one thing on this screen that is a legal position and not a preference.

---

## 3. DS findings

### 3.1 `Rating`'s empty star uses a SURFACE token, so it inverts on dark

`Rating` paints the unfilled star `fill-muted stroke-muted`. `--muted` is the
near-white surface token (measured `rgb(242, 247, 243)` in the light theme).

On a light card that reads correctly as a pale star. On any DARK surface it
renders near-white against a dark ground, so the empty stars read as the
*brightest* thing in the row and a 2-star review looks like 5 stars. Measured on
the widget preview's dark setting before the fix:

```
card background   rgb(36, 43, 37)
empty star fill   rgb(242, 247, 243)   <- brighter than the filled amber
filled star fill  rgb(250, 204, 21)
```

**Upstream ask:** the empty star wants a border/neutral token that follows the
surface, or `Rating` wants a `tone` prop for use on inverted grounds.

**Local floor:** the widget preview draws its own stars. That is defensible here
for a second reason: the preview is rendering the CUSTOMER's website, which is
outside Grade's theme entirely.

### 3.2 A `Button` inside `TooltipTrigger asChild` loses its `data-hook`

Verbatim from the running row before the fix:

```html
<button aria-label="Leave out of this widget" class="rounded-full inline-flex …">
```

`dataHook` was passed and `aria-label` survived; `data-hook` did not. The Slot
merge drops it. That silently breaks the house QA-hook contract for any
tooltipped icon button, and it fails quietly, which is the worst kind.

**Local floor:** the hook is stamped on a wrapper `span` so the instance is still
addressable. **Upstream ask:** Slot should preserve `data-*`.

### 3.3 `AlertInfo` / `AlertWarning` take `description`, not children

Not a defect, but it costs a round trip every time. `<AlertInfo>…</AlertInfo>`
with an `AlertDescription` child renders nothing; the API is
`title?` / `description` (required) / `action?`. The `action` slot is good and
under-advertised: the "Buy SMS credits" button on the credit-shortfall warning
sits in it.

### 3.4 `Dialog` and `DropdownMenu` roots take no `dataHook`

The contract puts `dataHook` on `DialogContent` and `DropdownMenuTrigger`, not on
the root. `AlertDialog` DOES take it on the root. That inconsistency is worth
levelling: three sibling overlay components, three different answers.

### 3.5 `DataTableSelectAllCheckbox` selects the PAGE, not the filtered set

With `pageSize: 8` and 30 matching rows, select-all chose 8. That is TanStack's
`toggleAllPageRowsSelected` behaviour and is a reasonable default, but on a
picker whose whole job is "choose up to 50", a page-scoped select-all is a trap.

**Not fixed here.** Worth deciding: either the header checkbox should select the
whole filtered set, or the DS should ship both (page / all) the way most tables
with paging do.

### 3.6 An all-`sr-only` header row leaves a visible empty band

Review Inbox hides its column headers because its rows read as a list, and gets
away with it because the header row still carries the select-all checkbox and the
bulk-action summary. In live-feed mode there is no checkbox, so the same trick
left a blank bordered band above the first row. These screens show real column
headers instead. Nothing to fix upstream; noting it because the sr-only-header
pattern is easy to copy without the thing that made it work.

---

## 4. Assumptions to check (they are also commented at the decision site)

1. **TripAdvisor is missing from `@brightlocal/icons`.** Both screens use
   Google / Facebook / Yelp / Trustpilot, all of which have official
   `*Original` marks. Review Inbox is currently carrying a redrawn TripAdvisor
   stand-in that its own header says must not ship; rather than draw a second
   one, these screens avoid the gap. Swap TripAdvisor back in the moment the
   real asset lands. Until then the demo data across the three Reviews screens
   does not agree on sources.
2. **"Yelp reviews cannot be published in a widget"** is stated as a policy limit
   in the researcher's prototype and is repeated here. Needs confirming.
3. **Campaign status vocabulary** (Live / Draft / Stopped) is the audit's
   proposal, not verified live-product wording.
4. **SMS credit rates** (UK 2, US/Canada 1) and 5c per credit come from the
   prototype and need a commercial check. The starting balance is set to 150 on
   purpose: below the UK cost of one 112-person send (224) and above the US cost
   (112), so a walkthrough can show both the comfortable path and the top-up path
   without editing the screen.
5. **The 50-review cap** on a hand-picked widget is the prototype's number.
6. **Facebook returns recommended / not recommended, not stars.** Taken from
   audit section 3.1.1, which also sets the precedent for how Facebook itself
   converts those to stars when averaging.

---

## 4b. 27 Aug pass — what changed, and what the API team should know

Both screens joined the Reviews sub-nav and lost their in-body back links.

**Navigation.** Per-item detail on both screens is now a right-hand Drawer over
the list, matching Review Inbox, Reply Templates and Review Widgets. This was
not a style preference. A `goto` carries a screen id and nothing else, so a
per-item view CANNOT be split into its own screen: there is no way to say WHICH
widget or WHICH campaign to open. A same-screen `goto` is also inert, so a
fourth breadcrumb pointing at the current screen renders as a link and does
nothing (measured). An overlay is the only shape that leaves the list behind
you and needs no invented back link.

**Review Widgets is demo-complete.** Create flow verified end to end: type,
filters, format, design, Create widget, and the drawer opens on the new widget
with its embed snippet. That is one step better than the researcher's
prototype, which returned to the list and made you click View to reach the
embed code.

**The 50-review cap now refuses rather than ignores.** The prototype made the
51st checkbox a silent no-op. It now warns at the ceiling and blocks the step
with a count of how many to remove.

**Sources differ across the section, deliberately.** Review Widgets carries
Google / Facebook / **Trustpilot**; Review Inbox and Review Insights carry
TripAdvisor and no Trustpilot. Confirmed by Ali on 27 Aug as correct rather
than an oversight. Worth stating to the API team, since it implies the widget
source list is not simply the inbox source list filtered.

**Still unverified, and both are the researcher's numbers, not the brief's:**
the 50-review cap, and the Yelp exclusion stated as a policy limit.

**The brief and the audit say almost nothing about widgets.** Roughly four
sentences between the two documents, no API ticketed, sequenced last, and the
audit has no widget section at all. Everything on that screen beyond list /
carousel / JSON feed and a rating filter comes from the researcher's
clickthrough, not from a committed requirement. AI Showcase curation is
explicitly out of scope for this round.

---

## 5. Known gaps in this first pass

- **Kiosk mode** is offered as a channel ("web link or kiosk") but there is no
  kiosk-specific configuration or full-screen kiosk view.
- **Email notification settings** for campaign activity. The audit notes the
  researcher had not covered them either.
- **The split-pane steps stack on mobile** rather than offering the prototype's
  Design | Preview tabs. Stacking works; tabs would be better on a phone.
- ~~**The Reviews hub page**~~ CLOSED 27 Aug. The hub now carries a two-card
  grid linking to Review Inbox and Review Insights.
- ~~**`nav` sub-rows for the Reviews area**~~ CLOSED 27 Aug. All four RM
  sub-tools are on the nav: Review Inbox, Review Insights, Get Reviews, Review
  Widgets. Order follows the audit's IA with the Inbox promoted to first per
  `reviews-subnav-spec.md` decision 1. No page in the section now stands on a
  bare `activeId="reviews"`, so decision 2's orphan case is gone.
- ~~**Back links on Get Reviews**~~ CLOSED 27 Aug. Campaign insights and All
  feedback were two stacked in-body back links two levels deep. They are now
  one wide right-hand Drawer (56rem cap) over the hub with Summary and All
  feedback as TABS, which removes the nesting rather than just the arrows. The
  five campaign actions moved from the PageHeader into the drawer footer,
  since that header now belongs to the hub behind it.
