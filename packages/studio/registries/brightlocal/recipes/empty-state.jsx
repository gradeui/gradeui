// EmptyState — An empty state placeholder with illustration, message, and call-to-action button.
// keywords: empty state, no results, no data, placeholder, zero state, blank state, getting started
// components: card, button, typography
// Harvested from BrightLocal's DS MCP (get_composition_recipe "EmptyState") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<Card dataHook="empty-state" className="flex flex-col items-center justify-center py-16 text-center">
  <CardContent>
    <div className="mx-auto mb-4 size-16 text-muted-foreground">
      {/* icon or illustration */}
    </div>
    <h3 className="text-lg font-semibold">No items yet</h3>
    <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first item.</p>
    <Button dataHook="empty-cta" className="mt-6">Create Item</Button>
  </CardContent>
</Card>
