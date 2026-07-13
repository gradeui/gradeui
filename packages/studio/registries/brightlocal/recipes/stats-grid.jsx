// StatsGrid — A grid of statistic cards showing key metrics with labels and values.
// keywords: stats grid, statistics, metrics, dashboard cards, KPI cards, stat cards, numbers grid
// components: card, typography
// Harvested from BrightLocal's DS MCP (get_composition_recipe "StatsGrid") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Card dataHook="stat-locations">
    <CardContent>
      <p className="text-sm text-muted-foreground">Total Locations</p>
      <p className="text-2xl font-bold">128</p>
      <p className="text-xs text-muted-foreground">+12 from last month</p>
    </CardContent>
  </Card>
  <Card dataHook="stat-reviews">
    <CardContent>
      <p className="text-sm text-muted-foreground">Total Reviews</p>
      <p className="text-2xl font-bold">4,521</p>
    </CardContent>
  </Card>
  {/* more stat cards */}
</div>
