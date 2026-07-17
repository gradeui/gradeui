# AI Insights — working doc

The main area of work from w/c 20 Jul. This doc is the source of truth for
where AI Insights stands in the BrightLocal registry: what was captured from
the live product, what shape the data seam carries, which screens exist, the
design decisions already made, and what's open. Read alongside
`rules/15-proposal-module.md` (the agent-facing rules) and
`sidecars/proposal-data.md` (the seam contract).

## What AI Insights is

BrightLocal's headline featureset: an AI-generated assessment of a location's
local-search presence. One prose summary + a Location Score + per-module
scores + a set of insights, each carrying a diagnostic, a recommendation, and
concrete actions that deep-link into product tools.

It currently lives across BOTH platforms (the interim state):

- **New platform** (`app.brightlocal.com/locations/<id>/summary`) — the
  Location Summary page: welcome hero (greeting + summary + counts + donut),
  "Build your foundation" module cards, "Your visibility", competitors table.
  Each module card's sparkle button opens a right-hand sidebar of insights.
- **Old platform** (`tools.brightlocal.com/.../location-dashboard/<id>/insights`)
  — the full AI Insights page: Generate button + update quota, Location Score
  + foundations/visibility lists, **At a Glance** (3 bullets), then
  **Actions & Insights** — the full cards with Insight paragraph,
  Recommendation paragraph, and per-action deep links.

The new-platform sidebar is a condensed rendering of the old-platform page.
**Labels differ between the two** — modelled, not fudged (see the label map
below).

## The captured reference: -1 Studios

`lib/data/minus-one-studios.json` is a VERBATIM capture of the live product
for Ali's real location (-1 Studios, London NW1 6TZ, ref `1STUDIOS-NW16TZ`,
captured 17 Jul 2026):

- Location Score **19** = Foundation **37** + Visibility **1** (verified
  against the live donut — see score model below)
- Foundation: Website & Content 25, GBP 38, Reviews 32, Citations 59 — with
  every sub-metric bar as shown live
- Visibility: Google Maps 2 (avg rank 17.8 ↗1.2, top-3 share 0%), Organic 0
- All 5 insights with **26 actions** verbatim, including per-action links
  ("Go to Active Sync", "Go to Local Search Grid", "Go to Get Reviews"…)
- The real 11-row competitors table (BBC Maida Vale's 435,784,519 links and
  all)
- The real welcome paragraph as `summaries.standard`; At-a-Glance bullets
  verbatim

This is the fixture that keeps the demo honest: `<ProposalDataProvider
dataset="minus-one-studios">` renders the real thing. The two fictional
datasets (`harbour-co` = healthy, `northside-dental` = needs attention) carry
the same shape with story-coherent numbers.

## The data shape (aiInsights + friends)

Full contract in `sidecars/proposal-data.md`. The short version:

```
aiInsights: {
  lastUpdated, updatesLeft,
  counts: { insights, recommendations },   // recommendations = total actions
  tone: "standard",
  summaries: { concise | standard | detailed },   // TEXT variants
  atAGlance: [3 strings],
  items: [{
    id, area, areaLabel, severity,
    title,               // outcome-phrased headline
    insight,             // long diagnostic paragraph
    recommendation,      // summary paragraph
    action,              // mirrors actions[0].text (legacy binds)
    actions: [{ text, links?: [{ label, area? }] }],
  }],
}
foundation.<websiteContent|gbp|reviews|citations>:
  { label, insightsLabel, area, score, subMetrics: [{ label, score }] }
visibility: { keyword, googleMaps: { score, avgRank, avgRankDelta,
  topThreeShare, topThreeShareDelta }, organic: { score } }
competitors: [{ avgRank, name, rating, reviewCount, categories, links,
  authority, self? }]
scoreModel: { locationScore, foundation, visibility }   // weights, defaults only
```

### Decisions already made (don't relitigate casually)

