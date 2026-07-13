// Citations Hub — Citations vertical hub: score summary, sync status, directory table, Build Citations CTA.
//
// First vertical hub template (the "lazy prompt" answer for "start with
// the hub page for Citations"). Same shell mount as page-skeleton.jsx —
// SidebarProvider > GlobalLayout > GlobalLayoutSidebar > Sidebar compound
// family — with the Citations nav item active and citations-specific
// content per rules/05-product-map.md. Edit freely; re-run
// `node scripts/generate-registry-templates.mjs`.

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TypographyH2,
} from "@brightlocal/ui-components";

const TOP_ITEMS = [{ id: "your-locations", label: "Your Locations" }];

const LOCATION_ITEMS = [
  { id: "location-summary", label: "Location Summary" },
  { id: "ai-insights", label: "AI Insights" },
  { id: "rankings", label: "Rankings" },
  { id: "local-search-grid", label: "Local Search Grid" },
  { id: "citations", label: "Citations", active: true },
  { id: "gbp", label: "GBP" },
  { id: "reputation-reviews", label: "Reputation & Reviews" },
];

const TOOL_ITEMS = [
  { id: "location-manager", label: "Location Manager" },
  { id: "white-label", label: "White-label" },
];

const DIRECTORIES = [
  { id: "google", name: "Google Business Profile", status: "Live", nap: "Accurate" },
  { id: "bing", name: "Bing Places", status: "Live", nap: "Accurate" },
  { id: "apple", name: "Apple Maps", status: "Sync issue", nap: "Phone mismatch" },
  { id: "yelp", name: "Yelp", status: "Live", nap: "Accurate" },
  { id: "facebook", name: "Facebook", status: "Pending", nap: "—" },
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
                {item.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function CitationsHub() {
  return (
    <SidebarProvider dataHook="citations-hub-sidebar-provider" defaultOpen>
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
          <GlobalLayoutContentHeader dataHook="page-header">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar dataHook="location-avatar">
                <AvatarFallback>BF</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <TypographyH2 dataHook="page-title">Citations</TypographyH2>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                  <span>Blackberry Farm Park · Lewes, BN8 6JD</span>
                  <Badge dataHook="location-status">Active</Badge>
                </div>
              </div>
            </div>
            <Button dataHook="build-citations-button">Build Citations</Button>
          </GlobalLayoutContentHeader>

          <GlobalLayoutContentBody dataHook="page-body">
            <div className="flex flex-col gap-6">
              {/* Score summary row */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card variant="filled" dataHook="stat-citations-found">
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Citations found
                    </p>
                    <p className="text-2xl font-bold">53 / 60</p>
                    <p className="text-muted-foreground text-xs">
                      7 opportunities available
                    </p>
                  </CardContent>
                </Card>
                <Card variant="filled" dataHook="stat-nap-accuracy">
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      NAP accuracy
                    </p>
                    <p className="text-2xl font-bold">92%</p>
                    <p className="text-muted-foreground text-xs">
                      1 listing needs attention
                    </p>
                  </CardContent>
                </Card>
                <Card variant="filled" dataHook="stat-sync-status">
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Listings sync
                    </p>
                    <p className="text-2xl font-bold">4 / 5</p>
                    <p className="text-muted-foreground text-xs">
                      Last synced 13 Jul 2026
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Directory table */}
              <div>
                <TypographyH2 dataHook="directories-title">
                  Directories
                </TypographyH2>
                <p className="text-muted-foreground text-sm">
                  Where your business listing appears and how accurate it is.
                </p>
              </div>
              <Card variant="filled" dataHook="directories-card">
                <CardContent>
                  <Table dataHook="directories-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Directory</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>NAP accuracy</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DIRECTORIES.map((d) => (
                        <TableRow key={d.id} dataHook={`directory-${d.id}-row`}>
                          <TableCell>{d.name}</TableCell>
                          <TableCell>
                            <Badge dataHook={`directory-${d.id}-status`}>
                              {d.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{d.nap}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </GlobalLayoutContentBody>
        </GlobalLayoutContent>
      </GlobalLayout>
    </SidebarProvider>
  );
}
