// Hub Page — Location hub: proposal shell + hub header + a responsive grid of HubStatCards linking into each module.
//
// FIRST SCREEN of the @brightlocal/proposal era (STUDIO-FLOWS M0): the
// shell, sidenav, page header and hub cards live in the shared registry
// module — packages/studio/registries/brightlocal/lib/proposal.jsx —
// and this template is JUST THE PAGE. Editing proposal.jsx (nav IA,
// card anatomy, shell presets) updates every screen that imports it;
// screens still carrying in-file copies stay as they are and migrate
// on regen. Data rides the ProposalDataProvider seam: the defaults ARE
// the demo data, so this screen mounts nothing — wrap in
// <ProposalDataProvider data={{...}}> to re-skin account/user/location/
// metrics in one move ("switch the data and it would be magic").
// Hand-authored — safe from harvest re-runs. Edit freely; re-run
// `node scripts/generate-registry-templates.mjs`.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import {
  Globe,
  Grid3x3,
  Link,
  Menu,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  HubStatCard,
  HubHeroCard,
} from "@brightlocal/proposal";

export default function App() {
  return (
    <SidebarProvider dataHook="switcher-sidebar-provider" defaultOpen>
      {/* Layout knobs are LITERAL props so the inspector can edit them —
          select the shell (click the page background) and flip
          flush / stickyHeader / pinnedSidebar / sidebarTone. */}
      <AppLayoutShell
        flush={true}
        stickyHeader={true}
        pinnedSidebar={true}
        sidebarTone="white"
        sidebar={<ProposalSidebar dataHook="app-sidebar" />}
        header={
          // meta omitted ON PURPOSE — PageHeader's default meta is
          // data-bound (location name + status from useProposalData,
          // read at render position so dataset switches reach it).
          <PageHeader
            breadcrumbs={[{ label: "Your Locations", href: "#" }]}
            title="Location Hub"
            dataHook="page-header"
          />
        }
        mobileBar={
          <header className="flex items-center gap-1 px-1 py-1 lg:hidden">
            <SidebarTrigger dataHook="mobile-sidebar-trigger" className="size-11">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-6" dataHook="mobile-logo" />
          </header>
        }
        dataHook="app-layout"
      >
        <GlobalLayoutContentBody dataHook="page-body">
          <HubHeroCard
            title="Get more from your local presence"
            description="AI Insights reviews your listings, rankings and reviews together and tells you the three things to fix first."
            primaryCta="Run AI Insights"
            primaryHook="hub-hero-primary"
            secondaryCta="See how it works"
            secondaryHook="hub-hero-secondary"
            dataHook="hub-hero-card"
          />
          {/* Tracks own the sizing — Card bakes max-w-[400px], hence
              max-w-none inside HubStatCard. metricKey = full data
              binding: metric/delta/description come from
              data.metrics.<key> at render position, so dataset
              switches (tweaker Data row, ProposalDataProvider) re-skin
              every card live. */}
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <HubStatCard
              icon={Star}
              title="Reviews"
              metricKey="reviews"
              ctaHook="hub-reviews-cta"
              dataHook="hub-reviews-card"
            />
            <HubStatCard
              icon={TrendingUp}
              title="Rankings"
              metricKey="rankings"
              goto="Rankings Table"
              ctaHook="hub-rankings-cta"
              dataHook="hub-rankings-card"
            />
            <HubStatCard
              icon={Link}
              title="Citations"
              metricKey="citations"
              ctaHook="hub-citations-cta"
              dataHook="hub-citations-card"
            />
            <HubStatCard
              icon={Grid3x3}
              title="Local Search Grid"
              metricKey="localSearchGrid"
              ctaHook="hub-lsg-cta"
              dataHook="hub-lsg-card"
            />
            <HubStatCard
              icon={Store}
              title="GBP Manager"
              metricKey="gbpManager"
              ctaHook="hub-gbp-cta"
              dataHook="hub-gbp-card"
            />
            <HubStatCard
              icon={Globe}
              title="Website SEO"
              metricKey="websiteSeo"
              ctaHook="hub-seo-cta"
              dataHook="hub-seo-card"
            />
          </div>
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