1. **TEXT VARIES, NUMBERS DON'T** (Ali, 17 Jul). Tone/verbosity variants live
   ONLY in `summaries`; `tone` picks one; the provider resolves
   `aiInsights.summary` after every merge. Switching voice is a one-key patch
   (`data={{ aiInsights: { tone: "concise" } }}`). `summary` is derived —
   never author it. The pattern extends to item text later if needed
   (per-tone `insights`/`recommendations` maps) without touching numbers.
2. **Location Score is arithmetic, never authored.** Weights captured from
   the live "How your location score is calculated" popover: overall = 50%
   foundation + 50% visibility; foundation = Website 30 / GBP 30 / Reviews 20
   / Citations 20; visibility = Maps 60 / Organic 40.
   `computeLocationScore(data)` → `{ overall, foundation, visibility }`.
   Verified against -1 Studios: .3×25 + .3×38 + .2×32 + .2×59 → 37;
   .6×2 + .4×0 → 1; midpoint 19. ✓
3. **Deep links belong to ACTIONS**, not cards — the live product attaches
   them per action, sometimes two. A card's single CTA = the first link found
   across its actions.
4. **Hub-and-spoke / progressive disclosure** (vs the live page's
   "mental" hierarchy): hub surfaces show the TOPLINE module score (+ weakest
   sub-metric as a one-line hint); the full sub-metric bars and insight cards
   live on each module's own page. Management wanted all bars on the hub —
   that's a render variant, not a data change.
5. **Same data points everywhere.** `metrics.ai*` (the HubStatCard binding on
   the AI Insights landing) must mirror `foundation.<module>.score` — every
   dataset patches the two together. The landing, summary page, and
   drill-downs can never disagree.
6. **Tone control is a MODELLED PRODUCT FEATURE** (Ali, 17 Jul), not a
   demo tweak: a Concise/Standard/Detailed segmented pill in the hero of
   both the AI Insights landing and Location Summary. Screen-level
   `useState` + a nested `ProposalDataProvider data={{ aiInsights: { tone } }}`
   stacked inside the shell's dataset provider — the seam derives
   `summary`, so only text changes. `ToneSwitcher` (data-hook
   `tone-switcher`) is currently duplicated per screen; promote to
   `@brightlocal/proposal` if a third screen wants it.
7. **Promoted lib components** (17 Jul): `ScoreDonut` (`lib/score-donut.jsx`,
   Figma-fat ring — stroke defaults to ~15% of size; band colours red <40 /
   amber <70 / green) and `MiniStat`/`MiniStatStrip` (`lib/mini-stat.jsx`,
   the "small insights" tiles). Both ship in `@brightlocal/proposal`; both
   have sidecars + contracts so they're inspectable in Studio. Never
   hand-roll a donut or stat tile again. Remaining hand-rolled donuts
   (Location Summary, drill-downs, hub) still to be swept onto the lib.
8. **`--bl-surface-muted` = #f2f7f3** (Ali, 17 Jul): the tile surface is a
   NEUTRAL (BrightLocal's neutrals carry a warm green cast — it is NOT
   green-50). Hex lives ONLY as the var fallback in `lib/mini-stat.jsx`;
   override the var from the project's custom.css / theme. Mint further
   `--bl-*` component tokens the same way.
9. **Hero composition on the landing** (Ali, 17 Jul): PageHeader carries the
   "AI Insights" title + the ToneSwitcher (its `actions` slot); the card
   does NOT repeat the title — its CardHeader is "Location score" with
   Last-updated in `CardAction`. Body: 4-col `gap-4` grid, donut 1fr /
   summary 3fr (paragraph left-aligns with tile 2), MiniStat strip below.
   No At-a-Glance, no counts/badge meta row. `atAGlance` stays in the seam
   (the old-platform reference screen still binds it).
10. **Card padding via `density="condensed"`**, never `p-*` classNames —
    the DS Card bakes py-8/px-8 at default density and padding overrides
    are deny-listed (CLASSNAME_OVERRIDES.md). Density is the knob.
11. **MCP saves must merge `designs.state`** — tags & friends live as
    sibling keys of `appSource` (STUDIO-TAGS T0). The fix is in
    `apps/mcp-server/src/designs.ts`; a stale running server binary
    clobbers tags on save — rebuild + restart the gradeui-dev MCP server
    if tags start dying again.
