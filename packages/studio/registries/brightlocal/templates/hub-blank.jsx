// Blank Hub — the SECTION-PAGE STARTER (nav model v2, 18 Jul): shell +
// sidenav + page header, EMPTY body. Duplicate/generate one per
// top-level nav section, set `activeId` + the header copy, then build
// the page. This is the seed for "each top-level menu item goes to a
// page": generate a batch of these, wire navLinks in the project data,
// and the whole IA becomes walkable before any page has real content.
//
// The shell/sidenav/header live in the shared registry module — see
// hub-page.jsx for the fully-built example and rules/15 for the module
// contract. Hand-authored — safe from harvest re-runs. Edit freely;
// re-run `node scripts/generate-registry-templates.mjs`.

import {
  SidebarProvider,
  SidebarTrigger,
  GlobalLayoutContentBody,
  Logo,
} from "@brightlocal/ui-components";
import { Menu } from "@brightlocal/icons";
import {
  AppLayoutShell,
  ProposalSidebar,
  PageHeader,
  ProposalDataProvider,
} from "@brightlocal/proposal";

// ─── Per-screen wiring ───────────────────────────────────────────────
// activeId: WHICH nav row this page is (its section highlights and its
// sub rows appear — nav model v2 reveals subs by navigation, not
// disclosure). navLinks: row id → screen name, per-project data.
const PROJECT_DATA = {
  navLinks: {
    // "rankings": "Rankings Table",
  },
};

export default function App() {
  return (
    <ProposalDataProvider data={PROJECT_DATA}>
      <SidebarProvider dataHook="provider" defaultOpen>
        <AppLayoutShell
          flush
          stickyHeader
          pinnedSidebar
          sidebarTone="white"
          dataHook="blank-app-layout"
          sidebar={
            <ProposalSidebar
              dataHook="blank-sidebar"
              // ← SET ME: the nav row this page represents.
              activeId="rankings"
            />
          }
          mobileBar={
            <div className="flex items-center gap-3 border-b px-4 py-3 lg:hidden">
              <SidebarTrigger dataHook="mobile-trigger">
                <Menu className="size-5" />
              </SidebarTrigger>
              <Logo className="h-5" dataHook="mobile-logo" />
            </div>
          }
          header={
            <PageHeader
              dataHook="blank-page-header"
              breadcrumbs={[
                // goto by ID — ids survive renames; names are only a
                // hand-authoring fallback. These are the canonical
                // BrightLocal share-project screens.
                { label: "All Locations", goto: "screen:dmrotrgstba3l" }, // All Locations
                { bind: "location", goto: "screen:dmrnwiqjdknxy" }, // Location Hub - New Template
              ]}
              // ← SET ME: the page's name.
              title="Section title"
            />
          }
        >
          <GlobalLayoutContentBody
            dataHook="blank-page-body"
            className="space-y-6"
          >
            {/* Build the page here. The seam carries identity/location/
                metrics via useProposalData(); page-specific tables and
                charts stay invented in-page (don't starve the page —
                rules/15). */}
            <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-[var(--ds-tailwind-colors-neutral-200)] text-sm text-[var(--ds-tailwind-colors-neutral-400)]">
              Page content goes here
            </div>
          </GlobalLayoutContentBody>
        </AppLayoutShell>
      </SidebarProvider>
    </ProposalDataProvider>
  );
}
