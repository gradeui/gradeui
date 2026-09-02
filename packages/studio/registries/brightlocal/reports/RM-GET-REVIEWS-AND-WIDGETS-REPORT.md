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

### 3.7d There is no edit-in-place affordance anywhere in the DS

Asked directly (Ali, 2 Sep: *"Does this UI component library have a concept of
editing text in place?"*). The answer is no, in either half.

- The code allow-list carries 400-odd component names and none of them is an
  `EditableText`, `InlineEdit`, `EditableTitle` or equivalent.
- The Figma library's only match for "Inline" across all 1,691 components is
  `Typography / InlineCode`, which is a code span.

That matters because naming a thing you are building is a normal product
requirement and the natural pattern is an editable title in the header, not a
form field buried in step 3 of a wizard. Both RM wizards currently bury it, and
the Get Reviews campaign wizard spends a whole step on it, which is the same
requirement solved two different ways in one section.

What can be assembled from what exists is a plain `Input` in the header at
title size. It works, but it reads as a form field rather than a title, and
`Input` has no ghost or borderless variant to soften it: its variants are
`Horizontal Layout` x `Variant` (Text / File) x `State`. Making it look like a
title means overriding the component's own styling at the call site, which is
the thing this codebase deliberately does not do.

**Upstream ask:** an inline-edit affordance. Minimally a borderless/ghost
`Input` variant so a field can read as a heading until focused; better, a small
`EditableText` that owns the read/edit swap, the pencil affordance, and commit
on blur or Enter.

### 3.7c Figma's `Card` has no action slot, so header actions have nowhere to go

`Card` in Figma exposes `Card Content` and `Card Footer` as slots, plus
booleans for media/header/content/footer. There is no action slot, and the
`Card Header` frame is an instance sublayer, which Figma will not let you add
children to (`Cannot move node. New parent is an instance or is inside of an
instance`).

Every RM card that carries something in its header therefore cannot be built
faithfully:

- the widget cards' format badge (`Carousel`, `List`), top right of the header
- Reply Templates' `New template` and `New rule` buttons, top right of each
  card's header
- the campaign cards' status badge and overflow menu

All of them are pushed down into the content in the Figma rebuilds, which
changes the reading order: the action now sits below the description instead of
beside the title.

**Upstream ask:** a `Card Action` slot in the Figma component, matching what
the code's `CardAction` already does. The code has it; Figma does not, which
is the same shape of gap as 3.7b.

### 3.7b `Stepper` exists in code but NOT in the Figma library

Finding 3.6b says there is no wizard *pattern*. There is also no wizard
*component in Figma*.

`@brightlocal/ui-components` ships the whole `Stepper` family and its
storybook page is `ui-components-stepper--docs`. The Figma library has nothing:
a full dump of every component and component set in
`Design System - UI Components` (1,691 rows, `docs/figma-library-keys.tsv`)
contains **zero** matches for "Stepper". The nearest things are `Icon /
StepBack` and `Icon / StepForward`, which are arrows.

So a designer laying out a wizard in Figma cannot use the component the
engineer will build it with. They have to draw a rail out of ellipses and
lines, and every wizard drawn that way will differ slightly from the last and
from the code. Both Figma rebuilds here carry a hand-rolled rail, named
`stepper-dot (hand-rolled, no Figma component)` so nobody mistakes it for an
instance and expects it to update with the library.

**Upstream ask:** publish `Stepper` to the Figma library. It is the second
half of 3.6b and the cheaper half: the component already exists, it just has
no Figma counterpart.

### 3.7 `--card` is not white, and only the app shell hides that

Every Grade page in this prototype shows white cards. None of them get that
from the token. Measured inside a screen with no `AppLayoutShell`:

```
--card          #f2f7f3     <- pale green
--background    #fcfdfc     <- near white
--card-border   #ffffff00   <- fully transparent
```

So a Card out of the box is a 3% green tint against a near-white page, with no
border to define its edge. It reads as a faint wash, not as a surface.

The reason nobody has noticed is that `AppLayoutShell`'s page-layer presets
overwrite the token inline on the shell element:

```
--card: light-dark(var(--ds-tailwind-colors-base-white), var(--ds-tailwind-colors-neutral-900))
```

Every section page wears a shell, so every section page gets white cards. The
moment a page does NOT wear one — `CentredLayout` for the Create Widget
wizard was the first — the raw token surfaces and the card comes out green.
Two screens in the same product, the same `Card` component, two different
colours, and the difference is which layout wrapper happens to be above it.

**Upstream ask:** `--card` should be white in the light theme, and
`--card-border` should be a real border token. A component's own default
should not depend on an ancestor layout to look right, and a shell preset
should be adjusting a surface, not correcting it. If the green IS deliberate
for some surface, it wants to be a named variant rather than the default that
everything then overrides.

**Local floor:** the Create Widget screen applies the same inline override the
shell uses, rather than hand-painting the card white. Copying the shell's own
declaration means the screen tracks the preset instead of forking from it, and
when the token is fixed upstream this line can simply be deleted.

### 3.6b There is no WIZARD pattern, only a `Stepper` component

Asked directly (Ali, 28 Aug: *"Is there a wizard pattern?"*), the honest answer
is: the component exists, the pattern does not.

**What ships.** `Stepper` and its family (`StepperNav`, `StepperItem`,
`StepperTrigger`, `StepperIndicator`, `StepperSeparator`, `StepperContent`,
`StepperTitle`, `StepperDescription`) are real, allow-listed, and good. The
storybook page is `ui-components-stepper--docs`. Both of its examples show the
RAIL only: a row of indicators, optionally with titles and descriptions.

**What does not ship.** Nothing says how the rest of a multi-step flow is put
together. Every one of these had to be invented twice, once for the Get Reviews
campaign wizard and once for Create Widget:

- where the step rail sits relative to the step's own heading
- whether each step is a Card, and whether the rail is inside or outside it
- where Back / Next live, and that the last step's Next relabels to the commit
  verb ("Create widget", "Put live")
- where a validation error goes when Next is blocked, and what it looks like
- how a step is skipped conditionally (a JSON feed widget has no design step,
  so the flow is 3 long, not 4, and the count has to follow)
- how Cancel behaves mid-flow, and whether leaving saves a draft
- what the flow ends on

Two teams building two wizards off this component will not produce the same
thing, and did not: the first pass here used an uppercase `Step 1 of 4` eyebrow
over a `Progress` bar, which is wrong twice over. `Progress` is a value bar, a
percentage of a known total, not a position in a sequence; and there is no
sanctioned eyebrow style to borrow. **The only small-uppercase label in the DS
is `StatCard`'s, whose sidecar defines it as labelling a value.** Using it above
a page heading is a misuse that nothing in the docs prevents.

**Upstream ask:** a composition recipe, the way `AuthPageShell` and
`DataTablePage` exist for their layouts. It only needs to answer the seven
points above. A `Wizard` wrapper owning step state, validation gating and the
footer would be better still, but the recipe alone would stop the drift.

**Local floor:** both wizards now use `Stepper` for the rail, with the step
heading as the Card title beneath it and the footer carrying Back / commit plus
an inline `text-destructive` error. `Create Widget` (`dmtctjykv0feb`) is the
cleaner of the two to copy.

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
- ~~**Back links on Get Reviews**~~ CLOSED 27 Aug, REOPENED AND CLOSED AGAIN
  28 Aug. Campaign insights and All feedback were two stacked in-body back
  links two levels deep. On 27 Aug they became one wide right-hand Drawer over
  the hub with Summary and All feedback as TABS. On 28 Aug Ali reversed the
  container ("the screens you have put in drawers should really be full
  screens, getreviews-02-campaign-summary should definitely be a full page"):
  56rem of funnel, chart and feedback table inside a scrolling overlay was the
  tell. It is a full-page view again, the five campaign actions are back in the
  PageHeader, and the tabs stayed.
  The reason it could not be a page the first time is now fixed: **`PageHeader`
  crumbs take an `onClick`.** `goto` carries a screen id and nothing else, so a
  screen that swaps its own body could not name its parent with one, and the
  only route home was an in-body back link. The last crumb is now the route
  home, which is what the trail was already claiming to be.

- ~~**Create widget was a view, not a screen**~~ CLOSED 28 Aug. Creating a
  widget is its own screen, `RM — Create Widget` (`dmtctjykv0feb`), on
  `CentredLayout`: no sidebar, no breadcrumbs, a Logo header and a centred
  column. It ends on the embed code rather than returning you to the list to
  hunt for it.
  **EDITING a widget stays in-page**, and this is a constraint, not a choice: a
  `goto` cannot say WHICH widget to open. Same reason the widget detail is a
  drawer. So Create is a screen and Edit is a view, which is a real
  inconsistency with no wiring available to remove it.
  Second seam: there is no store shared across screens, so a widget created on
  the new screen cannot appear in the list afterwards. The done state says the
  widget is ready and shows its embed code rather than pretending.

---

## 6. Second pass, 2 September 2026

Driven by Ali walking the running prototype and by two documents that had not
been read against it before: the **RM Design Brief** (Charlotte Watts, "Design
in a state that can be fed back on by end of August 2026") and the legacy
Figma file *Legacy Reviews Feature BL (Copy)*, which holds screenshots of the
shipped product.

### 6.1 The likert scale exists, and it is better placed than legacy's

Ali: *"I cant see any kind or likert scale?"*

It is there. The wizard's **Ask** step offers three feedback types — NPS 0 to
10, thumbs up/down, 5 stars — and `{{feedbackform}}` renders the **live
control** inside the email preview, not a placeholder.

The legacy product does have an NPS scale, and it is worth seeing where: it
sits inside the **Edit Template → Email Settings** step, drawn into the email
body colour-coded red/amber/green with "0 – Not likely" and "10 – Very
likely" anchors. So in legacy the scale is a property of the *email template*;
here it is a property of the *campaign*, which is what makes one campaign =
one ask = one insights page hold together. Same capability, better home.

### 6.2 The gap the audit names in itself

The audit says, of its own clickthrough: *"I have not included the 'set email
notifications' feature (yet)."* The legacy screens show what it was — a
modal reading "Would you like to be notified of your Internal Feedback scores
as email notifications?", with **No/Yes**, **Immediately/Daily**, **Only
negative / Only positive / Everything**, and **up to 5 email addresses**, plus
a banner noting "Thumbs and Stars Alerts are not available yet".

That model is now built, on DS components, as the **Email alerts** section of
`RM — Report Settings`. `InputList` carries the five addresses; the cap is
enforced in `onValueChange` because InputList has no `maxItems`.

STILL OPEN: legacy has TWO notification surfaces, and only one is built. The
report-level one (a new REVIEW arrived) is done. The **campaign-level** one
(internal feedback scores from a Get Reviews campaign) is not, and it belongs
on the wizard's feedback step, since it only applies to feedback-first
campaigns.

### 6.3 Everything the brief lists that had nowhere to live

The brief's Monitor Reviews section lists these as shipped today and carrying
straight over. NONE of them existed anywhere in the prototype, and Review
Insights' **Settings** button was a control that did nothing when pressed:

| Brief line | Now at |
|---|---|
| configure schedule, run day | Report Settings → Schedule |
| monitored directories | Report Settings → Monitored directories |
| "panel showing which directories a profile was matched on" | the match badge per row, same list |
| country-scoped directory picker | the country Select scopes that list |
| email alerts | Report Settings → Email alerts |
| public / white-label share link | Report Settings → Sharing |
| report run history table | Report Settings → Run history |
| run report on demand | the page header action |
| PDF export | Insights → Download (was also dead) |

`RM — Report Settings` is `dmtkj124xagqa`. It is a SCREEN, not a dialog: five
sections, three of them lists that grow, and a genuine reason to own a URL —
"here is what we monitor for this location" is a thing one person sends
another, and a dialog cannot be sent.

Deliberately NOT there: create/delete of the report itself. On the new
platform the report IS the location, so there is no list to add to.

### 6.4 DS findings from this pass

**3.8 `Input` and `Textarea` ship at 16px against 14px labels.** Measured on
the live email step: control value `text-base` (16px), `FieldLabel` 14px,
`FieldDescription` 14px, `CardTitle` 24px. 16px on a form control is a
defensible DS-wide choice — it is the size that stops iOS zooming the page on
focus — but it is not paired with a matching label size, so the text a user
TYPES is a full step larger than the label naming it. In a wizard's narrow
column that is the first thing you see (Ali: *"text is too big here"*).
Worked around inside `WizardShell` only, as a scoped `<style>` on `data-slot`,
so one surface deviates deliberately rather than thirty call sites each
carrying a className. Delete that block when the DS settles its scale.

**3.9 `DropdownMenuTrigger asChild` around a `Button` can take a whole screen
down.** `<DropdownMenuTrigger asChild><Button dataHook=…><Download/>Download
</Button></DropdownMenuTrigger>` throws *"Primitive.button failed to slot onto
its children. Expected a single React element child or `Slottable`"*, and the
page renders BLANK — not a broken button, no page. Wrapping the icon and the
label in a single `<span>` did not fix it. Every dropdown trigger elsewhere in
RM happens to be icon-only, which is why nothing had hit it. Review Insights'
Download is a `Dialog` now, matching the campaign page, which is the better
answer anyway: PDF and CSV are two different asks and the dialog has room to
say which is which.

**3.10 `StatCard`'s label was uppercase, with no knob.** Fixed in the
component (it is ours, in `@brightlocal/proposal`), not at the call site — it
is used on five pages. `level="nested"` now steps the number down 30px → 24px
as well, since the surface was already stepping down and the number was not.

**3.11 `PageHeader` had no slot for a date that is not a freshness stamp.**
`lastUpdated` hardcodes the words "Last updated", which is right for a report
and wrong for a campaign, whose date is "Sent March 12, 2026" — a fact about
the thing, not the age of the data. Added `statusRight`, same position and
treatment, caller's copy.

### 6.5 Consistency rules now enforced across RM

Ali: *"I think we need some consistency here. There probably aren't that many
rules."* There were three, and they are:

1. **Destructive actions ask in an `AlertDialog`, never inline.** A red panel
   opening inside a card reads as an error that has HAPPENED, not a question
   being asked, and it reflows the grid around it. Was inline on Review
   Widgets and on Get Reviews draft cards; both are dialogs now, matching
   Reply Templates' blocked delete and Get Reviews' stop/cancel.
2. **No interpunct-separated fact strings. Key/value rows.** "Live feed: 5
   star, 4 star, recommended · Google, Trustpilot · last 12 months" is three
   facts glued into a sentence that wrapped to two lines on every card.
   Widget cards and campaign cards are rows now, right-aligned values,
   hairline between.
3. **Absolute dates, ONE format, everywhere.** "5 days ago", "Last activity
   today", "2 hours ago" and "just now" are gone from every RM screen. Every
   date goes through `formatDate` / `formatDateTime` from
   `@brightlocal/proposal` — the same functions the page header's Last updated
   line uses — so a date on a card and a date in a header read identically.
   Relative dates were also unanchored: two cards both saying "today" tell you
   nothing about which happened first, and a screenshot of one dates itself.

### 6.6 Wizard changes from the walkthrough

- **Errors moved out of the footer.** They sat inline with Cancel / Back /
  Next, which is the one row on the page that is about NAVIGATION. `WizardShell`
  owns an `error` slot now and renders it under the step content as a DS
  `FieldError`, so all three wizards agree.
- **The preview pager became tabs.** Arrows told you nothing about how many
  previews existed, and the circular buttons sat over the frame below and read
  as part of the preview.
- **The send step became a contact sheet.** Every page at half scale, real
  width transformed down so the wrapping is the customer's, any tile opening
  full size. At "ready to send?" the job is checking everything, which a tab
  strip cannot show.
- **"Preview as a customer" did nothing in the wizard.** The drawer was
  mounted inside the app shell and the wizard returns before it, so the
  control set state nothing rendered. Mounted in both places.
- **A campaign has an accent colour**, six DS ramp tokens with grey first and
  default, remapping `--primary` on the customer surfaces. Nothing in the
  brief specifies a branding model for Get Reviews; this is the smallest one
  that stops the customer seeing BrightLocal's green on a page that belongs to
  the business.
- **Stars went gold.** `fill-primary` made them green. A green star does not
  read as a rating, and amber is what every review site uses. It stays amber
  whatever the accent colour is: the star is a unit, like a percent sign.
- **No logo means no mark.** A lettered monogram used to stand in. Initials
  are an avatar convention — they replace a missing photo of a PERSON. A
  business that has not given us a logo has not given us one, and inventing a
  monogram puts something on a customer's screen the business never approved.
- **The feed has a review cap.** "Newest 3 / 5 / 10 / 20", feed-only: a
  hand-picked widget's limit IS the number picked, so a second number that
  could disagree with it is a contradiction. Without it a carousel on a
  homepage grows without bound.

### 6.7 The wizards are not all screens, and one of them cannot be

Worth stating plainly, because they look identical:

| Wizard | Its own screen? |
|---|---|
| Create Widget | YES — `dmtctjykv0feb` |
| Edit widget | no, a view inside `RM — Review Widgets` |
| Get Reviews campaign | no, a view inside `RM — Get Reviews` |

All three render the same `WizardShell`, full page, out of the app shell. Only
the first is a row in `designs`.

`data-grade-goto` carries a screen id and NOTHING ELSE, so it cannot say WHICH
widget or WHICH campaign to open. Creating carries no record, so it can be a
screen; editing carries one, so it cannot. Same reason the widget detail is a
drawer.

The campaign wizard COULD be split the same way, since "new campaign" carries
no record either. The cost is that it leans on ~900 lines it shares with the
campaign page (`CustomerPage`, `EmailPreview`, `SmsPreview`, `PreviewSheet`,
the brand palette, the credits flow, `buildFlow`), so doing it properly means
lifting that set into a registry lib module the way `wizard-shell` went, then
re-pointing the capture states, the three branch flows and a new share token.