12. **Harry's shortcut is the architecture**: capture what their system
   generates into JSON, and let presentation recombine it
   (Insight+Recommendation+Actions → Insight+Actions, tone shifts, etc.).
   No LLM processing pipeline needed while prototyping.

### The interim label map (old ↔ new)

| Seam key         | area id       | New card (label)        | Old sidebar (insightsLabel) | Old page tag |
| ---------------- | ------------- | ----------------------- | --------------------------- | ------------ |
| `websiteContent` | `website-seo` | Website and content     | Web Performance             | WEBSITE      |
| `gbp`            | `gbp-manager` | Google Business Profile | GBP                         | GBP          |
| `reviews`        | `reviews`     | Reviews                 | Reviews                     | REVIEWS      |
| `citations`      | `citations`   | Citations               | Citations                   | CITATIONS    |

Old-page foundations list also uses "Website & Content", "Google Maps /
Local Pack", "Google Organic". `label` + `insightsLabel` carry the two we
render; add a third key only if a screen actually needs the old-page variant.

## Screens (project: "Brightlocal Vision - Share")

All five author `dataset="minus-one-studios"`; Alt+T tweaker switches live.

| Screen                                | id              | What it shows                                                          |
| ------------------------------------- | --------------- | ---------------------------------------------------------------------- |
| Location Summary                      | `dmrp1zpedr1co` | Hero + computed donut + topline foundation cards + visibility + competitors |
| AI Insights (landing)                 | `dmrotrgwxijez` | Donut hero + At a Glance + 4 module cards (goto → sub pages)           |
| AI Insights - Website and Content     | `dmrouiz2ajnqw` | Module donut + full sub-metric bars + area insights                     |
| AI Insights - Google Business Profile | `dmrouiz5q03hr` | Same pattern, `gbp` / `gbp-manager`                                     |
| AI Insights - Reviews                 | `dmrouizaw0c9u` | Same pattern, `reviews`                                                 |
| AI Insights - Citations               | `dmrouize7iinr` | Same pattern, `citations`                                               |
| Location Hub - New Template           | `dmrnwiqjdknxy` | Hero + Location Score donut card + 6 HubStatCards                       |
| Current (ish)                         | `dmrlv6h0vxr2d` | The old-platform page clone (reference)                                 |

Shared render conventions: `ScoreDonut` (inline SVG, stroke-dasharray),
score colour thresholds red <40 / amber <70 / green, DS Card needs
`max-w-none` for full-width use, severity `high` renders as the "Priority"
chip.

## Known gaps / annoyances

- The registry `Progress` contract is missing `value`/`max`/`color`
  (sidecar props block incomplete) — pages hand-roll bars until fixed.
  Fix `sidecars/progress.md` + regen contracts.
- `Button`/plain elements have no `goto` — per-action link buttons on the
  drill-downs are visual only. Consider a goto affordance (or HubStatCard-
  style stamping) if action links should navigate in the prototype.
- Foundation card titles truncate against the View button at 4-up width on
  the summary screen.
- The Location Hub authors ACME project data with no dataset — its donut
  shows the Blackberry defaults (65/76/54). Pin it if the whole flow should
  read as -1 Studios.
- "AI Insights - Export Report" screen (`dmrouizhd7lcw`) is still a stub.

## Next week — candidate workstreams

1. ~~**Tone/verbosity switching in the UI**~~ — DONE (17 Jul): shipped as a
   modelled product feature on the landing + summary heroes (decision #6).
2. **Generate flow** — what does "Generate insights" do in the prototype?
   (Fake a regenerate: cycle datasets, decrement `updatesLeft`, update
   `lastUpdated`.)
3. **Insight lifecycle** — done/dismissed states per action or per insight;
   where does that state live (seam? screen-local?).
4. **Export Report** sub page + white-label story.
5. **Font/hierarchy pass** — the live page's type hierarchy is the thing we
   are explicitly improving on; codify the hub-and-spoke type scale.
6. **More captures** — a second real location (healthy one, if available)
   would replace one fictional dataset with real texture end-to-end.
