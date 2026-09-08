"use client";

// Skeleton page for every product area that is NOT part of this
// prototype (Rankings, Citations, GBP Manager, ...). The sidebar and the
// Location Hub still link to them, so each lands here with the real
// shell and the proposal module's empty state rather than a 404.
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger, GlobalLayoutContentBody, Logo } from "@brightlocal/ui-components";
import { Menu } from "@brightlocal/icons";
import { AppLayoutShell, ProposalSidebar, PageHeader, EmptyPrototypePage } from "@brightlocal/proposal";
import { SKELETON_AREAS, relativePath } from "@/lib/screens";

export default function SkeletonAreaPage() {
  const rel = relativePath(usePathname());
  const area = SKELETON_AREAS.find((a) => a.path === rel);
  const label = area?.label ?? "This area";
  const activeId = rel.split("/")[0] ?? "";
  return (
    <SidebarProvider dataHook="provider" defaultOpen>
      <AppLayoutShell
        preset="live-site"
        stickyHeader
        flush
        pinnedSidebar
        dataHook="skeleton-app-layout"
        sidebar={<ProposalSidebar dataHook="skeleton-sidebar" activeId={activeId} />}
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
            dataHook="skeleton-page-header"
            breadcrumbs={[
              { label: "All Locations", goto: "screen:dmrotrgstba3l" },
              { bind: "location", goto: "screen:dmrurue2wmp9u" },
            ]}
            title={label}
            description="Coming soon in this prototype"
          />
        }
      >
        <GlobalLayoutContentBody dataHook="skeleton-page-body" className="pb-10">
          <EmptyPrototypePage
            title={`${label} is not in this prototype yet`}
            description="This prototype covers the Reviews area: the hub, Review Manager, Review Tracker, Review Builder and Review Showcase. Press Cmd+K to jump to any of them."
          />
        </GlobalLayoutContentBody>
      </AppLayoutShell>
    </SidebarProvider>
  );
}
