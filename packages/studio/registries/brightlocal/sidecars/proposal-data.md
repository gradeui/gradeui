---
name: ProposalDataProvider
import: "@brightlocal/proposal"
props:
  - dataset?: string — Named dataset from lib/data/*.json ("harbour-co", "northside-dental"); "default" = no patch. Applied between the defaults and the data prop.
  - data? — Partial data object, deep-merged LAST (explicit data beats the dataset). Arrays replace wholesale.
  - children — Subtree that reads the merged data via useProposalData().
when_to_use: Re-skin a whole screen's data in one move — account, user, location, keywords, aiInsights, metrics, navLinks. Mount ONCE per screen (or not at all — the context default IS the demo data, so provider-less screens render Acme/Blackberry). Providers STACK - a nested provider merges over its parent, so a screen-level provider carrying project navLinks survives the shell/tweaker mounting a dataset provider inside it.
composes_with: [AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard]
---

The proposal DATA SEAM ("switch the data and it would be magic"). Shape
convention: each product area gets its OWN top-level key — account,
user, location, keywords, aiInsights ({ summary, items: [{id, area,
severity, title, action}] }), metrics.<module>, navLinks (nav row id →
screen name or { goto, transition }). Read it anywhere with the hook:

```jsx
import { ProposalDataProvider, useProposalData } from "@brightlocal/proposal";

const SCREEN_DATA = {
  location: { name: "ACME Plumbing Co. — Chicago Eastside", status: "Active" },
  keywords: ["plumber near me", "emergency drain cleaning", "water heater repair"],
  navLinks: { "rk-table": "Rankings Table" },
};

export default function App() {
  return (
    <ProposalDataProvider data={SCREEN_DATA}>…</ProposalDataProvider>
  );
}

function Anywhere() {
  const data = useProposalData(); // merged: defaults → dataset → data prop
  return <span>{data.location.name}</span>;
}
```

DON'T STARVE THE PAGE: the seam covers shared identity/area data only.
Page-specific tables/charts/lists stay invented in-page as usual — bind
what exists, invent the rest, never render sparse because a key is
missing. Related exports: PROPOSAL_DATA (the defaults),
PROPOSAL_DATASETS (the named patches), buildProposalSections(data) (the
nav model with keyword rows + navLinks applied).
