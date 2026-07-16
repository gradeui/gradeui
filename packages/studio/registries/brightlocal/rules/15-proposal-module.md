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
- Data comes from the proposal data seam: `useProposalData()` returns { account, user, location, metrics.* } with demo defaults; wrap a screen in <ProposalDataProvider data={{…partial…}}> to re-skin the whole interface. Prefer reading metrics/location from the hook over hardcoding values.
- Do NOT re-implement or inline copies of AppLayoutShell, ProposalSidebar, PageHeader, HubStatCard, HubHeroCard, or ShellTweakerPanel in a screen — the module is the single source of truth; screens that import it update automatically when it changes.
