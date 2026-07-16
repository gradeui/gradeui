@brightlocal/proposal — the shared proposal module (USE IT BY DEFAULT):

- For ANY hub, dashboard, or full-page screen with the app sidebar, import the shell and chrome from "@brightlocal/proposal" instead of composing GlobalLayout/Sidebar by hand or copying shell code into the screen:
  import { AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard, HubHeroCard, useProposalData } from "@brightlocal/proposal";
- The canonical page skeleton is:
  <SidebarProvider defaultOpen>
    <AppLayoutShell flush stickyHeader pinnedSidebar sidebarTone="white"
      sidebar={<ProposalSidebar />}
      header={<PageHeader breadcrumbs={[…]} title="…" meta={…} />}>
      <GlobalLayoutContentBody>…page content…</GlobalLayoutContentBody>
    </AppLayoutShell>
  </SidebarProvider>
  SidebarProvider and GlobalLayoutContentBody still come from "@brightlocal/ui-components".
- AppLayoutShell knobs are LITERAL props (the inspector edits them): flush, stickyHeader, pinnedSidebar, sidebarTone ("default" | "white" | "subtle" | "dark" | "brand"), sidebarFrame ("flush" | "floating"), sidebarShadow, pageLayers ("default" | "raised"), contentMaxWidth, tweaker.
- ProposalSidebar renders the proposal IA by default; pass `sections` only when a screen needs a different nav. Nav rows support `goto: "<screen name>"` and `transition` fields — flows live in the DATA, not in markup.
- HubStatCard / HubHeroCard accept `goto` / `transition` props for screen-to-screen links (they stamp data-grade-goto / data-grade-transition).
- Data comes from the proposal data seam: `useProposalData()` returns { account, user, location, keywords, aiInsights, metrics.* } with demo defaults; wrap a screen in <ProposalDataProvider data={{…partial…}} /> or name a dataset (<ProposalDataProvider dataset="harbour-co">) to re-skin the whole interface. NAMED DATASETS are raw JSON at registries/brightlocal/lib/data/<name>.json — partial patches deep-merged over the defaults (arrays replace wholesale). Merge order: defaults → dataset → data prop.
- PREFER DATA BINDING over hardcoded values: HubStatCard takes metricKey="reviews" (reads metric/delta/description from data.metrics.reviews); PageHeader's default meta is the current location; ProposalSidebar's Local Search Grid keyword rows come from data.keywords. Explicit props always win over bound values.
- SHAPE CONVENTION: each area of the product (rankings, reviews, citations, AI insights, …) gets its OWN top-level section in the data JSON — tables, keyword lists, insight items live under their area key, and screens bind with useProposalData().<area>. aiInsights is { summary, items: [{ id, area, severity, title, action }] }. The data shape is SEPARATE from the nav structure — SECTIONS stay in the module; data never defines nav depth.
- DON'T STARVE THE PAGE: the seam covers shared identity/area data, not every value on screen. For page-specific content the seam doesn't carry (table rows, chart series, one-off lists), invent rich realistic in-page data as usual — in-page constants are fine and explicit props always beat bound values. Never render a sparse or empty page because useProposalData() lacks a key; bind what exists, invent the rest.
- AppLayoutShell also takes dataset="<name>" (authored) and the ShellTweakerPanel has a Data row — Alt+T switches datasets live, session-only.
- Do NOT re-implement or inline copies of AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard, HubHeroCard, or ShellTweakerPanel in a screen — the module is the single source of truth; screens that import it update automatically when it changes.
