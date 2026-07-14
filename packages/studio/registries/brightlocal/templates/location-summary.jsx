// Location Summary — The near-product location summary: app shell + canonical photo header + welcome/insights card, Location Score, foundation cards.
//
// Composed from the verified building blocks: page-skeleton's app shell
// (sidebar + mobile bar + Andy Smith persona), the location-page-header
// recipe (hand-authored from the LIVE platform DOM), and the summary
// body from the live "Welcome back" page (14 Jul screenshot): welcome
// card + insights CTA, Location Score with Foundation/Visibility
// sub-scores, and the Build-your-foundation cards with per-metric
// progress rows. Edit freely; re-run
// `node scripts/generate-registry-templates.mjs`.

import {
  AspectRatio,
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
  Progress,
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
  TypographySmall,
} from "@brightlocal/ui-components";
import {
  Building,
  Globe,
  Grid3x3,
  House,
  LayoutDashboard,
  Link as LinkIcon,
  MapPin,
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

const WEBSITE_METRICS = [
  { id: "conversion-ux", label: "Conversion UX", score: 15 },
  { id: "keyword-coverage", label: "Keyword coverage", score: 100 },
  { id: "page-optimization", label: "Page optimization", score: 100 },
  { id: "technical-health", label: "Technical health", score: 60 },
  { id: "local-intent", label: "Local intent & linking", score: 14 },
];

const GBP_METRICS = [
  { id: "activity", label: "Activity & freshness", score: 100 },
  { id: "conversion-tracking", label: "Conversion tracking", score: 50 },
  { id: "profile-completeness", label: "Profile completeness", score: 60 },
  { id: "nap-alignment", label: "NAP alignment", score: 30 },
  { id: "category-accuracy", label: "Category & service accuracy", score: 30 },
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

function MetricRow({ id, label, score }) {
  return (
    <div className="flex items-center gap-3" data-hook={`metric-${id}-row`}>
      <span className="w-40 shrink-0 text-sm">{label}</span>
      <Progress value={score} className="h-2 flex-1" dataHook={`metric-${id}-progress`} />
      <span className="text-muted-foreground w-16 shrink-0 text-right text-sm tabular-nums">
        {score}/100
      </span>
    </div>
  );
}

export default function LocationSummary() {
  return (
    <SidebarProvider dataHook="location-summary-sidebar-provider" defaultOpen>
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

          {/* Canonical page header — the location-page-header recipe. */}
          <GlobalLayoutContentHeader dataHook="page-header">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div
                className="flex w-full flex-col gap-4 md:flex-row md:items-center"
                data-hook="location-header-card"
              >
                <div className="w-full md:hidden">
                  <AspectRatio dataHook="location-header-card-photo-sm" ratio={21 / 9}>
                    <img
                      alt="Brighton Bierhaus location photo"
                      className="h-full w-full rounded-xl object-cover"
                      src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
                    />
                  </AspectRatio>
                </div>
                <div className="hidden w-24 shrink-0 md:block">
                  <AspectRatio dataHook="location-header-card-photo-lg" ratio={16 / 10}>
                    <img
                      alt="Brighton Bierhaus location photo"
                      className="h-full w-full rounded-xl object-cover"
                      src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80"
                    />
                  </AspectRatio>
                </div>
                <div className="flex flex-col gap-1.5">
                  <TypographyH2 dataHook="location-business-name">
                    Brighton Bierhaus
                  </TypographyH2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      <span>Brighton and Hove, BN2 0JB</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="size-3.5 fill-yellow-400 stroke-yellow-400" />
                      <span>4.6 (539 reviews)</span>
                    </span>
                    <span className="basis-full md:basis-auto">
                      {/* Status badge — success tokens via className: the DS
                          ships no success variant (rules/90-audit.md). */}
                      <Badge
                        dataHook="location-status-badge-active"
                        className="border-transparent bg-success-background text-success-foreground"
                      >
                        Active
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
              <div className="md:shrink-0">
                <TypographySmall dataHook="location-last-updated">
                  Last updated: 14/07/26
                </TypographySmall>
              </div>
            </div>
          </GlobalLayoutContentHeader>

          <GlobalLayoutContentBody dataHook="page-body">
            <div className="flex flex-col gap-6">
              {/* Welcome + Location Score — the welcome-insights-card
                  recipe (full width, donut ring, Sparkles CTA). Copied,
                  not included: screens are self-contained JSX — the
                  recipe file is the authoring source; re-sync on change. */}
              <Card variant="filled" className="w-full max-w-none" dataHook="welcome-card">
                <CardContent>
                  <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                    <div className="flex flex-col gap-3">
                      <TypographyH2 dataHook="welcome-title">
                        Welcome back, Andy Smith
                      </TypographyH2>
                      <p className="text-muted-foreground max-w-prose text-sm">
                        Brighton Bierhaus has a strong Google presence with an
                        excellent rating and plenty of photos. The fastest
                        gains now are to fix website blockers, strengthen
                        local signals on your site, expand your GBP to capture
                        takeaway searches, and close citation gaps to lift
                        visibility across Brighton.
                      </p>
                      <div className="text-muted-foreground flex items-center gap-4 text-sm">
                        <span>5 insights</span>
                        <span>28 recommendations</span>
                      </div>
                      <div>
                        <Button dataHook="see-all-insights-button">
                          See all insights
                          <Sparkles />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2" data-hook="location-score">
                      <span className="text-muted-foreground text-sm">
                        Location Score
                      </span>
                      <div className="relative size-36">
                        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            strokeWidth="10"
                            className="stroke-muted"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="326.7"
                            strokeDashoffset={326.7 * (1 - 32 / 100)}
                            className="stroke-orange-400"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-display text-4xl font-semibold">
                            32
                          </span>
                          <span className="text-muted-foreground text-xs">
                            /100
                          </span>
                        </div>
                      </div>
                      <div className="text-muted-foreground flex gap-4 text-xs">
                        <span>Foundation 64/100</span>
                        <span>Visibility 0/100</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Build your foundation */}
              <div>
                <TypographyH2 dataHook="foundation-title">
                  Build your foundation
                </TypographyH2>
                <p className="text-muted-foreground text-sm">
                  Your foundations are what impact how easily you get found
                  online.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {/* foundation-metric-card recipe ×2 (copied; recipe file
                    is the authoring source). */}
                <Card variant="filled" className="max-w-none" dataHook="website-content-card">
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Globe className="text-muted-foreground size-5" />
                        <span className="text-sm font-medium">
                          Website and content
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">68</span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {WEBSITE_METRICS.map((m) => (
                          <MetricRow key={m.id} {...m} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card variant="filled" className="max-w-none" dataHook="gbp-card">
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Store className="text-muted-foreground size-5" />
                        <span className="text-sm font-medium">
                          Google Business Profile
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">54</span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {GBP_METRICS.map((m) => (
                          <MetricRow key={m.id} {...m} />
                        ))}
                      </div>
                    </div>
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
