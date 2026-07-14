// Location Dashboard — Full location overview: identity card, score, customer actions, rankings tabs.
//
// Hand-authored scaffold reconstructed from BrightLocal's Lab
// "Location Dashboard" composition (storybook lab-location-dashboard —
// its story source is minified upstream, so this is the editable
// recreation; see BYODS-BRIGHTLOCAL-PLAN.md client findings).
// Everything below is verified-rendering BL vocabulary. Edit freely —
// this file is the authoring home; re-run
// `node scripts/generate-registry-templates.mjs` after changes.

import {
  Avatar,
  AvatarFallback,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@brightlocal/ui-components";
import {
  Building,
  Globe,
  Grid3x3,
  House,
  LayoutDashboard,
  Link as LinkIcon,
  Menu,
  Sparkles,
  Star,
  Store,
  TrendingUp,
} from "@brightlocal/icons";

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
  { id: "citations", label: "Citations", icon: LinkIcon },
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

export default function LocationDashboard() {
  return (
    <SidebarProvider dataHook="location-dashboard-sidebar-provider" defaultOpen>
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
                    name="Andy Smith"
                    email="andy@acmecorp.com"
                    avatar={
                      <Avatar dataHook="sidebar-user-avatar">
                        <AvatarFallback>AS</AvatarFallback>
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
          {/* Mobile top bar — see rules/05-product-map.md. */}
          <header className="flex items-center gap-1 px-1 py-1 lg:hidden">
            <SidebarTrigger dataHook="mobile-sidebar-trigger" className="size-11">
              <Menu className="size-5" />
            </SidebarTrigger>
            <Logo className="h-6" dataHook="mobile-logo" />
          </header>

          {/* Page header — breadcrumb + date scope (this page keeps its
              identity in the body card, so the header stays the
              breadcrumb bar like the live dashboard). */}
          <GlobalLayoutContentHeader dataHook="page-header">
            <Breadcrumb dataHook="location-breadcrumb">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">All locations</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Bailiffscourt Hotel &amp; Spa</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button variant="outline" dataHook="date-scope-button">
              April 23rd, 2026
            </Button>
          </GlobalLayoutContentHeader>

          <GlobalLayoutContentBody dataHook="page-body">
            <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card variant="filled" dataHook="location-card">
          <CardHeader dataHook="location-card-header">
            <CardTitle>Bailiffscourt Hotel &amp; Spa</CardTitle>
            <CardDescription>★ 4.4 (764 reviews)</CardDescription>
            <CardAction>
              <Badge dataHook="location-status">Active</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1 text-sm text-muted-foreground">
              <span>Littlehampton, BN17 5RW</span>
              <span>Hotel</span>
              <span>+44 1903 723511</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" dataHook="edit-location-button">
              Edit location
            </Button>
          </CardFooter>
        </Card>

        {/* Location score */}
        <Card variant="filled" dataHook="location-score-card">
          <CardHeader>
            <CardTitle>Location Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-2">
              <span className="text-6xl font-semibold" data-hook="location-score-value">
                58
              </span>
              <Badge dataHook="location-score-delta">+3 since April 16</Badge>
              <p className="pt-2 text-center text-sm text-muted-foreground">
                You&rsquo;re ranking #1 locally for &ldquo;hotel spa
                retreat&rdquo; and outperforming 6 of your 10 nearest
                competitors on website authority.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer actions — nested condensed stat tiles */}
        <Card variant="filled" dataHook="customer-actions-card">
          <CardHeader dataHook="customer-actions-header">
            <CardTitle>Customer actions</CardTitle>
            <CardDescription>This month vs last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Card density="condensed" variant="filled" dataHook="call-clicks-tile">
                <CardContent>
                  <p className="text-sm text-muted-foreground">Call clicks</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold">312</span>
                    <Badge dataHook="call-clicks-delta">↑ 8%</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card density="condensed" variant="filled" dataHook="website-clicks-tile">
                <CardContent>
                  <p className="text-sm text-muted-foreground">Website clicks</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold">1,847</span>
                    <Badge dataHook="website-clicks-delta">↑ 14%</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card density="condensed" variant="filled" dataHook="direction-requests-tile">
                <CardContent>
                  <p className="text-sm text-muted-foreground">Direction requests</p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-semibold">428</span>
                    <Badge variant="destructive" dataHook="direction-requests-delta">
                      ↓ 3%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Rankings — full-width tabs section */}
        <Card variant="filled" className="lg:col-span-3" dataHook="visibility-card">
          <CardHeader dataHook="visibility-header">
            <CardTitle>Visibility</CardTitle>
            <CardDescription>
              Rank tracking across Google Search, Maps, and citations.
            </CardDescription>
            <CardAction>
              <Button dataHook="run-audit-button">Run new audit</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rankings" dataHook="visibility-tabs">
              <TabsList>
                <TabsTrigger value="rankings" dataHook="tab-rankings">
                  Rank Tracking
                </TabsTrigger>
                <TabsTrigger value="citations" dataHook="tab-citations">
                  Citation Health
                </TabsTrigger>
              </TabsList>
              <TabsContent value="rankings">
                <div className="grid gap-3 py-4 sm:grid-cols-3">
                  <Card density="condensed" variant="filled" dataHook="avg-position-tile">
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Avg. ranking position</p>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold">2.2</span>
                        <Badge dataHook="avg-position-delta">↑ 0.9 better</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card density="condensed" variant="filled" dataHook="top3-tile">
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Keywords in top 3</p>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold">28</span>
                        <Badge dataHook="top3-delta">↑ 4 keywords</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  <Card density="condensed" variant="filled" dataHook="citations-tile">
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Citations found</p>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-semibold">53 / 60</span>
                        <Badge variant="outline" dataHook="citations-status">
                          Action needed
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="citations">
                <p className="py-6 text-sm text-muted-foreground">
                  Citation health details — replace with a DataTable of
                  directories once the blocks source lands.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
            </div>
          </GlobalLayoutContentBody>
        </GlobalLayoutContent>
      </GlobalLayout>
    </SidebarProvider>
  );
}
