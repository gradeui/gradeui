// PageHeader — A page header with title, description, breadcrumb, and action buttons.
// keywords: page header, page title, header with breadcrumb, page heading, title bar, section header
// components: breadcrumb, button, typography
// Harvested from BrightLocal's DS MCP (get_composition_recipe "PageHeader") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

<div>
  <Breadcrumb dataHook="page-breadcrumb">
    <BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem><BreadcrumbPage>Locations</BreadcrumbPage></BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
  <div className="mt-4 flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
      <p className="text-sm text-muted-foreground">Manage your business locations.</p>
    </div>
    <Button dataHook="add-location">Add Location</Button>
  </div>
</div>
