// Page Skeleton — Side navigation + location page header + content region, from the live dashboard.
//
// Hand-authored scaffold matching the CURRENT logged-in dashboard
// (July 2026 screenshot: Blackberry Farm Park / Location Summary).
// Structure only — the content region is a placeholder to build on.
// Edit freely; re-run `node scripts/generate-registry-templates.mjs`.

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  Logo,
  Separator,
} from "@brightlocal/ui-components";

const NAV_GROUPS = [
  {
    id: "top",
    items: [{ id: "your-locations", label: "Your Locations" }],
  },
  {
    id: "location",
    items: [
      { id: "location-summary", label: "Location Summary", active: true },
      { id: "ai-insights", label: "AI Insights" },
      { id: "rankings", label: "Rankings" },
      { id: "local-search-grid", label: "Local Search Grid" },
      { id: "citations", label: "Citations" },
      { id: "gbp", label: "GBP" },
      { id: "reputation-reviews", label: "Reputation & Reviews" },
    ],
  },
  {
    id: "tools",
    items: [
      { id: "location-manager", label: "Location Manager" },
      { id: "white-label", label: "White-label" },
    ],
  },
];

export default function PageSkeleton() {
  return (
    <div className="flex min-h-screen bg-background" data-hook="page-skeleton">
      {/* ── Side navigation ── */}
      <aside
        className="flex w-60 shrink-0 flex-col border-r bg-sidebar-background"
        data-hook="app-sidebar"
      >
        <div className="px-4 py-4">
          <Logo dataHook="sidebar-logo" />
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id} className="flex flex-col gap-1">
              {gi > 0 && <Separator className="my-2" />}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-hook={`nav-${item.id}`}
                  className={
                    item.active
                      ? "flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-left text-sm font-medium text-sidebar-accent-foreground"
                      : "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3">
          <Card variant="border" density="condensed" dataHook="sidebar-user-card">
            <CardContent>
              <div className="flex items-center gap-2">
                <Avatar dataHook="sidebar-user-avatar">
                  <AvatarFallback>HB</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Harry Brignull</p>
                  <p className="truncate text-xs text-muted-foreground">
                    brightlocal@brig…
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </aside>

      {/* ── Page column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Page header — location identity */}
        <header
          className="flex items-center justify-between gap-4 border-b px-6 py-4"
          data-hook="page-header"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar dataHook="location-avatar">
              <AvatarFallback>BF</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold" data-hook="page-title">
                Blackberry Farm Park
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Lewes, BN8 6JD</span>
                <span>★ 4.3 (878 reviews)</span>
                <Badge dataHook="location-status">Active</Badge>
              </div>
            </div>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            Last updated: 12/07/26
          </span>
        </header>

        {/* Page content — placeholder region to build on */}
        <main className="flex-1 overflow-y-auto p-6" data-hook="page-content">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            <Card variant="filled" dataHook="content-primary-card">
              <CardContent>
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Primary content — welcome card, score, insights.
                </p>
              </CardContent>
            </Card>
            <div>
              <h2 className="text-lg font-semibold" data-hook="section-title">
                Section title
              </h2>
              <p className="text-sm text-muted-foreground">
                One-line section description.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Card variant="filled" dataHook="section-card-1">
                <CardContent>
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Section card
                  </p>
                </CardContent>
              </Card>
              <Card variant="filled" dataHook="section-card-2">
                <CardContent>
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Section card
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
