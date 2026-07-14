// Page Skeleton — Sidebar shell + location page header + content region, DS compounds throughout.
//
// Composed the way BrightLocal's own blocks-sidebar--default story does:
// SidebarProvider > GlobalLayout > GlobalLayoutSidebar > Sidebar(...) +
// GlobalLayoutContent > ContentHeader / ContentBody. No hand-rolled nav —
// the sidebar body is the shipped Sidebar compound family. Nav content
// matches the live logged-in dashboard (July 2026: Blackberry Farm Park /
// Location Summary). The content body is a placeholder region to build on.
// Edit freely; re-run `node scripts/generate-registry-templates.mjs`.

import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  GlobalLayout,
  GlobalLayoutContent,
  GlobalLayoutContentBody,
  GlobalLayoutContentHeader,
  GlobalLayoutSidebar,
  Logo,
  Separator,
  Sidebar,
  SidebarAccountDropdown,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  TypographyH2,
} from "@brightlocal/ui-components";
import {
  Building,
  Globe,
  Grid3x3,
  House,
  LayoutDashboard,
  Link,
  Menu,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";

// Sidebar nav icons: 20px (size-5), default stroke — the project's
// curated convention (rules/05-product-map.md). Deliberately NOT the
// live platform's 24px/1.33, which contradicts their own docs.
const TOP_ITEMS = [
  { id: "your-locations", label: "Your Locations", icon: House },
];

const LOCATION_ITEMS = [
  {
    id: "location-summary",
    label: "Location Summary",
    icon: LayoutDashboard,
    active: true,
  },
  { id: "ai-insights", label: "AI Insights", icon: Sparkles },
  { id: "rankings", label: "Rankings", icon: TrendingUp },
  { id: "local-search-grid", label: "Local Search Grid", icon: Grid3x3 },
  { id: "citations", label: "Citations", icon: Link },
  { id: "gbp", label: "GBP", icon: Store },
  { id: "reputation-reviews", label: "Reputation & Reviews", icon: Star },
];

const TOOL_ITEMS = [
  { id: "location-manager", label: "Location Manager", icon: Building },
  { id: "white-label", label: "White-label", icon: Globe },
];

function NavGroup({ items }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                dataHook={`nav-${item.id}`}
                isActive={item.active}
              >
                {item.icon ? <item.icon className="size-5" /> : null}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function PageSkeleton() {
  return (
    <SidebarProvider dataHook="page-skeleton-sidebar-provider" defaultOpen>
      <GlobalLayout dataHook="global-layout">
        <GlobalLayoutSidebar dataHook="global-layout-sidebar">
          <Sidebar dataHook="app-sidebar">
            <SidebarHeader>
              <Logo className="h-6" dataHook="sidebar-logo" />
            </SidebarHeader>
            <SidebarContent dataHook="sidebar-content">
              <NavGroup items={TOP_ITEMS} />
              <Separator spacing="md" dataHook="sidebar-separator-1" />
              <NavGroup items={LOCATION_ITEMS} />
              <Separator spacing="md" dataHook="sidebar-separator-2" />
              <NavGroup items={TOOL_ITEMS} />
            </SidebarContent>
            <SidebarFooter dataHook="sidebar-footer">
              {/* Account menu — the shipped SidebarAccountDropdown
                  (name/email trigger + divider-grouped menu), mounted
                  exactly as the DS's own story does. */}
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarAccountDropdown
                    dataHook="sidebar-account-dropdown"
                    name="Harry Brignull"
                    email="brightlocal@brignull.com"
                    avatar={
                      <Avatar dataHook="sidebar-user-avatar">
                        <AvatarFallback>HB</AvatarFallback>
                      </Avatar>
                    }
                    menuGroups={[
                      [
                        { label: "Account settings" },
                        { label: "Notification preferences" },
                      ],
                      [{ label: "Log out" }],
                    ]}
                    side="top"
                    align="end"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        </GlobalLayoutSidebar>

        <GlobalLayoutContent dataHook="global-layout-content">
          {/* Mobile top bar — the live platform's responsive shell: the
              sidebar is hidden below lg, and this bar (hamburger + logo)
              takes over. SidebarTrigger opens the DS's built-in mobile
              sheet — no hand-rolled drawer. Menu (≡) matches the live
              platform's icon; size-11 = 44px minimum touch target with
              the size-5 glyph matching the sidebar nav icons. No border
              — the live platform's mobile bar has no dividing line. */}
          <header className="flex items-center gap-2 px-3 py-2 lg:hidden">
            <SidebarTrigger dataHook="mobile-sidebar-trigger" className="size-11">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-6" dataHook="mobile-logo" />
          </header>
          {/* Page header — location identity */}
          <GlobalLayoutContentHeader dataHook="page-header">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar dataHook="location-avatar">
                <AvatarFallback>BF</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <TypographyH2 dataHook="page-title">
                  Blackberry Farm Park
                </TypographyH2>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <span>Lewes, BN8 6JD</span>
                  <span>★ 4.3 (878 reviews)</span>
                  <Badge dataHook="location-status">Active</Badge>
                </div>
              </div>
            </div>
            <span className="text-muted-foreground shrink-0 text-sm">
              Last updated: 12/07/26
            </span>
          </GlobalLayoutContentHeader>

          {/* Page content — placeholder region to build on */}
          <GlobalLayoutContentBody dataHook="page-body">
            <div className="flex flex-col gap-6">
              <Card variant="filled" dataHook="content-primary-card">
                <CardContent>
                  <p className="text-muted-foreground py-10 text-center text-sm">
                    Primary content — welcome card, score, insights.
                  </p>
                </CardContent>
              </Card>
              <div>
                <TypographyH2 dataHook="section-title">
                  Section title
                </TypographyH2>
                <p className="text-muted-foreground text-sm">
                  One-line section description.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Card variant="filled" dataHook="section-card-1">
                  <CardContent>
                    <p className="text-muted-foreground py-10 text-center text-sm">
                      Section card
                    </p>
                  </CardContent>
                </Card>
                <Card variant="filled" dataHook="section-card-2">
                  <CardContent>
                    <p className="text-muted-foreground py-10 text-center text-sm">
                      Section card
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </GlobalLayoutContentBody>
        </GlobalLayoutContent>
      </GlobalLayout>
    </SidebarProvider>
  );
}
