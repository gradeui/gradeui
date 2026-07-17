---
name: ProposalDataProvider
import: "@brightlocal/proposal"
props:
  - dataset?: string — Named dataset from lib/data/*.json ("harbour-co", "northside-dental", "minus-one-studios"); "default" = no patch. Applied between the defaults and the data prop.
  - data? — Partial data object, deep-merged LAST (explicit data beats the dataset). Arrays replace wholesale.
  - children — Subtree that reads the merged data via useProposalData().
when_to_use: Re-skin a whole screen's data in one move — account, user, location, keywords, aiInsights, foundation, visibility, competitors, metrics, navLinks. Mount ONCE per screen (or not at all — the context default IS the demo data, so provider-less screens render Acme/Blackberry). Providers STACK - a nested provider merges over its parent, so a screen-level provider carrying project navLinks survives the shell/tweaker mounting a dataset provider inside it.
composes_with: [AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard]
---

The proposal DATA SEAM ("switch the data and it would be magic"). Shape
matched to the LIVE Location Summary page (17 Jul). Each product area
gets its OWN top-level key:

- `account`, `user`, `location` (name/address/phone SEPARATE — NAP
  discipline; plus `rating: { value, count }` for the header chip),
  `keywords`, `navLinks` (nav row id → screen name or { goto, transition }).
- `aiInsights` — the hero + insights sidebar. TEXT VARIES, NUMBERS
  DON'T: `summaries` holds the prose paragraph in multiple tones
  (concise / standard / detailed), `tone` picks one, and the provider
  surfaces the resolved string at `aiInsights.summary` — bind that ONE
  key; switch voice with a one-key patch
  (`data={{ aiInsights: { tone: "concise" } }}`). To change a variant's
  TEXT, patch `summaries.<tone>` — `summary` itself is derived, never
  authored. `atAGlance` is the 3-bullet executive summary; `counts:
  { insights, recommendations }` feeds the "5 insights · 26
  recommendations" row (recommendations = total actions);
  `updatesLeft` is the regeneration-quota chip. `items` mirror the
  full AI Insights page (which also backs the summary page's per-card
  sidebar): `{ id, area, areaLabel, severity, title, insight,
  recommendation, action, actions: [{ text, links?: [{ label,
  area? }] }] }` — `area` is the nav row id (drill-through via
  navLinks), `areaLabel` the old-platform sidebar name ("Web
  Performance" ↔ the "Website and content" card), `insight` the long
  diagnostic paragraph, `recommendation` the summary paragraph,
  `action` mirrors `actions[0].text` (collapsed view). DEEP LINKS
  BELONG TO ACTIONS (the live page attaches "Go to Active Sync" etc.
  per action, sometimes two); a card's single CTA = the first link
  found across its actions. Screens compose these keys freely — hero
  quotes `summary`, a compact card renders title + action, the full
  page renders insight + recommendation + all actions.
- `foundation.<websiteContent|gbp|reviews|citations>` — the "Build your
  foundation" cards: `{ label, insightsLabel, area, score, subMetrics:
  [{ label, score }] }`, all scores /100. HUB-AND-SPOKE: hub cards show
  the topline `score` and drill through `area` → navLinks to the module
  page; `subMetrics` belong on the drill-down (or a dense variant).
- `visibility` — `keyword` + `googleMaps: { score, avgRank,
  avgRankDelta, topThreeShare, topThreeShareDelta }` + `organic:
  { score }`. Deltas are signed numbers; render direction from sign.
- `competitors` — `[{ avgRank, name, rating, reviewCount, categories,
  links, authority, self? }]`; `self: true` = the location's own row.
- `metrics.<module>` — the hub stat-card strings (HubStatCard binds
  metric/delta/description). Unchanged contract; keep values coherent
  with foundation/visibility.

NEVER author Location Score numbers — the donut + Foundation/Visibility
sub-scores are ARITHMETIC over `scoreModel` weights (overall = 50/50
foundation/visibility; foundation = Website 30 / GBP 30 / Reviews 20 /
Citations 20; visibility = Maps 60 / Organic 40). Compute with
`computeLocationScore(data)` → `{ overall, foundation, visibility }`.

```jsx
import {
  ProposalDataProvider,
  useProposalData,
  computeLocationScore,
} from "@brightlocal/proposal";

export default function App() {
  return (
    <ProposalDataProvider dataset="minus-one-studios">…</ProposalDataProvider>
  );
}

function Hero() {
  const data = useProposalData(); // merged: defaults → dataset → data prop
  const score = computeLocationScore(data); // { overall: 19, foundation: 37, visibility: 1 }
  return (
    <>
      <h2>Welcome back, {data.user.name}</h2>
      <p>{data.aiInsights.summary}</p> {/* resolved from summaries[tone] */}
      <Donut value={score.overall} />
    </>
  );
}
```

DON'T STARVE THE PAGE: the seam covers shared identity/area data only.
Page-specific tables/charts/lists stay invented in-page as usual — bind
what exists, invent the rest, never render sparse because a key is
missing. Related exports: PROPOSAL_DATA (the defaults),
PROPOSAL_DATASETS (the named patches), computeLocationScore(data),
buildProposalSections(data) (the nav model with keyword rows + navLinks
applied).
